// routes/index.js — Master router
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roleAuth');

// Controllers
const authCtrl       = require('../controllers/authController');
const materialCtrl   = require('../controllers/materialController');
const requestCtrl    = require('../controllers/requestController');
const allocationCtrl = require('../controllers/allocationController');
const dashboardCtrl  = require('../controllers/dashboardController');
const deptCtrl       = require('../controllers/departmentController');
const userCtrl       = require('../controllers/userController');
const alertCtrl      = require('../controllers/alertController');
const inventoryCtrl  = require('../controllers/inventoryController');
const reportCtrl     = require('../controllers/reportController');
const exportCtrl     = require('../controllers/exportController');

// ── AUTH ──────────────────────────────────────────────────────
router.post('/auth/login',  authCtrl.login);
router.get( '/auth/me',     auth, authCtrl.getMe);
router.post('/auth/logout', auth, authCtrl.logout);

// ── DASHBOARD ─────────────────────────────────────────────────
router.get('/dashboard/admin',   auth, role('admin'),                                dashboardCtrl.getAdminDashboard);
router.get('/dashboard/store',   auth, role('admin','store_manager'),                dashboardCtrl.getStoreDashboard);
router.get('/dashboard/dept',    auth, role('dept_head','dept_user'),                dashboardCtrl.getDeptDashboard);

// ── MATERIALS ─────────────────────────────────────────────────
router.get('/materials',               auth, materialCtrl.getAll);
router.get('/materials/categories',    auth, materialCtrl.getCategories);
router.get('/materials/low-stock',     auth, materialCtrl.getLowStock);
router.get('/materials/:id',           auth, materialCtrl.getById);
router.post('/materials',              auth, role('admin','store_manager'), materialCtrl.create);
router.put('/materials/:id',           auth, role('admin','store_manager'), materialCtrl.update);
router.delete('/materials/:id',        auth, role('admin'), materialCtrl.deleteMaterial);
router.post('/materials/:id/adjust',   auth, role('admin','store_manager'), materialCtrl.adjustStock);

// ── REQUESTS (Material Requisition Cart) ──────────────────────
router.get('/requests',                auth, requestCtrl.getAll);
router.get('/requests/types',          auth, requestCtrl.getRequestTypes);
router.get('/requests/:id',            auth, requestCtrl.getById);
router.post('/requests',               auth, role('dept_user','dept_head'), requestCtrl.create);
router.put('/requests/:id/submit',     auth, role('dept_user','dept_head'), requestCtrl.submit);
router.put('/requests/:id/dept-action',auth, role('dept_head'),             requestCtrl.deptApprove);
router.put('/requests/:id/store-review',auth,role('admin','store_manager'), requestCtrl.sendToStoreReview);
router.put('/requests/:id/store-reject',auth,role('admin','store_manager'), requestCtrl.storeReject);
router.put('/requests/:id/cancel',     auth, requestCtrl.cancel);

// ── ALLOCATIONS — STATIC ROUTES FIRST (must come before :id routes) ──
router.get('/allocations/shortage-report', auth, role('admin','store_manager'), allocationCtrl.shortageReport);
router.get('/allocations/report',          auth, role('admin','store_manager'), allocationCtrl.allocationReport);
router.get('/allocations',                 auth, role('admin','store_manager'), allocationCtrl.getAll);
router.post('/allocations/:id/run',        auth, role('admin','store_manager'), allocationCtrl.allocate);
router.post('/allocations/:id/issue',      auth, role('admin','store_manager'), allocationCtrl.issue);

// ── INVENTORY ─────────────────────────────────────────────────
router.get('/inventory/transactions',  auth, inventoryCtrl.getTransactions);
router.get('/inventory/reservations',  auth, role('admin','store_manager'), inventoryCtrl.getReservations);
router.get('/inventory/health',        auth, inventoryCtrl.getInventoryHealth);

// ── DEPARTMENTS ───────────────────────────────────────────────
router.get('/departments',             auth, deptCtrl.getAll);
router.get('/departments/:id',         auth, deptCtrl.getById);
router.post('/departments',            auth, role('admin'), deptCtrl.create);
router.put('/departments/:id',         auth, role('admin'), deptCtrl.update);
router.delete('/departments/:id',      auth, role('admin'), deptCtrl.deleteDept);

// ── USERS ─────────────────────────────────────────────────────
router.get('/users',                   auth, role('admin'), userCtrl.getAll);
router.get('/users/roles',             auth, userCtrl.getRoles);
router.post('/users',                  auth, role('admin'), userCtrl.create);
router.put('/users/:id',               auth, role('admin'), userCtrl.update);

// ── ALERTS ───────────────────────────────────────────────────
router.get('/alerts',                  auth, alertCtrl.getAll);
router.put('/alerts/:id/acknowledge',  auth, alertCtrl.acknowledge);
router.put('/alerts/:id/resolve',      auth, role('admin','store_manager'), alertCtrl.resolve);
router.post('/alerts/run-check',       auth, role('admin','store_manager'), alertCtrl.runCheck);

// ── REPORTS ───────────────────────────────────────────────────
router.get('/reports/dept-consumption',      auth, reportCtrl.getDeptConsumption);
router.get('/reports/material-consumption',  auth, reportCtrl.getMaterialConsumption);
router.get('/reports/monthly-trend',         auth, reportCtrl.getMonthlyTrend);
router.get('/reports/stock-status',          auth, reportCtrl.getStockStatus);
router.get('/reports/allocation-efficiency', auth, reportCtrl.getAllocationEfficiency);
router.get('/reports/audit-logs',            auth, role('admin'), reportCtrl.getAuditLogs);

// ── EXPORTS (PDF and Excel) ──────────────────────
router.get('/export/stock-pdf',               auth, exportCtrl.exportStockPdf);
router.get('/export/stock-excel',             auth, exportCtrl.exportStockExcel);
router.get('/export/dept-consumption-pdf',    auth, exportCtrl.exportDeptConsumptionPdf);
router.get('/export/dept-consumption-excel',  auth, exportCtrl.exportDeptConsumptionExcel);
router.get('/export/monthly-trend-excel',     auth, exportCtrl.exportMonthlyTrendExcel);
router.get('/export/allocation-excel',        auth, exportCtrl.exportAllocationExcel);
router.get('/export/material-consumption-excel', auth, exportCtrl.exportMaterialConsumptionExcel);

module.exports = router;
