/**
 * Material Request Routes
 * 
 * Handles creation, listing, and status updates for material requests.
 * Includes material issue flow with stock and transaction updates.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const MaterialRequest = require('../models/MaterialRequest');
const MaterialIssue = require('../models/MaterialIssue');
const Material = require('../models/Material');
const InventoryTransaction = require('../models/InventoryTransaction');
const Alert = require('../models/Alert');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/requests
 * Get all material requests with optional filters.
 * Query params: status, department_id
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.department_id) filters.department_id = req.query.department_id;

    // Department users can only see their own department's requests
    if (req.user.role === 'department_user') {
      filters.department_id = req.user.department_id;
    }

    const requests = await MaterialRequest.findAll(filters);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching requests.' });
  }
});

/**
 * GET /api/requests/:id
 * Get a single request by ID.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Department users can only see their own department's requests
    if (req.user.role === 'department_user' && request.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching request.' });
  }
});

/**
 * POST /api/requests
 * Create a new material request.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { material_id, quantity, reason } = req.body;

    if (!material_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Material ID and quantity are required.'
      });
    }

    // Generate unique request number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const request_number = `REQ-${new Date().getFullYear()}-${timestamp}${random}`;

    // Determine department_id from user
    const department_id = req.user.department_id;
    if (!department_id) {
      return res.status(400).json({
        success: false,
        message: 'You must be assigned to a department to create requests.'
      });
    }

    const result = await MaterialRequest.create({
      request_number,
      department_id,
      material_id,
      quantity,
      reason: reason || null,
      requested_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Material request created successfully.',
      requestId: result.insertId,
      request_number
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ success: false, message: 'Server error creating request.' });
  }
});

/**
 * PUT /api/requests/:id/approve
 * Approve a pending request (admin and store_manager only).
 */
router.put('/:id/approve', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a request with status '${request.status}'.`
      });
    }

    await MaterialRequest.updateStatus(req.params.id, 'Approved');
    res.json({ success: true, message: 'Request approved successfully.' });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Server error approving request.' });
  }
});

/**
 * PUT /api/requests/:id/reject
 * Reject a pending request (admin and store_manager only).
 */
router.put('/:id/reject', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a request with status '${request.status}'.`
      });
    }

    await MaterialRequest.updateStatus(req.params.id, 'Rejected');
    res.json({ success: true, message: 'Request rejected successfully.' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting request.' });
  }
});

/**
 * PUT /api/requests/:id/issue
 * Issue materials for an approved request (admin and store_manager only).
 * This endpoint:
 * 1. Creates a material_issues record
 * 2. Updates the request status to 'Issued'
 * 3. Deducts stock from the material
 * 4. Logs an inventory transaction
 * 5. Creates a low-stock alert if needed
 */
router.put('/:id/issue', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Can only issue materials for approved requests. Current status: '${request.status}'.`
      });
    }

    const issued_quantity = req.body.issued_quantity || request.quantity;

    // Check sufficient stock
    const material = await Material.findById(request.material_id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    if (material.current_stock < issued_quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${material.current_stock}, Requested: ${issued_quantity}`
      });
    }

    // 1. Create issue record
    await MaterialIssue.create({
      request_id: req.params.id,
      issued_quantity,
      issued_by: req.user.id
    });

    // 2. Update request status
    await MaterialRequest.updateStatus(req.params.id, 'Issued');

    // 3. Deduct stock
    const newStock = material.current_stock - issued_quantity;
    await Material.updateStock(material.id, newStock);

    // 4. Log transaction
    await InventoryTransaction.create({
      material_id: material.id,
      transaction_type: 'OUT',
      quantity: issued_quantity,
      balance_stock: newStock
    });

    // 5. Check for low stock and create alert if needed
    if (newStock <= material.reorder_level) {
      const existingAlerts = await Alert.findByMaterial(material.id);
      if (existingAlerts.length === 0) {
        await Alert.create({
          material_id: material.id,
          alert_type: 'Low Stock',
          message: `${material.material_name} stock (${newStock}) is below reorder level (${material.reorder_level})`
        });
      }
    }

    res.json({
      success: true,
      message: 'Materials issued successfully.',
      issued_quantity,
      new_stock: newStock
    });
  } catch (error) {
    console.error('Issue materials error:', error);
    res.status(500).json({ success: false, message: 'Server error issuing materials.' });
  }
});

module.exports = router;
