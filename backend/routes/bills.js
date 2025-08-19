import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import MonthlyBill from '../models/MonthlyBill.js';
import MeterReading from '../models/MeterReading.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// กำหนดที่เก็บไฟล์สำหรับสลิปการชำระ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment-slips';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `slip-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ JPG, PNG, GIF, PDF'));
    }
  }
});

// Middleware สำหรับ Manager/Admin
const requireManagerOrAdmin = (req, res, next) => {
  if (!['Manager', 'Admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'ต้องมีสิทธิ์ผู้จัดการหรือแอดมินเท่านั้น' });
  }
  next();
};

// GET /api/bills/my-bills - ดูบิลของนักศึกษา (ตัวเอง)
router.get('/my-bills', authenticateToken, async (req, res) => {
  try {
    const memberId = req.user.mem_id;
    const { status, limit = 10, offset = 0 } = req.query;

    // สร้าง where condition
    const whereCondition = { member_id: memberId };
    if (status) {
      // รองรับหลาย status (เช่น 'issued,pending_approval,overdue')
      const statusList = status.split(',').map(s => s.trim()).filter(s => s);
      if (statusList.length > 1) {
        whereCondition.bill_status = { [Op.in]: statusList };
      } else {
        whereCondition.bill_status = status;
      }
    }

    const bills = await MonthlyBill.findAndCountAll({
      where: whereCondition,
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
        }
      ],
      order: [['bill_year', 'DESC'], ['bill_month', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // คำนวณ total amount สำหรับแต่ละบิล
    const billsWithTotal = bills.rows.map(bill => {
      const billData = bill.toJSON();
      billData.total_amount = 
        parseFloat(billData.room_rent) + 
        parseFloat(billData.water_cost) + 
        parseFloat(billData.electricity_cost) + 
        parseFloat(billData.other_charges) + 
        parseFloat(billData.penalty_amount);
      return billData;
    });

    res.json({
      bills: billsWithTotal,
      total: bills.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Get student bills error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล' });
  }
});

// POST /api/bills/:id/payment - อัปโหลดสลิปการชำระ
router.post('/:id/payment', authenticateToken, upload.single('payment_slip'), async (req, res) => {
  try {
    const billId = req.params.id;
    const memberId = req.user.mem_id;

    // ตรวจสอบว่าบิลเป็นของผู้ใช้งาน
    const bill = await MonthlyBill.findOne({
      where: {
        bill_id: billId,
        member_id: memberId
      }
    });

    if (!bill) {
      // ลบไฟล์ที่อัปโหลดถ้าไม่พบบิล
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'ไม่พบบิลนี้หรือไม่ใช่บิลของคุณ' });
    }

    if (bill.bill_status === 'paid') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'บิลนี้ชำระเรียบร้อยแล้ว' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์สลิปการชำระ' });
    }

    // อัปเดตบิลด้วยข้อมูลสลิป
    await MonthlyBill.update({
      payment_slip_url: req.file.filename,
      payment_slip_uploaded_at: new Date(),
      bill_status: 'pending_approval'
    }, {
      where: { bill_id: billId }
    });

    const updatedBill = await MonthlyBill.findByPk(billId);

    res.json({
      message: 'อัปโหลดสลิปการชำระสำเร็จ รอการอนุมัติ',
      bill: updatedBill,
      slip_url: `/uploads/payment-slips/${req.file.filename}`
    });

  } catch (error) {
    console.error('❌ Upload payment slip error:', error);
    
    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' });
  }
});

// GET /api/bills/pending-approvals - ดูบิลที่รอการอนุมัติ (Manager/Admin)
router.get('/pending-approvals', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const bills = await MonthlyBill.findAll({
      where: {
        bill_status: 'pending_approval'
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
      order: [['created_date', 'ASC']]
    });

    // คำนวณ total amount สำหรับแต่ละบิล
    const billsWithTotal = bills.map(bill => {
      const billData = bill.toJSON();
      billData.total_amount = 
        parseFloat(billData.room_rent) + 
        parseFloat(billData.water_cost) + 
        parseFloat(billData.electricity_cost) + 
        parseFloat(billData.other_charges) + 
        parseFloat(billData.penalty_amount);
      return billData;
    });

    res.json(billsWithTotal);

  } catch (error) {
    console.error('❌ Get pending bills error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิลรออนุมัติ' });
  }
});

// PATCH /api/bills/:id/approve - อนุมัติการชำระ (Manager/Admin)
router.patch('/:id/approve', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const billId = req.params.id;

    const bill = await MonthlyBill.findByPk(billId);
    if (!bill) {
      return res.status(404).json({ message: 'ไม่พบบิลนี้' });
    }

    if (bill.bill_status !== 'pending_approval') {
      return res.status(400).json({ message: 'บิลนี้ไม่อยู่ในสถานะรออนุมัติ' });
    }

    // อนุมัติการชำระ
    await MonthlyBill.update({
      bill_status: 'paid',
      paid_date: new Date(),
      approved_by: req.user.mem_id
    }, {
      where: { bill_id: billId }
    });

    const updatedBill = await MonthlyBill.findByPk(billId, {
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['room_number']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['mem_name']
        }
      ]
    });

    res.json({
      message: 'อนุมัติการชำระสำเร็จ',
      bill: updatedBill
    });

  } catch (error) {
    console.error('❌ Approve payment error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติการชำระ' });
  }
});

// PATCH /api/bills/:id/reject - ปฏิเสธการชำระ (Manager/Admin)
router.patch('/:id/reject', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const billId = req.params.id;
    const { rejection_reason } = req.body;

    const bill = await MonthlyBill.findByPk(billId);
    if (!bill) {
      return res.status(404).json({ message: 'ไม่พบบิลนี้' });
    }

    if (bill.bill_status !== 'pending_approval') {
      return res.status(400).json({ message: 'บิลนี้ไม่อยู่ในสถานะรออนุมัติ' });
    }

    // ปฏิเสธการชำระ
    await MonthlyBill.update({
      bill_status: 'issued',
      payment_slip_url: null,
      payment_slip_uploaded_at: null,
      rejection_reason: rejection_reason || 'สลิปไม่ชัดเจนหรือไม่ถูกต้อง',
      rejected_by: req.user.mem_id,
      rejected_at: new Date()
    }, {
      where: { bill_id: billId }
    });

    // ลบไฟล์สลิปเดิม
    if (bill.payment_slip_url) {
      const slipPath = path.join('uploads/payment-slips', bill.payment_slip_url);
      if (fs.existsSync(slipPath)) {
        fs.unlinkSync(slipPath);
      }
    }

    const updatedBill = await MonthlyBill.findByPk(billId);

    res.json({
      message: 'ปฏิเสธการชำระสำเร็จ',
      bill: updatedBill
    });

  } catch (error) {
    console.error('❌ Reject payment error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปฏิเสธการชำระ' });
  }
});

// GET /api/bills/all - ดูบิลทั้งหมด (Manager/Admin) 
router.get('/all', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { status, month, year, room_id, search, limit = 50, offset = 0 } = req.query;

    // สร้าง where condition
    const whereCondition = {};
    if (status && status !== 'all') {
      whereCondition.bill_status = status;
    }
    if (month) {
      whereCondition.bill_month = parseInt(month);
    }
    if (year) {
      whereCondition.bill_year = parseInt(year);
    }
    if (room_id) {
      whereCondition.room_id = parseInt(room_id);
    }

    // สำหรับค้นหา
    const includeCondition = {
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['room_number'],
          include: [{
            model: RoomType,
            as: 'roomType',
            attributes: ['room_type_name']
          }],
          ...(search && {
            where: {
              room_number: {
                [Op.like]: `%${search}%`
              }
            }
          })
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['mem_name', 'mem_tel'],
          ...(search && {
            where: {
              [Op.or]: [
                { mem_name: { [Op.like]: `%${search}%` } },
                { mem_tel: { [Op.like]: `%${search}%` } }
              ]
            }
          })
        }
      ]
    };

    const bills = await MonthlyBill.findAndCountAll({
      where: whereCondition,
      ...includeCondition,
      order: [['bill_year', 'DESC'], ['bill_month', 'DESC'], ['created_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // คำนวณ total amount สำหรับแต่ละบิล
    const billsWithTotal = bills.rows.map(bill => {
      const billData = bill.toJSON();
      billData.total_amount = 
        parseFloat(billData.room_rent) + 
        parseFloat(billData.water_cost) + 
        parseFloat(billData.electricity_cost) + 
        parseFloat(billData.other_charges) + 
        parseFloat(billData.penalty_amount);
      return billData;
    });

    res.json({
      bills: billsWithTotal,
      total: bills.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Get all bills error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล' });
  }
});

// GET /api/bills/export-excel - ออกรายงาน Excel (Manager/Admin)
router.get('/export-excel', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'กรุณาระบุเดือนและปี' });
    }

    // ดึงข้อมูลบิลและข้อมูลมิเตอร์
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
            attributes: ['room_type_name', 'water_rate', 'electricity_rate']
          }]
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['mem_name', 'mem_tel']
        },
        {
          model: MeterReading,
          as: 'meterReading',
          attributes: ['previous_water_reading', 'current_water_reading', 
                      'previous_electricity_reading', 'current_electricity_reading',
                      'meter_photo_water', 'meter_photo_electricity', 'recorded_date']
        }
      ],
      order: [['room_id', 'ASC']]
    });

    // เตรียมข้อมูลสำหรับ Excel
    const excelData = bills.map(bill => {
      const billData = bill.toJSON();
      const meterReading = billData.meterReading || {};
      
      return {
        'หมายเลขห้อง': billData.room.room_number,
        'ประเภทห้อง': billData.room.roomType.room_type_name,
        'ผู้เช่า': billData.tenant.mem_name,
        'เบอร์โทร': billData.tenant.mem_tel,
        'เดือน/ปี': `${month}/${year}`,
        'ค่าเช่าห้อง': billData.room_rent,
        'มิเตอร์น้ำก่อน': meterReading.previous_water_reading || 0,
        'มิเตอร์น้ำปัจจุบัน': meterReading.current_water_reading || 0,
        'น้ำใช้ (หน่วย)': (meterReading.current_water_reading || 0) - (meterReading.previous_water_reading || 0),
        'ค่าน้ำ': billData.water_cost,
        'มิเตอร์ไฟก่อน': meterReading.previous_electricity_reading || 0,
        'มิเตอร์ไฟปัจจุบัน': meterReading.current_electricity_reading || 0,
        'ไฟใช้ (หน่วย)': (meterReading.current_electricity_reading || 0) - (meterReading.previous_electricity_reading || 0),
        'ค่าไฟ': billData.electricity_cost,
        'ค่าใช้จ่ายอื่น': billData.other_charges,
        'เหตุผลค่าใช้จ่ายอื่น': billData.other_charges_reason || '',
        'ค่าปรับ': billData.penalty_amount,
        'ยอดรวม': parseFloat(billData.room_rent) + parseFloat(billData.water_cost) + 
                  parseFloat(billData.electricity_cost) + parseFloat(billData.other_charges) + 
                  parseFloat(billData.penalty_amount),
        'สถานะ': billData.bill_status,
        'วันครบกำหนด': billData.due_date,
        'วันที่ชำระ': billData.paid_date || '',
        'รูปมิเตอร์น้ำ': meterReading.meter_photo_water ? 'มี' : 'ไม่มี',
        'รูปมิเตอร์ไฟ': meterReading.meter_photo_electricity ? 'มี' : 'ไม่มี',
        'วันที่จดมิเตอร์': meterReading.recorded_date || ''
      };
    });

    // สร้าง workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // กำหนดความกว้างคอลัมน์
    const colWidths = [
      { wch: 12 }, // หมายเลขห้อง
      { wch: 15 }, // ประเภทห้อง
      { wch: 20 }, // ผู้เช่า
      { wch: 15 }, // เบอร์โทร
      { wch: 10 }, // เดือน/ปี
      { wch: 12 }, // ค่าเช่าห้อง
      { wch: 12 }, // มิเตอร์น้ำก่อน
      { wch: 15 }, // มิเตอร์น้ำปัจจุบัน
      { wch: 12 }, // น้ำใช้
      { wch: 10 }, // ค่าน้ำ
      { wch: 12 }, // มิเตอร์ไฟก่อน
      { wch: 15 }, // มิเตอร์ไฟปัจจุบัน
      { wch: 12 }, // ไฟใช้
      { wch: 10 }, // ค่าไฟ
      { wch: 12 }, // ค่าใช้จ่ายอื่น
      { wch: 25 }, // เหตุผล
      { wch: 10 }, // ค่าปรับ
      { wch: 12 }, // ยอดรวม
      { wch: 12 }, // สถานะ
      { wch: 15 }, // วันครบกำหนด
      { wch: 15 }, // วันที่ชำระ
      { wch: 12 }, // รูปมิเตอร์น้ำ
      { wch: 12 }, // รูปมิเตอร์ไฟ
      { wch: 18 }  // วันที่จดมิเตอร์
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, `บิล ${month}-${year}`);

    // สร้างไฟล์ Excel
    const fileName = `รายงานบิล_${month}-${year}_${Date.now()}.xlsx`;
    const filePath = path.join('uploads/reports', fileName);

    // สร้างโฟลเดอร์ถ้าไม่มี
    const reportsDir = 'uploads/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    XLSX.writeFile(wb, filePath);

    // ส่งไฟล์
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('❌ Download error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดาวน์โหลด' });
      }
      
      // ลบไฟล์หลังดาวน์โหลดเสร็จ
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 10000); // ลบหลัง 10 วินาที
    });

  } catch (error) {
    console.error('❌ Export Excel error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการออกรายงาน Excel' });
  }
});

export default router;
