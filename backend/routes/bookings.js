const express = require('express');
const Booking = require('../models/Booking');
const Dormitory = require('../models/Dormitory');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all bookings (Admin) or user's bookings (Student)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.user = req.user._id;
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'firstName lastName email')
      .populate('dormitory', 'name address')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('dormitory', 'name address contactInfo');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user can access this booking
    if (req.user.role === 'student' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { dormitoryId, roomType, checkInDate, checkOutDate, specialRequests } = req.body;
    
    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    
    if (checkIn < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }
    
    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }
    
    // Check dormitory availability
    const dormitory = await Dormitory.findById(dormitoryId);
    if (!dormitory) {
      return res.status(404).json({ message: 'Dormitory not found' });
    }
    
    const selectedRoomType = dormitory.roomTypes.find(rt => rt.name === roomType.name);
    if (!selectedRoomType) {
      return res.status(400).json({ message: 'Room type not found' });
    }
    
    if (selectedRoomType.availableRooms <= 0) {
      return res.status(400).json({ message: 'No available rooms of this type' });
    }
    
    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      dormitory: dormitoryId,
      roomType: { name: roomType.name },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn }
        }
      ]
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }
    
    // Create booking
    const booking = new Booking({
      user: req.user._id,
      dormitory: dormitoryId,
      roomType: {
        name: selectedRoomType.name,
        price: selectedRoomType.price,
        capacity: selectedRoomType.capacity
      },
      checkInDate: checkIn,
      checkOutDate: checkOut,
      specialRequests
    });
    
    await booking.save();
    
    // Update available rooms
    selectedRoomType.availableRooms -= 1;
    await dormitory.save();
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email')
      .populate('dormitory', 'name address');
    
    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (Admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'firstName lastName email')
     .populate('dormitory', 'name address');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user can cancel this booking
    if (req.user.role === 'student' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }
    
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    
    await booking.save();
    
    // Update available rooms
    const dormitory = await Dormitory.findById(booking.dormitory);
    const roomType = dormitory.roomTypes.find(rt => rt.name === booking.roomType.name);
    if (roomType) {
      roomType.availableRooms += 1;
      await dormitory.save();
    }
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'firstName lastName email')
      .populate('dormitory', 'name address');
    
    res.json(populatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 