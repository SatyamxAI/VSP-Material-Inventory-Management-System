/**
 * User Model
 * 
 * Provides static methods for CRUD operations on the users table.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class User {
  /**
   * Find a user by email address (includes department info).
   * @param {string} email 
   * @returns {object|null} User row or null
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.*, d.department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Find a user by ID (includes department info).
   * @param {number} id 
   * @returns {object|null} User row or null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.*, d.department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new user.
   * @param {object} userData - { name, email, password, role, department_id }
   * @returns {object} Insert result
   */
  static async create(userData) {
    const { name, email, password, role, department_id } = userData;
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, department_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, password, role, department_id || null]
    );
    return result;
  }

  /**
   * Get all users with department info, ordered by newest first.
   * @returns {Array} Array of user rows
   */
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.created_at, 
              d.department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       ORDER BY u.created_at DESC`
    );
    return rows;
  }

  /**
   * Update user details (excluding password).
   * @param {number} id 
   * @param {object} userData - { name, email, role, department_id }
   * @returns {object} Update result
   */
  static async update(id, userData) {
    const { name, email, role, department_id } = userData;
    const [result] = await pool.query(
      `UPDATE users 
       SET name = ?, email = ?, role = ?, department_id = ? 
       WHERE id = ?`,
      [name, email, role, department_id || null, id]
    );
    return result;
  }

  /**
   * Update a user's password.
   * @param {number} id 
   * @param {string} password - Already hashed password
   * @returns {object} Update result
   */
  static async updatePassword(id, password) {
    const [result] = await pool.query(
      `UPDATE users SET password = ? WHERE id = ?`,
      [password, id]
    );
    return result;
  }

  /**
   * Delete a user by ID.
   * @param {number} id 
   * @returns {object} Delete result
   */
  static async delete(id) {
    const [result] = await pool.query(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );
    return result;
  }

  /**
   * Get total count of users.
   * @returns {number} Count
   */
  static async count() {
    const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM users`);
    return rows[0].count;
  }
}

module.exports = User;
