const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dormitoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Dormitories',
      key: 'id'
    }
  },
  roomType: {
    type: DataTypes.JSON,
    allowNull: false
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending'
  },
  specialRequests: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  cancelledAt: {
    type: DataTypes.DATE
  },
  cancelledById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  cancellationReason: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (booking) => {
      if (booking.checkInDate && booking.checkOutDate && booking.roomType && booking.roomType.price) {
        const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
        booking.totalPrice = days * booking.roomType.price;
      }
    },
    beforeUpdate: (booking) => {
      if (booking.changed('checkInDate') || booking.changed('checkOutDate') || booking.changed('roomType')) {
        if (booking.checkInDate && booking.checkOutDate && booking.roomType && booking.roomType.price) {
          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
          booking.totalPrice = days * booking.roomType.price;
        }
      }
    }
  }
});

module.exports = Booking; 