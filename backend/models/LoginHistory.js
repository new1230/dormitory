import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
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
  login_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ip_address: {
    type: DataTypes.STRING(45), // Support IPv6
    allowNull: false
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  device_info: {
    type: DataTypes.JSON,
    allowNull: true
  },
  login_status: {
    type: DataTypes.ENUM('success', 'failed', 'blocked'),
    allowNull: false,
    defaultValue: 'success'
  },
  failure_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'login_history',
  timestamps: false
});

export default LoginHistory;
