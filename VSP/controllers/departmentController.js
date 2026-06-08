// controllers/departmentController.js
const db = require('../config/db');
const AuditService = require('../services/AuditService');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT d.*, dp.priority_level, dp.priority_score,
                    (SELECT COUNT(*) FROM users WHERE department_id = d.id AND is_active = 1) as user_count
             FROM departments d LEFT JOIN department_priorities dp ON d.id = dp.department_id
             WHERE d.is_active = 1 ORDER BY dp.priority_level, d.dept_name`);
        res.json({ success: true, departments: rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getById = async (req, res) => {
    try {
        const [[dept]] = await db.query(
            `SELECT d.*, dp.priority_level, dp.priority_score FROM departments d
             LEFT JOIN department_priorities dp ON d.id = dp.department_id WHERE d.id = ?`, [req.params.id]);
        if (!dept) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, department: dept });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { dept_code, dept_name, dept_head_name, location, priority_level, priority_score } = req.body;
        if (!dept_code || !dept_name)
            return res.status(400).json({ success: false, message: 'Department code and name are required.' });

        const [result] = await conn.query(
            `INSERT INTO departments (dept_code, dept_name, dept_head_name, location) VALUES (?, ?, ?, ?)`,
            [dept_code.toUpperCase(), dept_name, dept_head_name || '', location || '']
        );
        const deptId = result.insertId;

        await conn.query(
            `INSERT INTO department_priorities (department_id, priority_level, priority_score, reason) VALUES (?, ?, ?, ?)`,
            [deptId, priority_level || 3, priority_score || 1.0, `${dept_name} - Added by Admin`]
        );

        await conn.commit();
        await AuditService.log({ user: req.user, action: 'CREATE', module: 'Departments',
            recordId: deptId, description: `Created department ${dept_code}`, req });
        res.status(201).json({ success: true, message: 'Department created.', id: deptId });
    } catch (err) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Department code already exists.' });
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally { conn.release(); }
};

exports.update = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { dept_name, dept_head_name, location, priority_level, priority_score, is_active } = req.body;
        const [[old]] = await conn.query(`SELECT * FROM departments WHERE id = ?`, [req.params.id]);
        if (!old) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Not found.' }); }

        await conn.query(
            `UPDATE departments SET dept_name=?, dept_head_name=?, location=?, is_active=? WHERE id=?`,
            [dept_name || old.dept_name, dept_head_name || old.dept_head_name,
             location || old.location, is_active !== undefined ? is_active : old.is_active, req.params.id]
        );

        if (priority_level || priority_score) {
            await conn.query(
                `INSERT INTO department_priorities (department_id, priority_level, priority_score)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE priority_level=VALUES(priority_level), priority_score=VALUES(priority_score)`,
                [req.params.id, priority_level || 3, priority_score || 1.0]
            );
        }

        await conn.commit();
        await AuditService.log({ user: req.user, action: 'UPDATE', module: 'Departments',
            recordId: req.params.id, description: `Updated department ${old.dept_code}`, req });
        res.json({ success: true, message: 'Department updated.' });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    } finally { conn.release(); }
};

exports.deleteDept = async (req, res) => {
    try {
        const [[dept]] = await db.query(`SELECT * FROM departments WHERE id = ?`, [req.params.id]);
        if (!dept) return res.status(404).json({ success: false, message: 'Not found.' });

        // Soft delete only
        await db.query(`UPDATE departments SET is_active = 0 WHERE id = ?`, [req.params.id]);
        await AuditService.log({ user: req.user, action: 'DELETE', module: 'Departments',
            recordId: req.params.id, description: `Deactivated department ${dept.dept_code}`, req });
        res.json({ success: true, message: 'Department deactivated.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};
