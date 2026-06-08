/**
 * Report Routes
 * 
 * Dashboard summary, inventory transactions, consumption reports.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const MaterialRequest = require('../models/MaterialRequest');
const InventoryTransaction = require('../models/InventoryTransaction');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Department = require('../models/Department');
const MaterialIssue = require('../models/MaterialIssue');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/reports/dashboard
 * Get dashboard summary statistics.
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const [
      totalMaterials,
      lowStockCount,
      pendingRequests,
      activeAlerts,
      totalUsers,
      totalDepartments
    ] = await Promise.all([
      Material.count(),
      Material.countLowStock(),
      MaterialRequest.countPending(),
      Alert.countActive(),
      User.count(),
      Department.count()
    ]);

    res.json({
      success: true,
      dashboard: {
        totalMaterials,
        lowStockCount,
        pendingRequests,
        activeAlerts,
        totalUsers,
        totalDepartments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data.' });
  }
});

/**
 * GET /api/reports/transactions
 * Get recent inventory transactions.
 * Query param: limit (default 100)
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const transactions = await InventoryTransaction.findAll(limit);
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching transactions.' });
  }
});

/**
 * GET /api/reports/transactions/:materialId
 * Get transactions for a specific material.
 */
router.get('/transactions/:materialId', authenticate, async (req, res) => {
  try {
    const transactions = await InventoryTransaction.findByMaterial(req.params.materialId);
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get material transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching material transactions.' });
  }
});

/**
 * GET /api/reports/monthly-consumption
 * Get monthly consumption data for a given year.
 * Query param: year (default current year)
 */
router.get('/monthly-consumption', authenticate, async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const consumption = await InventoryTransaction.getMonthlyConsumption(year);
    res.json({ success: true, year, consumption });
  } catch (error) {
    console.error('Monthly consumption error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly consumption.' });
  }
});

/**
 * GET /api/reports/department-consumption
 * Get department-wise consumption data.
 */
router.get('/department-consumption', authenticate, async (req, res) => {
  try {
    const consumption = await InventoryTransaction.getDepartmentConsumption();
    res.json({ success: true, consumption });
  } catch (error) {
    console.error('Department consumption error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching department consumption.' });
  }
});

/**
 * GET /api/reports/recent-issues
 * Get recent material issues.
 * Query param: limit (default 10)
 */
router.get('/recent-issues', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const issues = await MaterialIssue.findRecent(limit);
    res.json({ success: true, issues });
  } catch (error) {
    console.error('Recent issues error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching recent issues.' });
  }
});

module.exports = router;
