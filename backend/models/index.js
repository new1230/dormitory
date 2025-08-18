const User = require('./User');
const Dormitory = require('./Dormitory');
const Booking = require('./Booking');

// Define associations
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Dormitory.hasMany(Booking, { foreignKey: 'dormitoryId', as: 'bookings' });
Booking.belongsTo(Dormitory, { foreignKey: 'dormitoryId', as: 'dormitory' });

// For cancelled bookings
User.hasMany(Booking, { foreignKey: 'cancelledById', as: 'cancelledBookings' });
Booking.belongsTo(User, { foreignKey: 'cancelledById', as: 'cancelledBy' });

module.exports = {
  User,
  Dormitory,
  Booking
}; 