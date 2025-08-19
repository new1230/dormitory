import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MeterReading = sequelize.define('MeterReading', {
  reading_id: {
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
  reading_month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    },
    comment: 'เดือนที่จด (1-12)'
  },
  reading_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ปีที่จด'
  },
  previous_water_reading: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'เลขมิเตอร์น้ำเดือนที่แล้ว'
  },
  current_water_reading: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'เลขมิเตอร์น้ำเดือนนี้'
  },
  previous_electricity_reading: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'เลขมิเตอร์ไฟเดือนที่แล้ว'
  },
  current_electricity_reading: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'เลขมิเตอร์ไฟเดือนนี้'
  },
  other_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'ค่าใช้จ่ายอื่นๆ'
  },
  other_charges_reason: {
    type: DataTypes.TEXT,
    comment: 'เหตุผลค่าใช้จ่ายอื่นๆ'
  },
  meter_photo_water: {
    type: DataTypes.STRING(255),
    comment: 'รูปภาพมิเตอร์น้ำ'
  },
  meter_photo_electricity: {
    type: DataTypes.STRING(255),
    comment: 'รูปภาพมิเตอร์ไฟ'
  },
  recorded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'member',
      key: 'mem_id'
    },
    comment: 'ผู้จดมิเตอร์ (mem_id)'
  },
  recorded_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'หมายเหตุเพิ่มเติม'
  },
  is_billed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'สร้างบิลแล้วหรือยัง'
  }
}, {
  tableName: 'meter_readings',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'reading_month', 'reading_year'],
      name: 'unique_room_month_year'
    },
    {
      fields: ['room_id']
    },
    {
      fields: ['reading_month', 'reading_year']
    },
    {
      fields: ['recorded_by']
    }
  ]
});

// Define associations
MeterReading.associate = (models) => {
  MeterReading.belongsTo(models.Room, {
    foreignKey: 'room_id',
    as: 'room'
  });
  MeterReading.belongsTo(models.User, {
    foreignKey: 'recorded_by',
    targetKey: 'mem_id',
    as: 'recorder'
  });
  MeterReading.hasOne(models.MonthlyBill, {
    foreignKey: 'reading_id',
    as: 'bill'
  });
};

export default MeterReading;
