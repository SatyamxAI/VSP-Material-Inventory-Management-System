// controllers/alertController.js
const db = require('../config/db');
const AlertEngine = require('../services/AlertEngine');

exports.getAll = async (req, res) => {
    try {
        const { status, severity } = req.query;
        const alerts = await AlertEngine.getActiveAlerts({ status, severity });
        const [[{total_active}]] = await db.query(`SELECT COUNT(*) as total_active FROM alerts WHERE status = 'Active'`);
        res.json({ success: true, alerts, total_active });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.acknowledge = async (req, res) => {
    try {
        await db.query(
            `UPDATE alerts SET status = 'Acknowledged', acknowledged_by = ?, acknowledged_at = NOW() WHERE id = ?`,
            [req.user.id, req.params.id]);
        res.json({ success: true, message: 'Alert acknowledged.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.resolve = async (req, res) => {
    try {
        await db.query(
            `UPDATE alerts SET status = 'Resolved', resolved_by = ?, resolved_at = NOW() WHERE id = ?`,
            [req.user.id, req.params.id]);
        res.json({ success: true, message: 'Alert resolved.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.runCheck = async (req, res) => {
    try {
        await AlertEngine.runLowStockCheck();
        res.json({ success: true, message: 'Alert check completed.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};
