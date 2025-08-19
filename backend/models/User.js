import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const User = sequelize.define('Member', {
  mem_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mem_password: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  mem_name: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  mem_card_id: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true
  },
  mem_addr: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mem_email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  mem_tel: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  mem_img: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  mem_status: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: '1'
  },
  role: {
    type: DataTypes.ENUM('Student', 'Manager', 'Admin'),
    allowNull: false,
    defaultValue: 'Student'
  }
}, {
  tableName: 'member',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.mem_password) {
        const salt = await bcrypt.genSalt(10);
        user.mem_password = await bcrypt.hash(user.mem_password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('mem_password')) {
        const salt = await bcrypt.genSalt(10);
        user.mem_password = await bcrypt.hash(user.mem_password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.mem_password);
};

// Define associations (will be set up after all models are imported)
User.associate = (models) => {
  User.hasMany(models.Booking, {
    foreignKey: 'member_id',
    as: 'bookings'
  });
};

export default User; 