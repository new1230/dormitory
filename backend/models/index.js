import User from './User.js';
import Dormitory from './Dormitory.js';
import Booking from './Booking.js';

// Define associations (ต้องปรับให้ตรงกับ database schema ใหม่)
// User.hasMany(Booking, { foreignKey: 'member_id', as: 'bookings' });
// Booking.belongsTo(User, { foreignKey: 'member_id', as: 'user' });

export {
  User,
  Dormitory,
  Booking
}; 