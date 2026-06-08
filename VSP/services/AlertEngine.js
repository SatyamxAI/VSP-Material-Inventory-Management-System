// services/AlertEngine.js
const db = require('../config/db');

class AlertEngine {
    async runLowStockCheck() {
        const [materials] = await db.query(
            `SELECT id, material_code, material_name, current_stock, reorder_level, safety_stock
             FROM materials WHERE material_status = 'Active'`
        );
        for (const m of materials) {
            await this.checkMaterial(m);
        }
    }

    async checkMaterial(material) {
        const stock = parseFloat(material.current_stock);
        const reorder = parseFloat(material.reorder_level);
        const safety = parseFloat(material.safety_stock);

        if (stock <= 0) {
            await this._upsertAlert(material.id, 'Critical_Stock', 'Emergency',
                `ZERO STOCK EMERGENCY: ${material.material_name} (${material.material_code}) is completely out of stock!`);
        } else if (stock <= safety) {
            await this._upsertAlert(material.id, 'Critical_Stock', 'Critical',
                `CRITICAL: ${material.material_name} (${material.material_code}) below safety stock. Current: ${stock}, Safety: ${safety}`);
        } else if (stock <= reorder) {
            await this._upsertAlert(material.id, 'Low_Stock', 'Warning',
                `LOW STOCK: ${material.material_name} (${material.material_code}). Current: ${stock}, Reorder Level: ${reorder}`);
        }
    }

    async _upsertAlert(materialId, alertType, severity, message) {
        await db.query(
            `INSERT INTO alerts (alert_type, severity, material_id, alert_message)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE alert_message = VALUES(alert_message), status = 'Active', created_at = NOW()`,
            [alertType, severity, materialId, message]
        );
    }

    async getActiveAlerts(filter = {}) {
        let sql = `SELECT a.*, m.material_code, m.material_name, d.dept_name
                   FROM alerts a
                   LEFT JOIN materials m ON a.material_id = m.id
                   LEFT JOIN departments d ON a.department_id = d.id
                   WHERE 1=1`;
        const params = [];
        if (filter.status) { sql += ' AND a.status = ?'; params.push(filter.status); }
        if (filter.severity) { sql += ' AND a.severity = ?'; params.push(filter.severity); }
        sql += ' ORDER BY FIELD(a.severity, "Emergency", "Critical", "Warning"), a.created_at DESC';
        const [rows] = await db.query(sql, params);
        return rows;
    }
}

module.exports = new AlertEngine();
