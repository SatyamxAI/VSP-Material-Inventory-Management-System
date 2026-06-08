/**
 * Department Model
 * 
 * Provides static methods for CRUD operations on the departments table.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class Department {
  /**
   * Get all departments ordered alphabetically by name.
   * @returns {Array} Array of department rows
   */
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT * FROM departments ORDER BY department_name`
    );
    return rows;
  }

  /**
   * Find a department by ID.
   * @param {number} id 
   * @returns {object|null} Department row or null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM departments WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new department.
   * @param {object} data - { department_name }
   * @returns {object} Insert result
   */
  static async create(data) {
    const { department_name } = data;
    const [result] = await pool.query(
      `INSERT INTO departments (department_name) VALUES (?)`,
      [department_name]
    );
    return result;
  }

  /**
   * Update a department's name.
   * @param {number} id 
   * @param {object} data - { department_name }
   * @returns {object} Update result
   */
  static async update(id, data) {
    const { department_name } = data;
    const [result] = await pool.query(
      `UPDATE departments SET department_name = ? WHERE id = ?`,
      [department_name, id]
    );
    return result;
  }

  /**
   * Delete a department by ID.
   * @param {number} id 
   * @returns {object} Delete result
   */
  static async delete(id) {
    const [result] = await pool.query(
      `DELETE FROM departments WHERE id = ?`,
      [id]
    );
    return result;
  }

  /**
   * Get total count of departments.
   * @returns {number} Count
   */
  static async count() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM departments`
    );
    return rows[0].count;
  }
}

module.exports = Department;
