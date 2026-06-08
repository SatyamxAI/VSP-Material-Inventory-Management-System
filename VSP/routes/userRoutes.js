/**
 * User Routes
 * 
 * CRUD operations for user management.
 * All routes require authentication. Most require admin role.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

/**
 * GET /api/users
 * Get all users (admin only).
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users.' });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID (admin only).
 */
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user.' });
  }
});

/**
 * POST /api/users
 * Create a new user (admin only).
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department_id } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    // Check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'department_user',
      department_id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error creating user.' });
  }
});

/**
 * PUT /api/users/:id
 * Update user details (admin only).
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, department_id } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.update(req.params.id, {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      department_id: department_id !== undefined ? department_id : user.department_id
    });

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user.' });
  }
});

/**
 * PUT /api/users/:id/password
 * Update user password (admin only).
 */
router.put('/:id/password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.updatePassword(req.params.id, hashedPassword);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (admin only).
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.delete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
});

module.exports = router;
