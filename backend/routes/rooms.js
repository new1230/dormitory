import express from 'express';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from '../config/database.js';
import Room from '../models/Room.js';
import RoomType from '../models/RoomType.js';
import RoomImage from '../models/RoomImage.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// กำหนดที่เก็บไฟล์สำหรับรูปห้อง
const storage = multer.diskStorage({
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

// GET /api/rooms/stats - ดูสถิติห้องตามประเภท
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // ดึงข้อมูลจาก room_detail_view
    const [results] = await sequelize.query(`
      SELECT 
        room_type_id,
        room_type_name,
        room_id,
        room_number,
        status,
        status_text,
        current_tenant_id,
        tenant_name,
        contract_end,
        days_left_contract
      FROM room_detail_view 
      ORDER BY room_type_id, room_number
    `);

    // จัดกลุ่มข้อมูลตามประเภทห้อง
    const stats = {};
    
    results.forEach(room => {
      const typeId = room.room_type_id;
      
      if (!stats[typeId]) {
        stats[typeId] = {
          total: 0,
          available: 0,
          occupied: 0,
          booked: 0,
          maintenance: 0,
          rooms: []
        };
      }

      stats[typeId].total++;
      stats[typeId].rooms.push(room);

      // นับสถานะห้อง
      switch(room.status) {
        case '1': // ว่าง
          stats[typeId].available++;
          break;
        case '0': // มีผู้พัก
          stats[typeId].occupied++;
          break;
        case '3': // จองแล้ว
          stats[typeId].booked++;
          break;
        case '2': // ปิดซ่อม
          stats[typeId].maintenance++;
          break;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Get room stats error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติห้อง' });
  }
});

// GET /api/rooms/filtered - ค้นหาห้องด้วย filters (ไม่ต้อง auth)
router.get('/filtered', async (req, res) => {
  try {
    const { 
      room_style, 
      gender_allowed, 
      furnished, 
      room_category, 
      air_condition, 
      min_price, 
      max_price, 
      capacity 
    } = req.query;

    let whereClause = ["r.status = '1'", "rt.is_active = '1'"];
    let replacements = [];

    if (room_style) {
      whereClause.push("rt.room_style = ?");
      replacements.push(room_style);
    }
    if (gender_allowed) {
      whereClause.push("rt.gender_allowed = ?");
      replacements.push(gender_allowed);
    }
    if (furnished) {
      whereClause.push("rt.furnished = ?");
      replacements.push(furnished);
    }
    if (room_category) {
      whereClause.push("rt.room_category = ?");
      replacements.push(room_category);
    }
    if (air_condition) {
      whereClause.push("rt.air_condition = ?");
      replacements.push(air_condition);
    }
    if (capacity) {
      whereClause.push("rt.capacity = ?");
      replacements.push(capacity);
    }
    if (min_price) {
      whereClause.push("rt.price_per_month >= ?");
      replacements.push(min_price);
    }
    if (max_price) {
      whereClause.push("rt.price_per_month <= ?");
      replacements.push(max_price);
    }

    const [results] = await sequelize.query(`
      SELECT 
        r.room_id,
        r.room_number,
        r.description as room_description,
        rt.room_type_id,
        rt.room_type_name,
        rt.description as room_type_description,
        rt.capacity,
        rt.price_per_month,
        rt.price_per_semester,
        rt.water_rate,
        rt.electricity_rate,
        rt.payment_due_day,
        rt.room_style,
        rt.gender_allowed,
        rt.air_condition,
        rt.fan,
        rt.furnished,
        rt.room_category,
        rt.facilities,
        rt.room_size,
        rt.thumbnail as room_type_thumbnail,
        r.room_img as primary_room_image
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE ${whereClause.join(' AND ')}
      ORDER BY rt.price_per_month ASC, r.room_number ASC
    `, {
      replacements
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Get filtered rooms error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาห้อง' });
  }
});

// GET /api/rooms - ดูรายการห้องทั้งหมด
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { room_type_id, status, search } = req.query;
    
    // สร้างเงื่อนไขการค้นหา
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

    const rooms = await Room.findAll({
      where: whereClause,
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: [
          'room_type_name', 
          'capacity', 
          'price_per_month',
          'price_per_semester',
          'water_rate',
          'electricity_rate',
          'payment_due_day',
          'room_style',
          'gender_allowed',
          'air_condition',
          'fan',
          'furnished',
          'room_category',
          'room_size',
          'facilities',
          'description'
        ]
      }],
      order: [['room_number', 'ASC']]
    });

    res.json(rooms);
  } catch (error) {
    console.error('❌ Get rooms error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง' });
  }
});

// GET /api/rooms/:id - ดูห้องตาม ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{
        model: RoomType,
        as: 'roomType'
      }]
    });

    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    res.json(room);
  } catch (error) {
    console.error('❌ Get room error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง' });
  }
});

// POST /api/rooms - เพิ่มห้องใหม่
router.post('/', authenticateToken, requireManagerOrAdmin, async (req, res) => {
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
        attributes: ['room_type_name', 'capacity', 'price_per_month']
      }]
    });

    res.status(201).json({
      message: 'เพิ่มห้องสำเร็จ',
      room: roomWithType
    });

  } catch (error) {
    console.error('❌ Create room error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มห้อง' });
  }
});

// PUT /api/rooms/:id - แก้ไขห้อง
router.put('/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { room_type_id, room_number, description, status } = req.body;
    const roomId = req.params.id;

    // Validation
    if (!room_type_id || !room_number) {
      return res.status(400).json({ 
        message: 'กรุณาระบุประเภทห้องและหมายเลขห้อง' 
      });
    }

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
        attributes: ['room_type_name', 'capacity', 'price_per_month']
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

// DELETE /api/rooms/:id - ลบห้อง
router.delete('/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomId = req.params.id;

    // ตรวจสอบว่าห้องมีอยู่
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'ไม่พบห้องนี้' });
    }

    // ตรวจสอบว่าห้องมีผู้เช่าอยู่หรือไม่
    if (room.current_tenant_id) {
      return res.status(400).json({ 
        message: 'ไม่สามารถลบได้ เนื่องจากมีผู้เช่าอยู่ในห้องนี้' 
      });
    }

    // ตรวจสอบว่าห้องมีสถานะเป็น "มีผู้เช่า" หรือไม่
    if (room.status === '3') {
      return res.status(400).json({ 
        message: 'ไม่สามารถลบได้ เนื่องจากห้องมีผู้เช่าอยู่' 
      });
    }

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

// PATCH /api/rooms/:id/status - เปลี่ยนสถานะห้อง
router.patch('/:id/status', authenticateToken, requireManagerOrAdmin, async (req, res) => {
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
        attributes: ['room_type_name', 'capacity', 'price_per_month']
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

// GET /api/rooms/dashboard - ดูสถิติห้องพักสำหรับ dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // นับจำนวนห้องตามสถานะ
    const roomStats = await Room.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('room_id')), 'count']
      ],
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_name']
      }],
      group: ['status', 'roomType.room_type_id', 'roomType.room_type_name'],
      raw: false
    });

    // นับจำนวนห้องทั้งหมดตามประเภท
    const roomTypeStats = await Room.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Room.room_id')), 'total_rooms']
      ],
      include: [{
        model: RoomType,
        as: 'roomType',
        attributes: ['room_type_id', 'room_type_name', 'capacity', 'price_per_month']
      }],
      group: ['roomType.room_type_id'],
      raw: false
    });

    // สรุปสถานะรวม
    const totalRooms = await Room.count();
    const availableRooms = await Room.count({ where: { status: '1' } });
    const bookedRooms = await Room.count({ where: { status: '0' } });
    const maintenanceRooms = await Room.count({ where: { status: '2' } });

    // ห้องที่มีการจองและข้อมูลการหมดสัญญา (TODO: เชื่อมกับ booking table)
    // const roomsWithContracts = await Room.findAll({
    //   where: { status: '0' },
    //   include: [{
    //     model: Booking,
    //     as: 'bookings',
    //     attributes: ['check_out_date'],
    //     order: [['check_out_date', 'DESC']],
    //     limit: 1
    //   }]
    // });

    res.json({
      summary: {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        maintenance: maintenanceRooms,
        occupancy_rate: totalRooms > 0 ? ((bookedRooms / totalRooms) * 100).toFixed(1) : 0
      },
      roomStats: roomStats.map(stat => ({
        status: stat.status,
        status_text: stat.status === '1' ? 'ว่าง' : stat.status === '0' ? 'จอง' : 'ซ่อม',
        room_type: stat.roomType?.room_type_name || 'ไม่ระบุ',
        count: parseInt(stat.getDataValue('count'))
      })),
      roomTypeStats: roomTypeStats.map(stat => ({
        room_type_id: stat.roomType?.room_type_id,
        room_type_name: stat.roomType?.room_type_name,
        capacity: stat.roomType?.capacity,
        price_per_month: stat.roomType?.price_per_month,
        total_rooms: parseInt(stat.getDataValue('total_rooms'))
      }))
    });

  } catch (error) {
    console.error('❌ Get dashboard error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล dashboard' });
  }
});

// POST /api/rooms/:id/images - อัปโหลดรูปห้อง (สูงสุด 10 รูป)
router.post('/:id/images', authenticateToken, requireManagerOrAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const roomId = req.params.id;
    const { descriptions = [] } = req.body; // คำอธิบายแต่ละรูป

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

// GET /api/rooms/:id/images - ดูรูปห้อง
router.get('/:id/images', async (req, res) => {
  try {
    const roomId = req.params.id;

    const images = await RoomImage.findAll({
      where: { room_id: roomId },
      order: [['image_order', 'ASC']]
    });

    const imagesWithUrls = images.map(image => ({
      ...image.toJSON(),
      imageUrl: `/uploads/rooms/${image.image_filename}`
    }));

    res.json(imagesWithUrls);
  } catch (error) {
    console.error('❌ Get room images error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ' });
  }
});

// DELETE /api/rooms/:roomId/images/:imageId - ลบรูปห้อง
router.delete('/:roomId/images/:imageId', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { roomId, imageId } = req.params;

    // ตรวจสอบว่ารูปมีอยู่
    const image = await RoomImage.findOne({
      where: { image_id: imageId, room_id: roomId }
    });

    if (!image) {
      return res.status(404).json({ message: 'ไม่พบรูปภาพนี้' });
    }

    // ลบไฟล์
    const imagePath = path.join('uploads/rooms', image.image_filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // ลบจากฐานข้อมูล
    await RoomImage.destroy({
      where: { image_id: imageId }
    });

    // ถ้าลบรูปหลัก ให้กำหนดรูปถัดไปเป็นรูปหลัก
    if (image.is_primary) {
      const nextImage = await RoomImage.findOne({
        where: { room_id: roomId },
        order: [['image_order', 'ASC']]
      });

      if (nextImage) {
        await RoomImage.update(
          { is_primary: true },
          { where: { image_id: nextImage.image_id } }
        );
      }
    }

    res.json({ message: 'ลบรูปภาพสำเร็จ' });

  } catch (error) {
    console.error('❌ Delete room image error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
  }
});

// PATCH /api/rooms/:roomId/images/:imageId/primary - กำหนดรูปหลัก
router.patch('/:roomId/images/:imageId/primary', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { roomId, imageId } = req.params;

    // ตรวจสอบว่ารูปมีอยู่
    const image = await RoomImage.findOne({
      where: { image_id: imageId, room_id: roomId }
    });

    if (!image) {
      return res.status(404).json({ message: 'ไม่พบรูปภาพนี้' });
    }

    // ยกเลิกรูปหลักเดิม
    await RoomImage.update(
      { is_primary: false },
      { where: { room_id: roomId } }
    );

    // กำหนดรูปใหม่เป็นรูปหลัก
    await RoomImage.update(
      { is_primary: true },
      { where: { image_id: imageId } }
    );

    res.json({ message: 'กำหนดรูปหลักสำเร็จ' });

  } catch (error) {
    console.error('❌ Set primary image error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการกำหนดรูปหลัก' });
  }
});

// GET /api/rooms/available/:typeId - ดูห้องว่างในประเภทนั้น
// GET /api/rooms/filtered - ค้นหาห้องด้วย filters (ไม่ต้อง auth)
router.get('/filtered', async (req, res) => {
  try {
    const { 
      room_style, 
      gender_allowed, 
      furnished, 
      room_category, 
      air_condition, 
      min_price, 
      max_price, 
      capacity 
    } = req.query;

    let whereClause = ["r.status = '1'", "rt.is_active = '1'"];
    let replacements = [];

    if (room_style) {
      whereClause.push("rt.room_style = ?");
      replacements.push(room_style);
    }
    if (gender_allowed) {
      whereClause.push("rt.gender_allowed = ?");
      replacements.push(gender_allowed);
    }
    if (furnished) {
      whereClause.push("rt.furnished = ?");
      replacements.push(furnished);
    }
    if (room_category) {
      whereClause.push("rt.room_category = ?");
      replacements.push(room_category);
    }
    if (air_condition) {
      whereClause.push("rt.air_condition = ?");
      replacements.push(air_condition);
    }
    if (capacity) {
      whereClause.push("rt.capacity = ?");
      replacements.push(capacity);
    }
    if (min_price) {
      whereClause.push("rt.price_per_month >= ?");
      replacements.push(min_price);
    }
    if (max_price) {
      whereClause.push("rt.price_per_month <= ?");
      replacements.push(max_price);
    }

    const [results] = await sequelize.query(`
      SELECT 
        r.room_id,
        r.room_number,
        r.description as room_description,
        rt.room_type_id,
        rt.room_type_name,
        rt.description as room_type_description,
        rt.capacity,
        rt.price_per_month,
        rt.price_per_semester,
        rt.water_rate,
        rt.electricity_rate,
        rt.payment_due_day,
        rt.room_style,
        rt.gender_allowed,
        rt.air_condition,
        rt.fan,
        rt.furnished,
        rt.room_category,
        rt.facilities,
        rt.room_size,
        rt.thumbnail as room_type_thumbnail,
        r.room_img as primary_room_image
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE ${whereClause.join(' AND ')}
      ORDER BY rt.price_per_month ASC, r.room_number ASC
    `, {
      replacements
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Get filtered rooms error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาห้อง' });
  }
});

// GET /api/rooms/available/:typeId - ดูห้องว่างในประเภทนั้น (ไม่ต้อง auth)
router.get('/available/:typeId', async (req, res) => {
  try {
    const roomTypeId = req.params.typeId;

    const [results] = await sequelize.query(`
      SELECT 
        r.room_id,
        r.room_number,
        r.description as room_description,
        rt.room_type_id,
        rt.room_type_name,
        rt.description as room_type_description,
        rt.capacity,
        rt.price_per_month,
        rt.price_per_semester,
        rt.water_rate,
        rt.electricity_rate,
        rt.payment_due_day,
        rt.room_style,
        rt.gender_allowed,
        rt.air_condition,
        rt.fan,
        rt.furnished,
        rt.room_category,
        rt.facilities,
        rt.room_size,
        rt.thumbnail as room_type_thumbnail,
        r.room_img as primary_room_image
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_type_id = ? AND r.status = '1' AND rt.is_active = '1'
      ORDER BY r.room_number
    `, {
      replacements: [roomTypeId]
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Get available rooms error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องว่าง' });
  }
});

export default router;
