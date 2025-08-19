import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Room = sequelize.define('Room', {
  room_id: {
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
  room_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: '1',
    validate: {
      isIn: [['1', '0', '2', '3']] // 1=ว่าง, 0=ไม่ว่าง/มีผู้พัก, 2=ซ่อม, 3=จองแล้ว
    },
    comment: '1=ว่าง, 0=ไม่ว่าง/มีผู้พัก, 2=ซ่อม, 3=จองแล้ว'
  },
  
  // ข้อมูลสัญญาการเช่า
  contract_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'วันที่เริ่มสัญญา'
  },
  contract_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'วันที่สิ้นสุดสัญญา'
  },
  current_tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID ผู้เช่าปัจจุบัน'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  room_img: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'room',
  timestamps: false,
  
  // Define getters for better readability
  getterMethods: {
    status_text() {
      const statuses = {
        '1': 'ห้องว่าง',
        '0': 'มีผู้พัก',
        '2': 'ปิดซ่อม',
        '3': 'จองแล้ว'
      };
      return statuses[this.status] || 'ไม่ทราบสถานะ';
    },
    
    status_color() {
      const colors = {
        '1': 'green',   // ห้องว่าง
        '0': 'red',     // มีผู้พัก
        '2': 'orange',  // ปิดซ่อม
        '3': 'blue'     // จองแล้ว
      };
      return colors[this.status] || 'gray';
    },
    
    is_available() {
      return this.status === '1'; // เฉพาะห้องว่างเท่านั้น
    },
    
    contract_info() {
      if (!this.contract_start || !this.contract_end) return null;
      
      const now = new Date();
      const endDate = new Date(this.contract_end);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        start: this.contract_start,
        end: this.contract_end,
        days_left: daysLeft,
        is_expiring_soon: daysLeft <= 30 && daysLeft > 0,
        is_expired: daysLeft < 0
      };
    }
  }
});

// Define associations after model creation
import RoomType from './RoomType.js';
import RoomImage from './RoomImage.js';

Room.belongsTo(RoomType, {
  foreignKey: 'room_type_id',
  as: 'roomType'
});

Room.hasMany(RoomImage, {
  foreignKey: 'room_id',
  as: 'images'
});

RoomType.hasMany(Room, {
  foreignKey: 'room_type_id',
  as: 'rooms'
});

RoomImage.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room'
});

export default Room;
