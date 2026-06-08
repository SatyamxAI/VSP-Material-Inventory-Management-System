// controllers/reportController.js
const db = require('../config/db');

exports.getDeptConsumption = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        let dateWhere = '';
        if (from && to)  { dateWhere = ' AND DATE(it.transaction_date) BETWEEN ? AND ?'; params.push(from, to); }
        else if (from)   { dateWhere = ' AND DATE(it.transaction_date) >= ?'; params.push(from); }
        else if (to)     { dateWhere = ' AND DATE(it.transaction_date) <= ?'; params.push(to); }

        const [rows] = await db.query(
            `SELECT d.dept_name, d.dept_code, SUM(it.quantity) as total_qty, SUM(it.total_value) as total_value,
                   COUNT(DISTINCT it.material_id) as material_types, COUNT(*) as transactions
            FROM inventory_transactions it JOIN departments d ON it.department_id = d.id
            WHERE it.transaction_type = 'Issue' ${dateWhere}
            GROUP BY it.department_id ORDER BY total_qty DESC`, params);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getMaterialConsumption = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        let dateWhere = '';
        if (from && to)  { dateWhere = ' AND DATE(it.transaction_date) BETWEEN ? AND ?'; params.push(from, to); }
        else if (from)   { dateWhere = ' AND DATE(it.transaction_date) >= ?'; params.push(from); }
        else if (to)     { dateWhere = ' AND DATE(it.transaction_date) <= ?'; params.push(to); }

        const [rows] = await db.query(
            `SELECT m.material_code, m.material_name, mc.category_name,
                   SUM(it.quantity) as total_qty, SUM(it.total_value) as total_value,
                   COUNT(*) as transactions
            FROM inventory_transactions it JOIN materials m ON it.material_id = m.id
            JOIN material_categories mc ON m.category_id = mc.id
            WHERE it.transaction_type = 'Issue' ${dateWhere}
            GROUP BY it.material_id ORDER BY total_qty DESC LIMIT 50`, params);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getMonthlyTrend = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month_key,
                   DATE_FORMAT(transaction_date, '%b %Y') as month_label,
                   SUM(quantity) as total_qty, SUM(total_value) as total_value, COUNT(*) as transactions
            FROM inventory_transactions WHERE transaction_type = 'Issue'
            AND transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month_key, month_label ORDER BY month_key`);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getStockStatus = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.material_code, m.material_name, mc.category_name,
                   m.current_stock, m.reserved_stock, m.available_stock,
                   m.safety_stock, m.reorder_level, m.unit_of_measure, m.unit_price,
                   (m.current_stock * m.unit_price) as stock_value,
                   CASE WHEN m.current_stock <= 0 THEN 'Zero'
                        WHEN m.current_stock <= m.safety_stock THEN 'Critical'
                        WHEN m.current_stock <= m.reorder_level THEN 'Low'
                        ELSE 'OK' END as stock_status
            FROM materials m JOIN material_categories mc ON m.category_id = mc.id
            WHERE m.material_status = 'Active'
            ORDER BY FIELD(
                CASE WHEN m.current_stock <= 0 THEN 'Zero'
                     WHEN m.current_stock <= m.safety_stock THEN 'Critical'
                     WHEN m.current_stock <= m.reorder_level THEN 'Low'
                     ELSE 'OK' END,
                'Zero','Critical','Low','OK'
            ), m.material_code`);
        res.json({ success: true, data: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getAllocationEfficiency = async (req, res) => {
    try {
        const [[stats]] = await db.query(
            `SELECT
                COUNT(*) as total_allocations,
                SUM(CASE WHEN allocation_type = 'Full' THEN 1 ELSE 0 END) as full_count,
                SUM(CASE WHEN allocation_type = 'Partial' THEN 1 ELSE 0 END) as partial_count,
                SUM(CASE WHEN allocation_type = 'Waitlisted' THEN 1 ELSE 0 END) as waitlisted_count,
                SUM(allocated_quantity) as total_allocated,
                SUM(shortage_quantity) as total_shortage
            FROM allocations`);
        res.json({ success: true, data: stats });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const { module, action, user_id, from, to, page = 1, limit = 50 } = req.query;
        let sql = `SELECT * FROM audit_logs WHERE 1=1`;
        const params = [];
        if (module)  { sql += ` AND module = ?`;  params.push(module); }
        if (action)  { sql += ` AND action = ?`;  params.push(action); }
        if (user_id) { sql += ` AND user_id = ?`; params.push(user_id); }
        if (from)    { sql += ` AND DATE(created_at) >= ?`; params.push(from); }
        if (to)      { sql += ` AND DATE(created_at) <= ?`; params.push(to); }
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
        const [rows] = await db.query(sql, params);
        res.json({ success: true, logs: rows });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};
