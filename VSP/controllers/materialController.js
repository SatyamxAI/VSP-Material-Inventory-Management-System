// controllers/materialController.js
const db = require('../config/db');
const AuditService = require('../services/AuditService');
const AlertEngine = require('../services/AlertEngine');

exports.getAll = async (req, res) => {
    try {
        const { search, category, status, low_stock, page = 1, limit = 50 } = req.query;
        let sql = `SELECT m.*, mc.category_name, mc.category_code
                   FROM materials m JOIN material_categories mc ON m.category_id = mc.id WHERE 1=1`;
        const params = [];
        if (search) {
            sql += ` AND (m.material_code LIKE ? OR m.material_name LIKE ? OR mc.category_name LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (category) { sql += ` AND m.category_id = ?`; params.push(category); }
        if (status)   { sql += ` AND m.material_status = ?`; params.push(status); }
        if (low_stock === 'true') { sql += ` AND m.current_stock <= m.reorder_level`; }
        sql += ` ORDER BY m.material_code LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
        const [rows] = await db.query(sql, params);
        const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM materials m JOIN material_categories mc ON m.category_id = mc.id WHERE 1=1`, []);
        res.json({ success: true, materials: rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching materials.' });
    }
};

exports.getById = async (req, res) => {
    try {
        const [[mat]] = await db.query(
            `SELECT m.*, mc.category_name FROM materials m JOIN material_categories mc ON m.category_id = mc.id WHERE m.id = ?`,
            [req.params.id]
        );
        if (!mat) return res.status(404).json({ success: false, message: 'Material not found.' });
        res.json({ success: true, material: mat });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.create = async (req, res) => {
    try {
        const { material_code, material_name, category_id, unit_of_measure, storage_location,
                current_stock, safety_stock, reorder_level, unit_price, description, specifications } = req.body;
        if (!material_code || !material_name || !category_id)
            return res.status(400).json({ success: false, message: 'Code, name, and category are required.' });
        const [result] = await db.query(
            `INSERT INTO materials (material_code, material_name, category_id, unit_of_measure, storage_location,
             current_stock, safety_stock, reorder_level, unit_price, description, specifications, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [material_code, material_name, category_id, unit_of_measure || 'Nos', storage_location || '',
             current_stock || 0, safety_stock || 0, reorder_level || 0, unit_price || 0,
             description || '', specifications || '', req.user.id]
        );
        await AuditService.log({ user: req.user, action: 'CREATE', module: 'Materials',
            recordId: result.insertId, recordType: 'Material',
            newValues: req.body, description: `Created material ${material_code}`, req });
        await AlertEngine.checkMaterial({ id: result.insertId, ...req.body });
        res.status(201).json({ success: true, message: 'Material created.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Material code already exists.' });
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.update = async (req, res) => {
    try {
        const [[old]] = await db.query(`SELECT * FROM materials WHERE id = ?`, [req.params.id]);
        if (!old) return res.status(404).json({ success: false, message: 'Material not found.' });
        const fields = ['material_name','category_id','unit_of_measure','storage_location','current_stock',
                        'safety_stock','reorder_level','unit_price','material_status','description','specifications'];
        const updates = [];
        const vals = [];
        fields.forEach(f => {
            if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
        });
        if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
        vals.push(req.params.id);
        await db.query(`UPDATE materials SET ${updates.join(', ')} WHERE id = ?`, vals);
        await AuditService.log({ user: req.user, action: 'UPDATE', module: 'Materials',
            recordId: req.params.id, recordType: 'Material',
            oldValues: old, newValues: req.body, description: `Updated material ${old.material_code}`, req });
        res.json({ success: true, message: 'Material updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.adjustStock = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { adjustment_type, quantity, remarks } = req.body;
        if (!adjustment_type || !quantity) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ success: false, message: 'Type and quantity required.' });
        }
        const [[mat]] = await conn.query(`SELECT * FROM materials WHERE id = ? FOR UPDATE`, [req.params.id]);
        if (!mat) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ success: false, message: 'Material not found.' });
        }
        const qty = parseFloat(quantity);
        const before = parseFloat(mat.current_stock);
        let after = before;
        if (adjustment_type === 'Adjustment_In') after = before + qty;
        else if (adjustment_type === 'Adjustment_Out') after = Math.max(0, before - qty);
        else if (adjustment_type === 'Return') after = before + qty;
        await conn.query(`UPDATE materials SET current_stock = ? WHERE id = ?`, [after, req.params.id]);
        const txnNo = `ADJ-${Date.now()}`;
        await conn.query(
            `INSERT INTO inventory_transactions (transaction_no, transaction_type, material_id, quantity, stock_before, stock_after, unit_price, total_value, performed_by, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [txnNo, adjustment_type, req.params.id, qty, before, after, mat.unit_price, (qty * mat.unit_price).toFixed(2), req.user.id, remarks || '']
        );
        await conn.commit();
        conn.release();
        
        await AlertEngine.checkMaterial({ ...mat, current_stock: after });
        await AuditService.log({ user: req.user, action: 'STOCK_ADJUST', module: 'Materials',
            recordId: req.params.id, description: `Stock adjusted: ${before} → ${after} (${adjustment_type})`, req });
        res.json({ success: true, message: 'Stock adjusted.', stock_before: before, stock_after: after });
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM material_categories WHERE is_active = 1 ORDER BY category_name`);
        res.json({ success: true, categories: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, mc.category_name FROM materials m JOIN material_categories mc ON m.category_id = mc.id
             WHERE m.current_stock <= m.reorder_level AND m.material_status = 'Active'
             ORDER BY (m.current_stock / NULLIF(m.reorder_level,0)) ASC`
        );
        res.json({ success: true, materials: rows, count: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const [[mat]] = await db.query(`SELECT * FROM materials WHERE id = ?`, [req.params.id]);
        if (!mat) return res.status(404).json({ success: false, message: 'Material not found.' });
        if (mat.reserved_stock > 0)
            return res.status(400).json({ success: false, message: 'Cannot deactivate material with active reservations.' });

        await db.query(`UPDATE materials SET material_status = 'Inactive' WHERE id = ?`, [req.params.id]);
        await AuditService.log({ user: req.user, action: 'DELETE', module: 'Materials',
            recordId: req.params.id, description: `Deactivated material ${mat.material_code}`, req });
        res.json({ success: true, message: 'Material deactivated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

