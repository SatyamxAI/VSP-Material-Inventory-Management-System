// controllers/inventoryController.js
const db = require('../config/db');

exports.getTransactions = async (req, res) => {
    try {
        const { material_id, department_id, type, from, to, page = 1, limit = 30 } = req.query;
        let sql = `SELECT it.*, m.material_code, m.material_name, m.unit_of_measure,
                          d.dept_name, u.name as performed_by_name, mr.request_no
                   FROM inventory_transactions it
                   JOIN materials m ON it.material_id = m.id
                   JOIN users u ON it.performed_by = u.id
                   LEFT JOIN departments d ON it.department_id = d.id
                   LEFT JOIN material_requests mr ON it.request_id = mr.id WHERE 1=1`;
        const params = [];
        if (material_id) { sql += ` AND it.material_id = ?`; params.push(material_id); }
        if (department_id) { sql += ` AND it.department_id = ?`; params.push(department_id); }
        if (type) { sql += ` AND it.transaction_type = ?`; params.push(type); }
        if (from) { sql += ` AND DATE(it.transaction_date) >= ?`; params.push(from); }
        if (to)   { sql += ` AND DATE(it.transaction_date) <= ?`; params.push(to); }
        sql += ` ORDER BY it.transaction_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
        const [rows] = await db.query(sql, params);
        res.json({ success: true, transactions: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getReservations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, m.material_code, m.material_name, m.unit_of_measure,
                   d.dept_name, mr.request_no
            FROM reservations r JOIN materials m ON r.material_id = m.id
            JOIN departments d ON r.department_id = d.id JOIN material_requests mr ON r.request_id = mr.id
            WHERE r.status IN ('Active','Waitlist') ORDER BY r.created_at DESC`);
        res.json({ success: true, reservations: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getInventoryHealth = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.id, m.material_code, m.material_name, mc.category_name,
                   m.current_stock, m.reserved_stock, m.available_stock,
                   m.safety_stock, m.reorder_level, m.unit_of_measure, m.unit_price,
                   (m.current_stock * m.unit_price) as stock_value,
                   CASE
                       WHEN m.current_stock <= 0 THEN 'Zero Stock'
                       WHEN m.current_stock <= m.safety_stock THEN 'Critical'
                       WHEN m.current_stock <= m.reorder_level THEN 'Low'
                       ELSE 'Adequate'
                   END as health_status
            FROM materials m JOIN material_categories mc ON m.category_id = mc.id
            WHERE m.material_status = 'Active'
            ORDER BY FIELD(health_status,'Zero Stock','Critical','Low','Adequate'), m.material_code`);
        res.json({ success: true, inventory: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
