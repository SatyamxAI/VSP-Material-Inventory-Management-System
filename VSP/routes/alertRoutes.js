/**
 * Alert Routes
 * 
 * Manages low-stock and other inventory alerts.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/alerts
 * Get all alerts.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const alerts = await Alert.findAll();
    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching alerts.' });
  }
});

/**
 * GET /api/alerts/active
 * Get only active (unresolved) alerts.
 */
router.get('/active', authenticate, async (req, res) => {
  try {
    const alerts = await Alert.findActive();
    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active alerts.' });
  }
});

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert (admin and store_manager only).
 */
router.put('/:id/resolve', authenticate, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const result = await Alert.resolve(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }
    res.json({ success: true, message: 'Alert resolved successfully.' });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving alert.' });
  }
});

module.exports = router;
