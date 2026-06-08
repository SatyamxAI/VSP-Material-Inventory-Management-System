/**
 * Alert Model
 * 
 * Provides static methods for CRUD operations on the alerts table.
 * Manages low-stock and other inventory alerts.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class Alert {
  /**
   * Create a new alert.
   * @param {object} data - { material_id, alert_type, message }
   * @returns {object} Insert result
   */
  static async create(data) {
    const { material_id, alert_type, message } = data;
    const [result] = await pool.query(
      `INSERT INTO alerts (material_id, alert_type, message, status) 
       VALUES (?, ?, ?, 'Active')`,
      [material_id, alert_type || 'Low Stock', message]
    );
    return result;
  }

  /**
   * Get all alerts with material info, ordered by newest first.
   * @returns {Array} Array of alert rows
   */
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT a.*, m.material_name, m.material_code, m.current_stock, m.reorder_level 
       FROM alerts a 
       JOIN materials m ON a.material_id = m.id 
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  /**
   * Get all active (unresolved) alerts.
   * @returns {Array} Array of active alert rows
   */
  static async findActive() {
    const [rows] = await pool.query(
      `SELECT a.*, m.material_name, m.material_code, m.current_stock, m.reorder_level 
       FROM alerts a 
       JOIN materials m ON a.material_id = m.id 
       WHERE a.status = 'Active' 
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  /**
   * Resolve an alert (mark as Resolved).
   * @param {number} id 
   * @returns {object} Update result
   */
  static async resolve(id) {
    const [result] = await pool.query(
      `UPDATE alerts SET status = 'Resolved' WHERE id = ?`,
      [id]
    );
    return result;
  }

  /**
   * Find active alerts for a specific material.
   * @param {number} materialId 
   * @returns {Array} Array of alert rows
   */
  static async findByMaterial(materialId) {
    const [rows] = await pool.query(
      `SELECT a.*, m.material_name, m.material_code 
       FROM alerts a 
       JOIN materials m ON a.material_id = m.id 
       WHERE a.material_id = ? AND a.status = 'Active' 
       ORDER BY a.created_at DESC`,
      [materialId]
    );
    return rows;
  }

  /**
   * Get count of active alerts.
   * @returns {number} Count
   */
  static async countActive() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM alerts WHERE status = 'Active'`
    );
    return rows[0].count;
  }
}

module.exports = Alert;
