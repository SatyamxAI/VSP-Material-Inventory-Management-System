/**
 * Material Model
 * 
 * Provides static methods for CRUD operations on the materials table,
 * plus search, pagination, stock updates, and low-stock queries.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class Material {
  /**
   * Get all materials with pagination, ordered by material_name.
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @returns {object} { rows, total }
   */
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM materials ORDER BY material_name LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM materials`
    );

    return {
      rows,
      total: countResult[0].total
    };
  }

  /**
   * Find a material by ID.
   * @param {number} id 
   * @returns {object|null} Material row or null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM materials WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find a material by its unique material_code.
   * @param {string} code 
   * @returns {object|null} Material row or null
   */
  static async findByCode(code) {
    const [rows] = await pool.query(
      `SELECT * FROM materials WHERE material_code = ?`,
      [code]
    );
    return rows[0] || null;
  }

  /**
   * Create a new material.
   * @param {object} data - { material_code, material_name, category, unit, current_stock, reorder_level, storage_location }
   * @returns {object} Insert result
   */
  static async create(data) {
    const {
      material_code, material_name, category, unit,
      current_stock, reorder_level, storage_location
    } = data;

    const [result] = await pool.query(
      `INSERT INTO materials 
       (material_code, material_name, category, unit, current_stock, reorder_level, storage_location) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [material_code, material_name, category, unit,
       current_stock || 0, reorder_level || 10, storage_location]
    );
    return result;
  }

  /**
   * Update all fields of a material.
   * @param {number} id 
   * @param {object} data 
   * @returns {object} Update result
   */
  static async update(id, data) {
    const {
      material_code, material_name, category, unit,
      current_stock, reorder_level, storage_location
    } = data;

    const [result] = await pool.query(
      `UPDATE materials 
       SET material_code = ?, material_name = ?, category = ?, unit = ?, 
           current_stock = ?, reorder_level = ?, storage_location = ? 
       WHERE id = ?`,
      [material_code, material_name, category, unit,
       current_stock, reorder_level, storage_location, id]
    );
    return result;
  }

  /**
   * Delete a material by ID.
   * @param {number} id 
   * @returns {object} Delete result
   */
  static async delete(id) {
    const [result] = await pool.query(
      `DELETE FROM materials WHERE id = ?`,
      [id]
    );
    return result;
  }

  /**
   * Update the current stock of a material.
   * @param {number} id 
   * @param {number} quantity - New stock quantity
   * @returns {object} Update result
   */
  static async updateStock(id, quantity) {
    const [result] = await pool.query(
      `UPDATE materials SET current_stock = ? WHERE id = ?`,
      [quantity, id]
    );
    return result;
  }

  /**
   * Search materials by name, code, or category using LIKE.
   * @param {string} query - Search term
   * @returns {Array} Matching material rows
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      `SELECT * FROM materials 
       WHERE material_name LIKE ? 
          OR material_code LIKE ? 
          OR category LIKE ? 
       ORDER BY material_name`,
      [searchTerm, searchTerm, searchTerm]
    );
    return rows;
  }

  /**
   * Get all materials where current stock is at or below reorder level.
   * @returns {Array} Low-stock material rows
   */
  static async getLowStock() {
    const [rows] = await pool.query(
      `SELECT * FROM materials 
       WHERE current_stock <= reorder_level 
       ORDER BY (current_stock / reorder_level) ASC`
    );
    return rows;
  }

  /**
   * Get total count of materials.
   * @returns {number} Count
   */
  static async count() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM materials`
    );
    return rows[0].count;
  }

  /**
   * Get count of materials with stock at or below reorder level.
   * @returns {number} Count
   */
  static async countLowStock() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM materials 
       WHERE current_stock <= reorder_level`
    );
    return rows[0].count;
  }
}

module.exports = Material;
