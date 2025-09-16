import express from 'express';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from '../config/database.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import RoomImage from '../models/RoomImage.js';
import RoomTypeImage from '../models/RoomTypeImage.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// กำหนดที่เก็บไฟล์สำหรับรูปห้องและประเภทห้อง
const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/rooms';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `room-${uniqueSuffix}${fileExtension}`);
  }
});

const roomTypeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/room-types';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `roomtype-${uniqueSuffix}${fileExtension}`);
  }
});

const roomUpload = multer({
  storage: roomStorage,
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

const roomTypeUpload = multer({
  storage: roomTypeStorage,
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

// Function สำหรับแปลง facility labels
const getFacilityLabel = (facility) => {
  const labels = {
    wifi: 'WiFi',
    hot_water: 'น้ำอุ่น',
    refrigerator: 'ตู้เย็น',
    tv: 'ทีวี',
    desk: 'โต๊ะเรียน',
    chair: 'เก้าอี้',
    bed: 'เตียง',
    closet: 'ตู้เสื้อผ้า',
    balcony: 'ระเบียง',
    private_bathroom: 'ห้องน้ำในตัว'
  };
  return labels[facility] || facility;
};

// GET /api/room-management - ดูข้อมูลห้องและประเภทห้องทั้งหมด
router.get('/', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { room_type_id, status, search } = req.query;
    
    // ดึงข้อมูลประเภทห้อง
    const roomTypes = await RoomType.findAll({
      order: [['room_type_name', 'ASC']]
    });

    // สร้างเงื่อนไขการค้นหาห้อง
    const whereClause = {};
    
    if (room_type_id) {
      whereClause.room_type_id = room_type_id;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.room_number = { [Op.like]: `%${search}%` };
    }

    // ดึงข้อมูลห้อง
    const rooms = await Room.findAll({
      where: whereClause,
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_name', 'capacity', 'price_per_month', 'is_active']
      }],
      order: [['room_number', 'ASC']]
    });

    res.json({
      roomTypes,
      rooms
    });
  } catch (error) {
    console.error('❌ Get room management data error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// POST /api/room-management/room-type - สร้างประเภทห้องใหม่
router.post('/room-type', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const {
      room_type_name,
      description,
      capacity,
      price_per_month,
      price_per_semester,
      water_rate,
      electricity_rate,
      payment_due_day,
      room_style,
      gender_allowed,
      air_condition,
      fan,
      furnished,
      room_category,
      room_size,
      facilities
    } = req.body;

    // Validation
    if (!room_type_name || !capacity || !price_per_month) {
      return res.status(400).json({ 
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' 
      });
    }

    // ตรวจสอบชื่อประเภทห้องซ้ำ
    const existingRoomType = await RoomType.findOne({
      where: { room_type_name: room_type_name.trim() }
    });

    if (existingRoomType) {
      return res.status(400).json({ message: 'ชื่อประเภทห้องนี้มีอยู่แล้ว' });
    }

    // สร้างประเภทห้องใหม่
    const newRoomType = await RoomType.create({
      room_type_name: room_type_name.trim(),
      description: description?.trim() || null,
      capacity: parseInt(capacity),
      price_per_month: parseFloat(price_per_month),
      price_per_semester: price_per_semester ? parseFloat(price_per_semester) : null,
      water_rate: parseFloat(water_rate),
      electricity_rate: parseFloat(electricity_rate),
      payment_due_day: parseInt(payment_due_day),
      room_style: room_style || 'single',
      gender_allowed: gender_allowed || 'mixed',
      air_condition: air_condition || false,
      fan: fan !== false,
      furnished: furnished || 'partial',
      room_category: room_category || 'standard',
      room_size: room_size ? parseFloat(room_size) : null,
      facilities: facilities || {
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
      },
      is_active: '1'
    });

    res.status(201).json({
      message: 'สร้างประเภทห้องสำเร็จ',
      roomType: newRoomType
    });

  } catch (error) {
    console.error('❌ Create room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างประเภทห้อง' });
  }
});

// PUT /api/room-management/room-type/:id - แก้ไขประเภทห้อง
router.put('/room-type/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomTypeId = req.params.id;
    const {
      room_type_name,
      description,
      capacity,
      price_per_month,
      price_per_semester,
      water_rate,
      electricity_rate,
      payment_due_day,
      room_style,
      gender_allowed,
      air_condition,
      fan,
      furnished,
      room_category,
      room_size,
      facilities
    } = req.body;

    // ตรวจสอบว่าประเภทห้องมีอยู่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // ตรวจสอบชื่อประเภทห้องซ้ำ (ยกเว้นตัวเอง)
    const existingRoomType = await RoomType.findOne({
      where: { 
        room_type_name: room_type_name.trim(),
        room_type_id: { [Op.ne]: roomTypeId }
      }
    });

    if (existingRoomType) {
      return res.status(400).json({ message: 'ชื่อประเภทห้องนี้มีอยู่แล้ว' });
    }

    // อัปเดตประเภทห้อง
    await RoomType.update({
      room_type_name: room_type_name.trim(),
      description: description?.trim() || null,
      capacity: parseInt(capacity),
      price_per_month: parseFloat(price_per_month),
      price_per_semester: price_per_semester ? parseFloat(price_per_semester) : null,
      water_rate: parseFloat(water_rate),
      electricity_rate: parseFloat(electricity_rate),
      payment_due_day: parseInt(payment_due_day),
      room_style: room_style || 'single',
      gender_allowed: gender_allowed || 'mixed',
      air_condition: air_condition || false,
      fan: fan !== false,
      furnished: furnished || 'partial',
      room_category: room_category || 'standard',
      room_size: room_size ? parseFloat(room_size) : null,
      facilities: facilities || {
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
    }, {
      where: { room_type_id: roomTypeId }
    });

    // ดึงข้อมูลที่อัปเดตแล้ว
    const updatedRoomType = await RoomType.findByPk(roomTypeId);

    res.json({
      message: 'อัปเดตประเภทห้องสำเร็จ',
      roomType: updatedRoomType
    });

  } catch (error) {
    console.error('❌ Update room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตประเภทห้อง' });
  }
});

// DELETE /api/room-management/room-type/:id - ลบประเภทห้อง
router.delete('/room-type/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomTypeId = req.params.id;

    // ตรวจสอบว่าประเภทห้องมีอยู่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // ตรวจสอบว่ามีห้องที่ใช้ประเภทนี้อยู่หรือไม่
    const roomsCount = await Room.count({
      where: { room_type_id: roomTypeId }
    });

    if (roomsCount > 0) {
      return res.status(400).json({ 
        message: `ไม่สามารถลบได้ มีห้อง ${roomsCount} ห้องที่ใช้ประเภทนี้อยู่` 
      });
    }

    // ลบประเภทห้อง
    await RoomType.destroy({
      where: { room_type_id: roomTypeId }
    });

    res.json({ message: 'ลบประเภทห้องสำเร็จ' });

  } catch (error) {
    console.error('❌ Delete room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบประเภทห้อง' });
  }
});

// PATCH /api/room-management/room-type/:id/toggle - เปิด/ปิดใช้งานประเภทห้อง
router.patch('/room-type/:id/toggle', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomTypeId = req.params.id;

    // ตรวจสอบว่าประเภทห้องมีอยู่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // เปลี่ยนสถานะ
    const newStatus = roomType.is_active === '1' ? '0' : '1';
    await RoomType.update(
      { is_active: newStatus },
      { where: { room_type_id: roomTypeId } }
    );

    res.json({
      message: `${newStatus === '1' ? 'เปิด' : 'ปิด'}ใช้งานประเภทห้องสำเร็จ`,
      is_active: newStatus
    });

  } catch (error) {
    console.error('❌ Toggle room type status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะประเภทห้อง' });
  }
});

// POST /api/room-management/room - สร้างห้องใหม่
router.post('/room', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { room_type_id, room_number, description, status = '1' } = req.body;

    // Validation
    if (!room_type_id || !room_number) {
      return res.status(400).json({ 
        message: 'กรุณาระบุประเภทห้องและหมายเลขห้อง' 
      });
    }

    // ตรวจสอบว่าประเภทห้องมีอยู่และเปิดใช้งาน
    const roomType = await RoomType.findOne({
      where: { room_type_id, is_active: '1' }
    });

    if (!roomType) {
      return res.status(400).json({ message: 'ประเภทห้องนี้ไม่มีหรือถูกปิดใช้งาน' });
    }

    // ตรวจสอบหมายเลขห้องซ้ำ
    const existingRoom = await Room.findOne({ 
      where: { room_number: room_number.trim() } 
    });

    if (existingRoom) {
      return res.status(400).json({ message: 'หมายเลขห้องนี้มีอยู่แล้ว' });
    }

    // สร้างห้องใหม่
    const newRoom = await Room.create({
      room_type_id: parseInt(room_type_id),
      room_number: room_number.trim(),
      description: description?.trim() || null,
      status: status || '1'
    });

    // ดึงข้อมูลห้องพร้อมประเภทห้อง
    const roomWithType = await Room.findByPk(newRoom.room_id, {
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_name', 'capacity', 'price_per_month', 'is_active']
      }]
    });

    res.status(201).json({
      message: 'สร้างห้องสำเร็จ',
      room: roomWithType
    });

  } catch (error) {
    console.error('❌ Create room error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างห้อง' });
  }
});

// PUT /api/room-management/room/:id - แก้ไขห้อง
router.put('/room/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomId = req.params.id;
    const { room_type_id, room_number, description, status } = req.body;

    // ตรวจสอบว่าห้องมีอยู่
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // ตรวจสอบว่าประเภทห้องมีอยู่และเปิดใช้งาน
    const roomType = await RoomType.findOne({
      where: { room_type_id, is_active: '1' }
    });

    if (!roomType) {
      return res.status(400).json({ message: 'ประเภทห้องนี้ไม่มีหรือถูกปิดใช้งาน' });
    }

    // ตรวจสอบหมายเลขห้องซ้ำ (ยกเว้นตัวเอง)
    const existingRoom = await Room.findOne({ 
      where: { 
        room_number: room_number.trim(),
        room_id: { [Op.ne]: roomId }
      } 
    });

    if (existingRoom) {
      return res.status(400).json({ message: 'หมายเลขห้องนี้มีอยู่แล้ว' });
    }

    // อัปเดตห้อง
    await Room.update({
      room_type_id: parseInt(room_type_id),
      room_number: room_number.trim(),
      description: description?.trim() || null,
      status: status || '1'
    }, {
      where: { room_id: roomId }
    });

    // ดึงข้อมูลห้องที่อัปเดตแล้ว
    const updatedRoom = await Room.findByPk(roomId, {
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_name', 'capacity', 'price_per_month', 'is_active']
      }]
    });

    res.json({
      message: 'อัปเดตห้องสำเร็จ',
      room: updatedRoom
    });

  } catch (error) {
    console.error('❌ Update room error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตห้อง' });
  }
});

// DELETE /api/room-management/room/:id - ลบห้อง
router.delete('/room/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomId = req.params.id;

    // ตรวจสอบว่าห้องมีอยู่
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // TODO: ตรวจสอบว่ามีการจองที่ใช้ห้องนี้อยู่หรือไม่
    // const bookingsCount = await Booking.count({
    //   where: { room_id: roomId }
    // });

    // if (bookingsCount > 0) {
    //   return res.status(400).json({ 
    //     message: `ไม่สามารถลบได้ มีการจอง ${bookingsCount} รายการที่ใช้ห้องนี้อยู่` 
    //   });
    // }

    // ลบห้อง
    await Room.destroy({
      where: { room_id: roomId }
    });

    res.json({ message: 'ลบห้องสำเร็จ' });

  } catch (error) {
    console.error('❌ Delete room error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบห้อง' });
  }
});

// PATCH /api/room-management/room/:id/status - เปลี่ยนสถานะห้อง
router.patch('/room/:id/status', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomId = req.params.id;
    const { status } = req.body;

    // Validation
    if (!status || !['1', '0', '2'].includes(status)) {
      return res.status(400).json({ 
        message: 'สถานะต้องเป็น 1=ว่าง, 0=จอง, 2=ซ่อม' 
      });
    }

    // ตรวจสอบว่าห้องมีอยู่
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    await Room.update({
      status: status
    }, {
      where: { room_id: roomId }
    });

    const updatedRoom = await Room.findByPk(roomId, {
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_name', 'capacity', 'price_per_month', 'is_active']
      }]
    });

    const statusText = {
      '1': 'ว่าง',
      '0': 'จอง', 
      '2': 'ซ่อม'
    };

    res.json({
      message: `เปลี่ยนสถานะห้องเป็น "${statusText[status]}" สำเร็จ`,
      room: updatedRoom
    });

  } catch (error) {
    console.error('❌ Update room status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะห้อง' });
  }
});

// POST /api/room-management/room-type/:id/images - อัปโหลดรูปประเภทห้อง
router.post('/room-type/:id/images', authenticateToken, requireManagerOrAdmin, roomTypeUpload.array('images', 10), async (req, res) => {
  try {
    const roomTypeId = req.params.id;
    const { descriptions = [] } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    // ตรวจสอบว่าประเภทห้องมีอยู่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      // ลบไฟล์ที่อัปโหลดมา
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // ตรวจสอบจำนวนรูปที่มีอยู่แล้ว
    const existingImagesCount = await RoomTypeImage.count({
      where: { room_type_id: roomTypeId }
    });

    if (existingImagesCount + req.files.length > 10) {
      // ลบไฟล์ที่อัปโหลดมา
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ 
        message: `ประเภทห้องนี้มีรูปอยู่แล้ว ${existingImagesCount} รูป สามารถเพิ่มได้อีกไม่เกิน ${10 - existingImagesCount} รูป` 
      });
    }

    // เตรียมข้อมูลรูปภาพ
    const imagePromises = req.files.map(async (file, index) => {
      const nextOrder = existingImagesCount + index + 1;
      const description = Array.isArray(descriptions) ? descriptions[index] : descriptions;
      
      return RoomTypeImage.create({
        room_type_id: roomTypeId,
        image_filename: file.filename,
        image_description: description || null,
        image_order: nextOrder,
        is_primary: existingImagesCount === 0 && index === 0 // รูปแรกเป็นรูปหลักถ้าไม่มีรูปเดิม
      });
    });

    const savedImages = await Promise.all(imagePromises);

    res.json({
      message: `อัปโหลดรูปภาพสำเร็จ ${req.files.length} รูป`,
      images: savedImages,
      imageUrls: req.files.map(file => `/uploads/room-types/${file.filename}`)
    });

  } catch (error) {
    console.error('❌ Upload room type images error:', error);
    
    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

// POST /api/room-management/room/:id/images - อัปโหลดรูปห้อง
router.post('/room/:id/images', authenticateToken, requireManagerOrAdmin, roomUpload.array('images', 10), async (req, res) => {
  try {
    const roomId = req.params.id;
    const { descriptions = [] } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    // ตรวจสอบว่าห้องมีอยู่
    const room = await Room.findByPk(roomId);
    if (!room) {
      // ลบไฟล์ที่อัปโหลดมา
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // ตรวจสอบจำนวนรูปที่มีอยู่แล้ว
    const existingImagesCount = await RoomImage.count({
      where: { room_id: roomId }
    });

    if (existingImagesCount + req.files.length > 10) {
      // ลบไฟล์ที่อัปโหลดมา
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ 
        message: `ห้องนี้มีรูปอยู่แล้ว ${existingImagesCount} รูป สามารถเพิ่มได้อีกไม่เกิน ${10 - existingImagesCount} รูป` 
      });
    }

    // เตรียมข้อมูลรูปภาพ
    const imagePromises = req.files.map(async (file, index) => {
      const nextOrder = existingImagesCount + index + 1;
      const description = Array.isArray(descriptions) ? descriptions[index] : descriptions;
      
      return RoomImage.create({
        room_id: roomId,
        image_filename: file.filename,
        image_description: description || null,
        image_order: nextOrder,
        is_primary: existingImagesCount === 0 && index === 0 // รูปแรกเป็นรูปหลักถ้าไม่มีรูปเดิม
      });
    });

    const savedImages = await Promise.all(imagePromises);

    res.json({
      message: `อัปโหลดรูปภาพสำเร็จ ${req.files.length} รูป`,
      images: savedImages,
      imageUrls: req.files.map(file => `/uploads/rooms/${file.filename}`)
    });

  } catch (error) {
    console.error('❌ Upload room images error:', error);
    
    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

export default router;
