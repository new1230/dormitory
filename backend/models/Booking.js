import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Booking = sequelize.define('Booking', {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'member',
      key: 'mem_id'
    }
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'room',
      key: 'room_id'
    }
  },
  check_in_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  booking_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  booking_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  remarks: {
    type: DataTypes.TEXT
  },
  deposit_amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  deposit_status: {
    type: DataTypes.ENUM('none', 'pending', 'paid', 'refunded'),
    defaultValue: 'none'
  },
  // เพิ่มฟิลด์ใหม่สำหรับ flow การจอง
  contract_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  contract_accepted_at: {
    type: DataTypes.DATE
  },
  payment_slip_url: {
    type: DataTypes.STRING
  },
  payment_slip_uploaded_at: {
    type: DataTypes.DATE
  },
  payment_deadline: {
    type: DataTypes.DATE
  },
  manager_approved_at: {
    type: DataTypes.DATE
  },
  manager_approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'member',
      key: 'mem_id'
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2)
  }
}, {
  tableName: 'booking',
  timestamps: true,
  hooks: {
    beforeCreate: (booking) => {
      // Auto-calculate price can be done if needed
      if (!booking.total_price && booking.check_in_date && booking.check_out_date) {
        const months = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24 * 30));
        // Default price calculation if not provided
        booking.total_price = months * 3000; // default 3000 per month
      }
    }
  }
});

// Define associations (will be set up after all models are imported)
Booking.associate = (models) => {
  Booking.belongsTo(models.User, {
    foreignKey: 'member_id',
    as: 'member'
  });
  Booking.belongsTo(models.Room, {
    foreignKey: 'room_id',
    as: 'room'
  });
};

export default Booking; 