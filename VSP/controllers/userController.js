// controllers/userController.js
// NOTE: Using plaintext passwords for development (no bcrypt).
const db = require('../config/db');
const AuditService = require('../services/AuditService');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.employee_id, u.name, u.email, u.designation, u.phone, u.is_active, u.last_login, u.created_at,
                    r.role_name, d.dept_name, d.dept_code
             FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN departments d ON u.department_id = d.id
             ORDER BY r.id, u.name`);
        res.json({ success: true, users: rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.create = async (req, res) => {
    try {
        const { employee_id, name, email, password, role_id, department_id, designation, phone } = req.body;
        if (!employee_id || !name || !email || !password || !role_id)
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });

        // Store plaintext (development mode)
        const [result] = await db.query(
            `INSERT INTO users (employee_id, name, email, password_hash, role_id, department_id, designation, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, name, email, password, role_id, department_id || null, designation || '', phone || '']);
        await AuditService.log({ user: req.user, action: 'CREATE_USER', module: 'Users',
            recordId: result.insertId, description: `Created user ${name} (${employee_id})`, req });
        res.status(201).json({ success: true, message: 'User created.', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Employee ID or email already exists.' });
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, email, designation, phone, role_id, department_id, is_active, password } = req.body;
        const [[old]] = await db.query(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
        if (!old) return res.status(404).json({ success: false, message: 'User not found.' });

        // Use new password if provided, otherwise keep old one (plaintext)
        const newPassword = password ? password : old.password_hash;

        await db.query(
            `UPDATE users SET name=?, email=?, designation=?, phone=?, role_id=?, department_id=?, is_active=?, password_hash=? WHERE id=?`,
            [name || old.name, email || old.email, designation || old.designation, phone || old.phone,
             role_id || old.role_id, department_id !== undefined ? (department_id || null) : old.department_id,
             is_active !== undefined ? is_active : old.is_active, newPassword, req.params.id]);
        await AuditService.log({ user: req.user, action: 'UPDATE_USER', module: 'Users',
            recordId: req.params.id, description: `Updated user ${old.name}`, req });
        res.json({ success: true, message: 'User updated.' });
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

exports.getRoles = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM roles ORDER BY id`);
        res.json({ success: true, roles: rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
};
