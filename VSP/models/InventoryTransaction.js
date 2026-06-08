/**
 * InventoryTransaction Model
 * 
 * Provides static methods for CRUD operations on the inventory_transactions table.
 * Supports consumption reports by month and by department.
 * All queries are parameterized to prevent SQL injection.
 */

const pool = require('../config/db');

class InventoryTransaction {
  /**
   * Create a new inventory transaction record.
   * @param {object} data - { material_id, transaction_type, quantity, balance_stock }
   * @returns {object} Insert result
   */
  static async create(data) {
    const { material_id, transaction_type, quantity, balance_stock } = data;
    const [result] = await pool.query(
      `INSERT INTO inventory_transactions 
       (material_id, transaction_type, quantity, balance_stock) 
       VALUES (?, ?, ?, ?)`,
      [material_id, transaction_type, quantity, balance_stock]
    );
    return result;
  }

  /**
   * Get all transactions with material info, ordered by newest first.
   * @param {number} limit - Maximum number of records (default 100)
   * @returns {Array} Array of transaction rows
   */
  static async findAll(limit = 100) {
    const [rows] = await pool.query(
      `SELECT it.*, m.material_name, m.material_code, m.unit 
       FROM inventory_transactions it 
       JOIN materials m ON it.material_id = m.id 
       ORDER BY it.transaction_date DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * Get all transactions for a specific material.
   * @param {number} materialId 
   * @returns {Array} Array of transaction rows
   */
  static async findByMaterial(materialId) {
    const [rows] = await pool.query(
      `SELECT it.*, m.material_name, m.material_code, m.unit 
       FROM inventory_transactions it 
       JOIN materials m ON it.material_id = m.id 
       WHERE it.material_id = ? 
       ORDER BY it.transaction_date DESC`,
      [materialId]
    );
    return rows;
  }

  /**
   * Get monthly consumption (OUT transactions) for a given year.
   * Returns one row per month with month number and total quantity consumed.
   * @param {number} year - e.g. 2024
   * @returns {Array} [{ month, total_quantity }, ...]
   */
  static async getMonthlyConsumption(year) {
    const [rows] = await pool.query(
      `SELECT MONTH(transaction_date) AS month, 
              SUM(quantity) AS total_quantity 
       FROM inventory_transactions 
       WHERE transaction_type = 'OUT' 
         AND YEAR(transaction_date) = ? 
       GROUP BY MONTH(transaction_date) 
       ORDER BY month`,
      [year]
    );
    return rows;
  }

  /**
   * Get department-wise consumption (OUT transactions).
   * Joins through material_requests to resolve department.
   * @returns {Array} [{ department_name, total_quantity }, ...]
   */
  static async getDepartmentConsumption() {
    const [rows] = await pool.query(
      `SELECT d.department_name, SUM(it.quantity) AS total_quantity 
       FROM inventory_transactions it 
       JOIN material_requests mr ON it.material_id = mr.material_id 
       JOIN departments d ON mr.department_id = d.id 
       WHERE it.transaction_type = 'OUT' 
       GROUP BY d.department_name 
       ORDER BY total_quantity DESC`
    );
    return rows;
  }
}

module.exports = InventoryTransaction;
