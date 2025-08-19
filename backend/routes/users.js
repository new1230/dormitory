import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const users = await User.findAll({
      attributes: { exclude: ['mem_password'] },
      order: [['mem_id', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID (Admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['mem_password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const { mem_name, mem_email, mem_password, mem_card_id, mem_addr, mem_tel, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { mem_email: mem_email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    const newUser = await User.create({
      mem_name,
      mem_email,
      mem_password,
      mem_card_id,
      mem_addr,
      mem_tel,
      role: role || 'Student'
    });
    
    // Return user without password
    const userResponse = await User.findByPk(newUser.mem_id, {
      attributes: { exclude: ['mem_password'] }
    });
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const { mem_name, mem_email, mem_card_id, mem_addr, mem_tel, role } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    await user.update({
      mem_name,
      mem_email,
      mem_card_id,
      mem_addr,
      mem_tel,
      role
    });
    
    // Return updated user without password
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['mem_password'] }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const { role } = req.body;
    
    if (!['Student', 'Manager', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({ role });
    
    // Return updated user without password
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['mem_password'] }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user (Admin only)
router.patch('/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({ mem_status: '0' }); // 0 = inactive, 1 = active
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate user (Admin only)
router.patch('/:id/activate', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({ mem_status: '1' }); // 1 = active
    
    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has active bookings
    const activeBookings = await User.sequelize.query(
      'SELECT COUNT(*) as count FROM booking WHERE member_id = ? AND booking_status IN ("pending", "approved")',
      {
        replacements: [req.params.id],
        type: User.sequelize.QueryTypes.SELECT
      }
    );
    
    if (activeBookings[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete user with active bookings' });
    }
    
    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 