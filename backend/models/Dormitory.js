import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Dormitory = sequelize.define('Dormitory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  },
  contactInfo: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      phone: '',
      email: ''
    }
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  roomTypes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  rules: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default Dormitory; 