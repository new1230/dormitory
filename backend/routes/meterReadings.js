import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import MeterReading from '../models/MeterReading.js';
import MonthlyBill from '../models/MonthlyBill.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// กำหนดที่เก็บไฟล์สำหรับรูปมิเตอร์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/meter-photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `meter-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ JPG, PNG, GIF'));
    }
  }
});

// Middleware to check if user is Manager or Admin
const requireManagerOrAdmin = (req, res, next) => {
  if (!['Manager', 'Admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'ต้องมีสิทธิ์ผู้จัดการหรือแอดมินเท่านั้น' });
  }
  next();
};

// GET /api/meter-readings/rooms/:year/:month - ดูรายการห้องสำหรับจดมิเตอร์ในเดือนปีที่กำหนด
router.get('/rooms/:year/:month', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // ดึงข้อมูลห้องทั้งหมดที่มีผู้เช่า พร้อมข้อมูลมิเตอร์เดือนปัจจุบันและเดือนก่อน
    const [results] = await sequelize.query(`
      SELECT 
        r.room_id,
        r.room_number,
        rt.room_type_name,
        rt.water_rate,
        rt.electricity_rate,
        rt.price_per_month as room_rent,
        rt.payment_due_day,
        m.mem_id,
        m.mem_name,
        -- ข้อมูลมิเตอร์เดือนปัจจุบัน
        mr_current.reading_id as current_reading_id,
        mr_current.current_water_reading,
        mr_current.current_electricity_reading,
        mr_current.other_charges,
        mr_current.other_charges_reason,
        mr_current.meter_photo_water,
        mr_current.meter_photo_electricity,
        mr_current.notes,
        -- ข้อมูลมิเตอร์เดือนก่อน (ถ้าไม่มีให้เป็น 0)
        COALESCE(mr_previous.current_water_reading, 0) as previous_water_reading,
        COALESCE(mr_previous.current_electricity_reading, 0) as previous_electricity_reading
      FROM room r
      INNER JOIN room_type rt ON r.room_type_id = rt.room_type_id
      INNER JOIN \`member\` m ON r.current_tenant_id = m.mem_id
      LEFT JOIN meter_readings mr_current ON r.room_id = mr_current.room_id 
        AND mr_current.reading_month = ? AND mr_current.reading_year = ?
      LEFT JOIN meter_readings mr_previous ON r.room_id = mr_previous.room_id 
        AND mr_previous.reading_month = ? AND mr_previous.reading_year = ?
      WHERE r.status = '0' AND r.current_tenant_id IS NOT NULL
      ORDER BY r.room_number ASC
    `, {
      replacements: [
        parseInt(month), 
        parseInt(year),
        month == 1 ? 12 : parseInt(month) - 1,
        month == 1 ? parseInt(year) - 1 : parseInt(year)
      ]
    });

    // จัดรูปแบบข้อมูล
    const roomsData = results.map(row => ({
      room_id: row.room_id,
      room_number: row.room_number,
      room_type_name: row.room_type_name,
      room_rent: parseFloat(row.room_rent),
      water_rate: parseFloat(row.water_rate),
      electricity_rate: parseFloat(row.electricity_rate),
      payment_due_day: row.payment_due_day,
      tenant: {
        member_id: row.mem_id,
        name: row.mem_name
      },
      current_reading: {
        reading_id: row.current_reading_id,
        water_reading: row.current_water_reading ? parseFloat(row.current_water_reading) : '',
        electricity_reading: row.current_electricity_reading ? parseFloat(row.current_electricity_reading) : '',
        other_charges: row.other_charges ? parseFloat(row.other_charges) : 0,
        other_charges_reason: row.other_charges_reason || '',
        meter_photo_water: row.meter_photo_water,
        meter_photo_electricity: row.meter_photo_electricity,
        notes: row.notes || ''
      },
      previous_reading: {
        water_reading: row.previous_water_reading ? parseFloat(row.previous_water_reading) : 0,
        electricity_reading: row.previous_electricity_reading ? parseFloat(row.previous_electricity_reading) : 0
      }
    }));

    res.json(roomsData);

  } catch (error) {
    console.error('❌ Get meter reading rooms error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง' });
  }
});

// POST/PUT /api/meter-readings - บันทึกข้อมูลมิเตอร์ (upsert)
router.post('/', authenticateToken, requireManagerOrAdmin, upload.fields([
  { name: 'meter_photo_water', maxCount: 1 },
  { name: 'meter_photo_electricity', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      room_id,
      reading_month,
      reading_year,
      current_water_reading,
      current_electricity_reading,
      other_charges = 0,
      other_charges_reason = '',
      notes = ''
    } = req.body;

    // Validation
    if (!room_id || !reading_month || !reading_year || 
        current_water_reading === undefined || current_electricity_reading === undefined) {
      return res.status(400).json({ 
        message: 'กรุณากรอกข้อมูลห้อง เดือน ปี และเลขมิเตอร์ให้ครบถ้วน' 
      });
    }

    // ตรวจสอบว่าห้องมีอยู่จริง
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // ดึงข้อมูลมิเตอร์เดือนก่อน
    const previousMonth = reading_month == 1 ? 12 : parseInt(reading_month) - 1;
    const previousYear = reading_month == 1 ? parseInt(reading_year) - 1 : parseInt(reading_year);
    
    const previousReading = await MeterReading.findOne({
      where: {
        room_id,
        reading_month: previousMonth,
        reading_year: previousYear
      }
    });

    const previous_water = previousReading?.current_water_reading || 0;
    const previous_electricity = previousReading?.current_electricity_reading || 0;

    // เตรียมข้อมูลสำหรับบันทึก
    const meterData = {
      room_id: parseInt(room_id),
      reading_month: parseInt(reading_month),
      reading_year: parseInt(reading_year),
      previous_water_reading: previous_water,
      current_water_reading: parseFloat(current_water_reading),
      previous_electricity_reading: previous_electricity,
      current_electricity_reading: parseFloat(current_electricity_reading),
      other_charges: parseFloat(other_charges),
      other_charges_reason,
      notes,
      recorded_by: req.user.mem_id
    };

    // จัดการรูปภาพ
    if (req.files?.meter_photo_water?.[0]) {
      meterData.meter_photo_water = req.files.meter_photo_water[0].filename;
    } else if (req.body.meter_photo_water_filename) {
      meterData.meter_photo_water = req.body.meter_photo_water_filename;
    }
    
    if (req.files?.meter_photo_electricity?.[0]) {
      meterData.meter_photo_electricity = req.files.meter_photo_electricity[0].filename;
    } else if (req.body.meter_photo_electricity_filename) {
      meterData.meter_photo_electricity = req.body.meter_photo_electricity_filename;
    }

    // บันทึกหรืออัปเดตข้อมูล (upsert)
    const [meterReading, created] = await MeterReading.upsert(meterData, {
      returning: true
    });

    res.json({
      message: created ? 'บันทึกข้อมูลมิเตอร์สำเร็จ' : 'อัปเดตข้อมูลมิเตอร์สำเร็จ',
      meterReading
    });

  } catch (error) {
    console.error('❌ Save meter reading error:', error);
    
    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลมิเตอร์' });
  }
});

// POST /api/meter-readings/calculate-costs - คำนวณค่าใช้จ่ายจากข้อมูลมิเตอร์
router.post('/calculate-costs', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const {
      room_id,
      reading_month,
      reading_year,
      current_water_reading,
      current_electricity_reading,
      other_charges = 0
    } = req.body;

    // ดึงข้อมูลห้องและอัตราค่าสาธารณูปโภค
    const room = await Room.findOne({
      where: { room_id },
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['water_rate', 'electricity_rate', 'price_per_month', 'payment_due_day']
      }]
    });

    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // ดึงข้อมูลมิเตอร์เดือนก่อน
    const previousMonth = reading_month == 1 ? 12 : parseInt(reading_month) - 1;
    const previousYear = reading_month == 1 ? parseInt(reading_year) - 1 : parseInt(reading_year);
    
    const previousReading = await MeterReading.findOne({
      where: {
        room_id,
        reading_month: previousMonth,
        reading_year: previousYear
      }
    });

    const previous_water = previousReading?.current_water_reading || 0;
    const previous_electricity = previousReading?.current_electricity_reading || 0;

    // คำนวณค่าใช้จ่าย
    const water_units = parseFloat(current_water_reading) - previous_water;
    const electricity_units = parseFloat(current_electricity_reading) - previous_electricity;
    
    const water_cost = water_units * parseFloat(room.roomType.water_rate);
    const electricity_cost = electricity_units * parseFloat(room.roomType.electricity_rate);
    const room_rent = parseFloat(room.roomType.price_per_month);
    
    // คำนวณค่าปรับ (ถ้าเลยวันกำหนด)
    const dueDate = new Date(parseInt(reading_year), parseInt(reading_month) - 1, room.roomType.payment_due_day);
    const today = new Date();
    const overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    const penalty_amount = overdueDays > 0 ? overdueDays * 10 : 0; // ค่าปรับ 10 บาท/วัน

    const total_amount = room_rent + water_cost + electricity_cost + parseFloat(other_charges) + penalty_amount;

    res.json({
      calculations: {
        room_rent,
        water_units,
        electricity_units,
        water_cost,
        electricity_cost,
        other_charges: parseFloat(other_charges),
        penalty_amount,
        penalty_days: overdueDays,
        total_amount
      },
      rates: {
        water_rate: parseFloat(room.roomType.water_rate),
        electricity_rate: parseFloat(room.roomType.electricity_rate)
      },
      previous_readings: {
        water: previous_water,
        electricity: previous_electricity
      },
      due_date: dueDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('❌ Calculate costs error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคำนวณค่าใช้จ่าย' });
  }
});

// POST /api/meter-readings/create-bill - สร้างบิลจากข้อมูลมิเตอร์
router.post('/create-bill', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const {
      room_id,
      reading_month,
      reading_year,
      other_charges = 0,
      other_charges_reason = ''
    } = req.body;

    // ตรวจสอบว่ามีข้อมูลมิเตอร์หรือไม่
    const meterReading = await MeterReading.findOne({
      where: {
        room_id,
        reading_month: parseInt(reading_month),
        reading_year: parseInt(reading_year)
      }
    });

    if (!meterReading) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลมิเตอร์สำหรับเดือนปีนี้' });
    }

    // ดึงข้อมูลห้องและผู้เช่า
    const room = await Room.findOne({
      where: { room_id },
      include: [
        {
          model: RoomType,
          as: 'roomType',
          attributes: ['water_rate', 'electricity_rate', 'price_per_month', 'payment_due_day']
        }
      ]
    });

    const roomWithTenant = await sequelize.query(`
      SELECT current_tenant_id FROM room 
      WHERE room_id = ? AND current_tenant_id IS NOT NULL
      LIMIT 1
    `, {
      replacements: [room_id],
      type: sequelize.QueryTypes.SELECT
    });

    if (!roomWithTenant[0] || !roomWithTenant[0].current_tenant_id) {
      return res.status(404).json({ message: 'ไม่พบผู้เช่าในห้องนี้' });
    }

    // คำนวณค่าใช้จ่าย
    const water_units = meterReading.current_water_reading - meterReading.previous_water_reading;
    const electricity_units = meterReading.current_electricity_reading - meterReading.previous_electricity_reading;
    
    const water_cost = water_units * parseFloat(room.roomType.water_rate);
    const electricity_cost = electricity_units * parseFloat(room.roomType.electricity_rate);
    const room_rent = parseFloat(room.roomType.price_per_month);

    // คำนวณค่าปรับ
    const dueDate = new Date(parseInt(reading_year), parseInt(reading_month) - 1, room.roomType.payment_due_day);
    const today = new Date();
    const overdueDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    const penalty_amount = overdueDays > 0 ? overdueDays * 10 : 0;

    // สร้างบิล
    const billData = {
      room_id: parseInt(room_id),
      member_id: roomWithTenant[0].current_tenant_id,
      bill_month: parseInt(reading_month),
      bill_year: parseInt(reading_year),
      reading_id: meterReading.reading_id,
      room_rent,
      water_cost,
      electricity_cost,
      other_charges: parseFloat(other_charges),
      other_charges_reason,
      penalty_amount,
      penalty_days: overdueDays,
      due_date: dueDate,
      bill_status: 'issued',
      issued_date: new Date(),
      created_by: req.user.mem_id
    };

    // ลบบิลเก่าถ้ามี (ป้องกันการซ้ำ)
    await MonthlyBill.destroy({
      where: {
        room_id: roomId,
        bill_month: readingMonth,
        bill_year: readingYear
      }
    });

    // สร้างบิลใหม่
    const bill = await MonthlyBill.create(billData);

    // อัปเดตสถานะมิเตอร์ว่าสร้างบิลแล้ว
    await MeterReading.update(
      { is_billed: true },
      { where: { reading_id: meterReading.reading_id } }
    );

    res.json({
      message: 'สร้างบิลสำเร็จ',
      bill,
      calculations: {
        water_units,
        electricity_units,
        total_amount: room_rent + water_cost + electricity_cost + parseFloat(other_charges) + penalty_amount
      }
    });

  } catch (error) {
    console.error('❌ Create bill error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบิล' });
  }
});

// GET /api/meter-readings/bills/:year/:month - ดูบิลทั้งหมดในเดือนปีที่กำหนด
router.get('/bills/:year/:month', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;

    const bills = await MonthlyBill.findAll({
      where: {
        bill_month: parseInt(month),
        bill_year: parseInt(year)
      },
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['room_number'],
          include: [{
            model: RoomType,
            as: 'roomType',
            attributes: ['room_type_name']
          }]
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['mem_name', 'mem_tel']
        }
      ],
      order: [['room_id', 'ASC']]
    });

    res.json(bills);

  } catch (error) {
    console.error('❌ Get bills error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล' });
  }
});

// POST /api/meter-readings/upload-photo - อัปโหลดรูปมิเตอร์
router.post('/upload-photo', authenticateToken, requireManagerOrAdmin, upload.fields([
  { name: 'meter_photo_water', maxCount: 1 },
  { name: 'meter_photo_electricity', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = {};

    if (files.meter_photo_water?.[0]) {
      uploadedFiles.water = files.meter_photo_water[0].filename;
    }
    if (files.meter_photo_electricity?.[0]) {
      uploadedFiles.electricity = files.meter_photo_electricity[0].filename;
    }

    res.json({
      message: 'อัปโหลดรูปภาพสำเร็จ',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('❌ Upload meter photo error:', error);
    
    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

export default router;
