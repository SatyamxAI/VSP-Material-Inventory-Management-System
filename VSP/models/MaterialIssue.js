/**
 * MaterialIssue Model
 * 
 * Provides static methods for CRUD operations on the material_issues table.
 * Includes JOINs to material_requests, materials, and users tables.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class MaterialIssue {
  /**
   * Create a new material issue record.
   * @param {object} data - { request_id, issued_quantity, issued_by }
   * @returns {object} Insert result
   */
  static async create(data) {
    const { request_id, issued_quantity, issued_by } = data;
    const [result] = await pool.query(
      `INSERT INTO material_issues (request_id, issued_quantity, issued_by) 
       VALUES (?, ?, ?)`,
      [request_id, issued_quantity, issued_by]
    );
    return result;
  }

  /**
   * Find all issues for a specific request.
   * @param {number} requestId 
   * @returns {Array} Array of issue rows
   */
  static async findByRequest(requestId) {
    const [rows] = await pool.query(
      `SELECT mi.*, u.name AS issued_by_name 
       FROM material_issues mi 
       JOIN users u ON mi.issued_by = u.id 
       WHERE mi.request_id = ?
       ORDER BY mi.issued_date DESC`,
      [requestId]
    );
    return rows;
  }

  /**
   * Get all issues with full JOINs, ordered by newest first.
   * @returns {Array} Array of issue rows with related data
   */
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT mi.*, 
              mr.request_number, mr.quantity AS requested_quantity, mr.department_id,
              m.material_name, m.material_code, m.unit, 
              u.name AS issued_by_name,
              d.department_name
       FROM material_issues mi 
       JOIN material_requests mr ON mi.request_id = mr.id 
       JOIN materials m ON mr.material_id = m.id 
       JOIN users u ON mi.issued_by = u.id
       JOIN departments d ON mr.department_id = d.id
       ORDER BY mi.issued_date DESC`
    );
    return rows;
  }

  /**
   * Get recent issues with a limit.
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Array of recent issue rows
   */
  static async findRecent(limit = 10) {
    const [rows] = await pool.query(
      `SELECT mi.*, 
              mr.request_number, mr.quantity AS requested_quantity, mr.department_id,
              m.material_name, m.material_code, m.unit, 
              u.name AS issued_by_name,
              d.department_name
       FROM material_issues mi 
       JOIN material_requests mr ON mi.request_id = mr.id 
       JOIN materials m ON mr.material_id = m.id 
       JOIN users u ON mi.issued_by = u.id
       JOIN departments d ON mr.department_id = d.id
       ORDER BY mi.issued_date DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
}

module.exports = MaterialIssue;
