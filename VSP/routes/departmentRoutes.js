/**
 * Department Routes
 * 
 * CRUD operations for department management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/departments
 * Get all departments.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching departments.' });
  }
});

/**
 * GET /api/departments/:id
 * Get a single department by ID.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.json({ success: true, department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching department.' });
  }
});

/**
 * POST /api/departments
 * Create a new department (admin only).
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required.'
      });
    }

    const result = await Department.create({ department_name });
    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      departmentId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists.'
      });
    }
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error creating department.' });
  }
});

/**
 * PUT /api/departments/:id
 * Update a department (admin only).
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { department_name } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    await Department.update(req.params.id, {
      department_name: department_name || department.department_name
    });

    res.json({ success: true, message: 'Department updated successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists.'
      });
    }
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error updating department.' });
  }
});

/**
 * DELETE /api/departments/:id
 * Delete a department (admin only).
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    await Department.delete(req.params.id);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting department.' });
  }
});

module.exports = router;
