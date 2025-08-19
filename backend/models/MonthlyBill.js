import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MonthlyBill = sequelize.define('MonthlyBill', {
  bill_id: {
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
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'member',
      key: 'mem_id'
    },
    comment: 'ผู้เช่า'
  },
  bill_month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    },
    comment: 'เดือนของบิล (1-12)'
  },
  bill_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ปีของบิล'
  },
  reading_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'meter_readings',
      key: 'reading_id'
    },
    comment: 'อ้างอิงข้อมูลมิเตอร์'
  },
  room_rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'ค่าเช่าห้อง'
  },
  water_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'ค่าน้ำ'
  },
  electricity_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'ค่าไฟ'
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
  penalty_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'ค่าปรับชำระล่าช้า'
  },
  penalty_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'จำนวนวันที่เลยกำหนด'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'วันครบกำหนดชำระ'
  },
  bill_status: {
    type: DataTypes.ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'draft'
  },
  issued_date: {
    type: DataTypes.DATE,
    comment: 'วันที่ออกบิล'
  },
  paid_date: {
    type: DataTypes.DATE,
    comment: 'วันที่ชำระ'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'member',
      key: 'mem_id'
    },
    comment: 'ผู้สร้างบิล (mem_id)'
  },
  created_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_date: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'monthly_bills',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'bill_month', 'bill_year'],
      name: 'unique_room_bill_month_year'
    },
    {
      fields: ['room_id']
    },
    {
      fields: ['member_id']
    },
    {
      fields: ['bill_month', 'bill_year']
    },
    {
      fields: ['bill_status']
    },
    {
      fields: ['due_date']
    }
  ]
});

// Define associations
MonthlyBill.associate = (models) => {
  MonthlyBill.belongsTo(models.Room, {
    foreignKey: 'room_id',
    as: 'room'
  });
  MonthlyBill.belongsTo(models.User, {
    foreignKey: 'member_id',
    targetKey: 'mem_id',
    as: 'tenant'
  });
  MonthlyBill.belongsTo(models.MeterReading, {
    foreignKey: 'reading_id',
    as: 'meterReading'
  });
  MonthlyBill.belongsTo(models.User, {
    foreignKey: 'created_by',
    targetKey: 'mem_id',
    as: 'creator'
  });
};

export default MonthlyBill;
