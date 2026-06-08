// services/AuditService.js
const db = require('../config/db');

class AuditService {
    async log({ user, action, module, recordId, recordType, oldValues, newValues, description, req }) {
        try {
            const ip = req ? (req.ip || req.connection?.remoteAddress || 'unknown') : 'system';
            const ua = req ? (req.get('user-agent') || '') : 'system';
            await db.query(
                `INSERT INTO audit_logs (user_id, user_name, user_role, action, module, record_id, record_type, old_values, new_values, description, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user?.id || null,
                    user?.name || 'System',
                    user?.role || 'system',
                    action, module,
                    recordId ? String(recordId) : null,
                    recordType || null,
                    oldValues ? JSON.stringify(oldValues) : null,
                    newValues ? JSON.stringify(newValues) : null,
                    description || null,
                    ip, ua
                ]
            );
        } catch (err) {
            console.error('Audit log error:', err.message);
        }
    }
}

module.exports = new AuditService();
