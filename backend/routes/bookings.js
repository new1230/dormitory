import express from 'express';
import multer from 'multer';
import path from 'path';
import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import Dormitory from '../models/Dormitory.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

// Configure multer for payment slip uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-slips/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `payment-slip-${req.body.bookingId}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG images are allowed'), false);
    }
  }
});

const router = express.Router();

// Get all bookings (Admin) or user's bookings (Student)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'Student') {
      query.member_id = req.user.id;
    }
    
    const bookings = await Booking.findAll({
      where: query,
      include: [{
        model: User,
        as: 'member',
        attributes: ['mem_id', 'mem_name', 'mem_email', 'mem_tel', 'mem_card_id']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'member',
        attributes: ['mem_id', 'mem_name', 'mem_email', 'mem_tel', 'mem_card_id']
      }]
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user can access this booking
    if (req.user.role === 'Student' && booking.member_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Booking request received:', req.body);
    console.log('👤 User:', req.user);
    
    const { room_id, check_in_date, check_out_date, remarks, contract_accepted, total_price } = req.body;
    
    if (!contract_accepted) {
      return res.status(400).json({ message: 'Contract must be accepted before booking' });
    }
    
    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    
    if (checkIn < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }
    
    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }
    
    // Check if room exists and is available
    const room = await Room.findByPk(room_id, {
      include: [{
        model: RoomType,
        as: 'roomType'
      }]
    });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.status !== '1') {
      return res.status(400).json({ message: 'Room is not available' });
    }
    
    // Check for conflicting bookings for this specific room
    const conflictingBooking = await Booking.findOne({
      where: {
        room_id: room_id,
        booking_status: ['pending', 'approved'],
        [Op.or]: [
          {
            check_in_date: { [Op.lt]: checkOut },
            check_out_date: { [Op.gt]: checkIn }
          }
        ]
      }
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }
    
    // Set payment deadline (60 minutes from now)
    const paymentDeadline = new Date();
    paymentDeadline.setMinutes(paymentDeadline.getMinutes() + 60);
    
    // Create booking
    const booking = await Booking.create({
      member_id: req.user.id,
      room_id: room_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_price: total_price,
      remarks: remarks,
      contract_accepted: true,
      contract_accepted_at: new Date(),
      payment_deadline: paymentDeadline,
      booking_status: 'pending',
      deposit_status: 'none'
    });
    
    // Update room status to 'จองแล้ว'
    await room.update({ status: '3' });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (Admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const booking = await Booking.update(
      { booking_status: status },
      { 
        where: { booking_id: req.params.id },
        returning: true
      }
    );
    
    const updatedBooking = await Booking.findByPk(req.params.id);
    
    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload payment slip
router.post('/upload-payment-slip', authenticateToken, upload.single('paymentSlip'), async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.member_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if payment is still valid (within deadline)
    if (new Date() > new Date(booking.payment_deadline)) {
      return res.status(400).json({ message: 'Payment deadline has passed' });
    }
    
    // Update booking with payment slip
    await booking.update({
      payment_slip_url: `/uploads/payment-slips/${req.file.filename}`,
      payment_slip_uploaded_at: new Date(),
      deposit_status: 'pending'
    });
    
    res.json({ 
      message: 'Payment slip uploaded successfully',
      booking: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager approve payment
router.patch('/:id/approve-payment', authenticateToken, async (req, res) => {
  try {
    // Check if user is manager or admin
    if (!['Manager', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }
    
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.deposit_status !== 'pending') {
      return res.status(400).json({ message: 'Payment slip not uploaded yet' });
    }
    
    // Update booking and room status
    await booking.update({
      deposit_status: 'paid',
      booking_status: 'approved',
      manager_approved_at: new Date(),
      manager_approved_by: req.user.id
    });
    
    // Update room status to 'มีผู้พัก'
    await Room.update(
      { 
        status: '0',
        current_tenant_id: booking.member_id,
        contract_start: booking.check_in_date,
        contract_end: booking.check_out_date
      },
      { where: { room_id: booking.room_id } }
    );
    
    res.json({ 
      message: 'Payment approved successfully',
      booking: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user can cancel this booking
    if (req.user.role === 'Student' && booking.member_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    if (booking.booking_status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }
    
    await booking.update({
      booking_status: 'cancelled',
      remarks: (booking.remarks || '') + '\n' + (req.body.reason || 'Cancelled by user')
    });
    
    // Update room status back to available
    await Room.update(
      { status: '1' },
      { where: { room_id: booking.room_id } }
    );
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager reject payment
router.patch('/:id/reject-payment', authenticateToken, async (req, res) => {
  try {
    // Check if user is manager or admin
    if (!['Manager', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }
    
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.deposit_status !== 'pending') {
      return res.status(400).json({ message: 'Payment slip not uploaded yet' });
    }
    
    // Update booking status
    await booking.update({
      deposit_status: 'none',
      remarks: (booking.remarks || '') + '\n' + (req.body.reason || 'Payment rejected by manager')
    });
    
    res.json({ 
      message: 'Payment rejected successfully',
      booking: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager approve booking (final approval)
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    // Check if user is manager or admin
    if (!['Manager', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }
    
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.deposit_status !== 'paid') {
      return res.status(400).json({ message: 'Payment must be approved first' });
    }
    
    // Update booking status to approved
    await booking.update({
      booking_status: 'approved',
      manager_approved_at: new Date(),
      manager_approved_by: req.user.id
    });
    
    res.json({ 
      message: 'Booking approved successfully',
      booking: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager reject booking (final rejection)
router.patch('/:id/reject', authenticateToken, async (req, res) => {
  try {
    // Check if user is manager or admin
    if (!['Manager', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Manager or Admin role required.' });
    }
    
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update booking status to rejected
    await booking.update({
      booking_status: 'rejected',
      remarks: (booking.remarks || '') + '\n' + (req.body.reason || 'Booking rejected by manager')
    });
    
    // Update room status back to available
    await Room.update(
      { status: '1' },
      { where: { room_id: booking.room_id } }
    );
    
    res.json({ 
      message: 'Booking rejected successfully',
      booking: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 