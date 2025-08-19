import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoomType = sequelize.define('RoomType', {
  room_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_type_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  // ราคาและค่าใช้จ่าย
  price_per_month: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'ค่าเช่าต่อเดือน (บาท)'
  },
  price_per_semester: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'ค่าเช่าต่อเทอม (บาท)'
  },
  water_rate: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'ค่าน้ำต่อหน่วย (บาท)'
  },
  electricity_rate: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'ค่าไฟต่อหน่วย (บาท)'
  },
  payment_due_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 31
    },
    comment: 'วันที่ครบกำหนดชำระ (วันที่ของเดือน)'
  },
  
  // ประเภทห้องตามจำนวนผู้พัก
  room_style: {
    type: DataTypes.ENUM('single', 'double', 'triple', 'quadruple', 'dormitory'),
    allowNull: false,
    defaultValue: 'single',
    comment: 'ประเภทตามจำนวนผู้พัก: single=เดี่ยว, double=คู่, triple=สาม, quadruple=สี่, dormitory=โฮสเทล'
  },
  
  // เพศที่อนุญาต
  gender_allowed: {
    type: DataTypes.ENUM('male', 'female', 'mixed'),
    allowNull: false,
    defaultValue: 'mixed',
    comment: 'เพศที่อนุญาต: male=ชาย, female=หญิง, mixed=ผสม'
  },
  
  // สิ่งอำนวยความสะดวก
  air_condition: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'มีแอร์หรือไม่'
  },
  fan: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'มีพัดลมหรือไม่'
  },
  furnished: {
    type: DataTypes.ENUM('fully', 'partial', 'unfurnished'),
    allowNull: false,
    defaultValue: 'partial',
    comment: 'ระดับเฟอร์นิเจอร์'
  },
  
  // ประเภทห้องตามรูปแบบ
  room_category: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'hostel'),
    allowNull: false,
    defaultValue: 'standard',
    comment: 'ประเภทตามรูปแบบการใช้'
  },
  
  // สิ่งอำนวยความสะดวกเพิ่มเติม (JSON)
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'สิ่งอำนวยความสะดวกเพิ่มเติม',
    defaultValue: {
      wifi: true,
      hot_water: false,
      refrigerator: false,
      tv: false,
      desk: true,
      chair: true,
      bed: true,
      closet: true,
      balcony: false,
      private_bathroom: true
    }
  },
  
  // ข้อมูลห้อง
  room_size: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'ขนาดห้อง (ตารางเมตร)'
  },
  
  is_active: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: '1',
    validate: {
      isIn: [['0', '1']]
    }
  }
}, {
  tableName: 'room_type',
  timestamps: false,
  
  // Define getters for better readability
  getterMethods: {
    room_style_text() {
      const styles = {
        'single': 'ห้องเดี่ยว',
        'double': 'ห้องคู่', 
        'triple': 'ห้องสาม',
        'quadruple': 'ห้องสี่',
        'dormitory': 'ห้องรวม (โฮสเทล)'
      };
      return styles[this.room_style] || this.room_style;
    },
    
    furnished_text() {
      const furnished = {
        'fully': 'ครบครันทั้งหมด',
        'partial': 'เฟอร์นิเจอร์พื้นฐาน',
        'unfurnished': 'ห้องเปล่า'
      };
      return furnished[this.furnished] || this.furnished;
    },
    
    room_category_text() {
      const categories = {
        'standard': 'ห้องมาตรฐาน',
        'deluxe': 'ห้องพิเศษ',
        'suite': 'ห้องสวีท',
        'hostel': 'ห้องแบบโฮสเทล'
      };
      return categories[this.room_category] || this.room_category;
    },
    
    gender_allowed_text() {
      const genders = {
        'male': 'ชายเท่านั้น',
        'female': 'หญิงเท่านั้น', 
        'mixed': 'ชาย-หญิง'
      };
      return genders[this.gender_allowed] || this.gender_allowed;
    },
    
    // สรุปข้อมูลสำหรับแสดงใน Card
    summary() {
      return {
        id: this.room_type_id,
        name: this.room_type_name,
        description: this.description,
        capacity: this.capacity,
        room_style: this.room_style_text,
        gender_allowed: this.gender_allowed_text,
        room_category: this.room_category_text,
        furnished: this.furnished_text,
        pricing: {
          monthly: this.price_per_month,
          semester: this.price_per_semester,
          water_rate: this.water_rate,
          electricity_rate: this.electricity_rate,
          payment_due_day: this.payment_due_day
        },
        facilities: this.facilities,
        room_size: this.room_size,
        comfort: {
          air_condition: this.air_condition,
          fan: this.fan
        },
        is_active: this.is_active === '1'
      };
    }
  }
});

// Define association กับ RoomTypeImage
import RoomTypeImage from './RoomTypeImage.js';

RoomType.hasMany(RoomTypeImage, {
  foreignKey: 'room_type_id',
  as: 'images'
});

RoomTypeImage.belongsTo(RoomType, {
  foreignKey: 'room_type_id',
  as: 'roomType'
});

export default RoomType;
