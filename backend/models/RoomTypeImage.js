import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoomTypeImage = sequelize.define('RoomTypeImage', {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'room_type',
      key: 'room_type_id'
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
    comment: 'รูปภาพหลัก (แสดงเป็น thumbnail)'
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'room_type_images',
  timestamps: false,
  indexes: [
    {
      fields: ['room_type_id']
    },
    {
      fields: ['room_type_id', 'image_order']
    },
    {
      fields: ['room_type_id', 'is_primary']
    }
  ]
});

export default RoomTypeImage;
