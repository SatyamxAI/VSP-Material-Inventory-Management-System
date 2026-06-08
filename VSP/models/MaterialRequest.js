/**
 * MaterialRequest Model
 * 
 * Provides static methods for CRUD operations on the material_requests table.
 * Includes JOINs to departments, materials, and users tables.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class MaterialRequest {
  /**
   * Create a new material request.
   * @param {object} data - { request_number, department_id, material_id, quantity, reason, status, requested_by }
   * @returns {object} Insert result
   */
  static async create(data) {
    const {
      request_number, department_id, material_id,
      quantity, reason, requested_by
    } = data;

    const [result] = await pool.query(
      `INSERT INTO material_requests 
       (request_number, department_id, material_id, quantity, reason, status, requested_by) 
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [request_number, department_id, material_id, quantity, reason, requested_by]
    );
    return result;
  }

  /**
   * Get all material requests with JOINs. Supports optional status and department_id filters.
   * @param {object} filters - { status?, department_id? }
   * @returns {Array} Array of request rows
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT mr.*, 
             d.department_name, 
             m.material_name, m.material_code, m.unit, 
             u.name AS requested_by_name 
      FROM material_requests mr 
      JOIN departments d ON mr.department_id = d.id 
      JOIN materials m ON mr.material_id = m.id 
      JOIN users u ON mr.requested_by = u.id`;

    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('mr.status = ?');
      params.push(filters.status);
    }

    if (filters.department_id) {
      conditions.push('mr.department_id = ?');
      params.push(filters.department_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mr.requested_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Get all requests for a specific department.
   * @param {number} departmentId 
   * @returns {Array} Array of request rows
   */
  static async findByDepartment(departmentId) {
    const [rows] = await pool.query(
      `SELECT mr.*, 
              d.department_name, 
              m.material_name, m.material_code, m.unit, 
              u.name AS requested_by_name 
       FROM material_requests mr 
       JOIN departments d ON mr.department_id = d.id 
       JOIN materials m ON mr.material_id = m.id 
       JOIN users u ON mr.requested_by = u.id 
       WHERE mr.department_id = ? 
       ORDER BY mr.requested_at DESC`,
      [departmentId]
    );
    return rows;
  }

  /**
   * Find a single request by ID with full JOINs.
   * @param {number} id 
   * @returns {object|null} Request row or null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT mr.*, 
              d.department_name, 
              m.material_name, m.material_code, m.unit, 
              u.name AS requested_by_name 
       FROM material_requests mr 
       JOIN departments d ON mr.department_id = d.id 
       JOIN materials m ON mr.material_id = m.id 
       JOIN users u ON mr.requested_by = u.id 
       WHERE mr.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Update the status of a material request.
   * @param {number} id 
   * @param {string} status - One of: 'Pending', 'Approved', 'Rejected', 'Issued'
   * @returns {object} Update result
   */
  static async updateStatus(id, status) {
    const [result] = await pool.query(
      `UPDATE material_requests SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result;
  }

  /**
   * Count requests with a specific status.
   * @param {string} status 
   * @returns {number} Count
   */
  static async countByStatus(status) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM material_requests WHERE status = ?`,
      [status]
    );
    return rows[0].count;
  }

  /**
   * Count all pending requests (shortcut).
   * @returns {number} Count
   */
  static async countPending() {
    return this.countByStatus('Pending');
  }
}

module.exports = MaterialRequest;
