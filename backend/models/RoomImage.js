import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoomImage = sequelize.define('RoomImage', {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'room',
      key: 'room_id'
    }
  },
  image_filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'ชื่อไฟล์รูปภาพ'
  },
  image_description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'คำอธิบายรูปภาพ'
  },
  image_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'ลำดับการแสดงรูปภาพ'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'รูปภาพหลัก'
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'room_images',
  timestamps: false,
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['room_id', 'image_order']
    },
    {
      fields: ['room_id', 'is_primary']
    }
  ]
});

export default RoomImage;
