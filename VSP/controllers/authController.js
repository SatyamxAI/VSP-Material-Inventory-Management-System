// controllers/authController.js
// NOTE: Using plaintext password comparison for development purposes.
// TODO: Switch back to bcrypt in production.
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const AuditService = require('../services/AuditService');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password are required.' });

    try {
        const [[user]] = await db.query(
            `SELECT u.*, r.role_name, d.dept_name, d.dept_code
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.email = ? AND u.is_active = 1`, [email]
        );

        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        // Plaintext comparison (development mode)
        if (password !== user.password_hash)
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        // Update last login
        await db.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

        const token = jwt.sign(
            {
                id: user.id, name: user.name, email: user.email,
                role: user.role_name, role_id: user.role_id,
                department_id: user.department_id,
                dept_name: user.dept_name, dept_code: user.dept_code,
                employee_id: user.employee_id, designation: user.designation
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        await AuditService.log({
            user: { id: user.id, name: user.name, role: user.role_name },
            action: 'LOGIN', module: 'Auth',
            description: `User ${user.name} logged in`, req
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id, name: user.name, email: user.email,
                role: user.role_name, employee_id: user.employee_id,
                designation: user.designation, department_id: user.department_id,
                dept_name: user.dept_name, dept_code: user.dept_code
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [[user]] = await db.query(
            `SELECT u.id, u.employee_id, u.name, u.email, u.designation, u.phone,
                    r.role_name, d.dept_name, d.dept_code, u.last_login
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ? AND u.is_active = 1`, [req.user.id]
        );
        if (!user)
            return res.status(401).json({ success: false, message: 'User not found or inactive.' });

        res.json({ success: true, user: { ...user, role: user.role_name } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.logout = async (req, res) => {
    try {
        await AuditService.log({
            user: req.user, action: 'LOGOUT', module: 'Auth',
            description: `User ${req.user.name} logged out`, req
        });
    } catch (_) {}
    res.json({ success: true, message: 'Logged out successfully.' });
};
