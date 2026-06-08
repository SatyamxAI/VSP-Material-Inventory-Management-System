/**
 * Material Routes
 * 
 * CRUD operations for material management, plus search and low-stock endpoints.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/materials
 * Get all materials with pagination.
 * Query params: page (default 1), limit (default 10)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { rows, total } = await Material.findAll(page, limit);

    res.json({
      success: true,
      materials: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching materials.' });
  }
});

/**
 * GET /api/materials/search
 * Search materials by name, code, or category.
 * Query param: q (search term)
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter (q) is required.'
      });
    }

    const materials = await Material.search(q);
    res.json({ success: true, materials });
  } catch (error) {
    console.error('Search materials error:', error);
    res.status(500).json({ success: false, message: 'Server error searching materials.' });
  }
});

/**
 * GET /api/materials/low-stock
 * Get materials with stock at or below reorder level.
 */
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const materials = await Material.getLowStock();
    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching low stock materials.' });
  }
});

/**
 * GET /api/materials/:id
 * Get a single material by ID.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }
    res.json({ success: true, material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching material.' });
  }
});

/**
 * POST /api/materials
 * Create a new material (admin and store_manager only).
 */
router.post('/', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const {
      material_code, material_name, category, unit,
      current_stock, reorder_level, storage_location
    } = req.body;

    if (!material_code || !material_name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Material code, name, and unit are required.'
      });
    }

    // Check for duplicate material code
    const existing = await Material.findByCode(material_code);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A material with this code already exists.'
      });
    }

    const result = await Material.create({
      material_code, material_name, category, unit,
      current_stock, reorder_level, storage_location
    });

    res.status(201).json({
      success: true,
      message: 'Material created successfully.',
      materialId: result.insertId
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ success: false, message: 'Server error creating material.' });
  }
});

/**
 * PUT /api/materials/:id
 * Update a material (admin and store_manager only).
 */
router.put('/:id', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    const {
      material_code, material_name, category, unit,
      current_stock, reorder_level, storage_location
    } = req.body;

    await Material.update(req.params.id, {
      material_code: material_code || material.material_code,
      material_name: material_name || material.material_name,
      category: category !== undefined ? category : material.category,
      unit: unit || material.unit,
      current_stock: current_stock !== undefined ? current_stock : material.current_stock,
      reorder_level: reorder_level !== undefined ? reorder_level : material.reorder_level,
      storage_location: storage_location !== undefined ? storage_location : material.storage_location
    });

    res.json({ success: true, message: 'Material updated successfully.' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, message: 'Server error updating material.' });
  }
});

/**
 * DELETE /api/materials/:id
 * Delete a material (admin only).
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    await Material.delete(req.params.id);
    res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting material.' });
  }
});

module.exports = router;
