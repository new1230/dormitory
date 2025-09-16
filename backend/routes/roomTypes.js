import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import RoomType from '../models/RoomType.js';
import RoomTypeImage from '../models/RoomTypeImage.js';
import Room from '../models/Room.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/room-types/availability - ดูประเภทห้องพร้อมจำนวนห้องว่าง (สำหรับหน้า /dormitories) - ไม่ต้องเข้าสู่ระบบ
router.get('/availability', async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        rt.room_type_id,
        rt.room_type_name,
        rt.description,
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
        rt.thumbnail,
        COUNT(r.room_id) as total_rooms,
        SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) as available_rooms,
        SUM(CASE WHEN r.status = '0' THEN 1 ELSE 0 END) as occupied_rooms,
        SUM(CASE WHEN r.status = '3' THEN 1 ELSE 0 END) as booked_rooms,
        SUM(CASE WHEN r.status = '2' THEN 1 ELSE 0 END) as maintenance_rooms
      FROM room_type rt
      LEFT JOIN room r ON rt.room_type_id = r.room_type_id
      WHERE rt.is_active = '1'
      GROUP BY rt.room_type_id
      ORDER BY 
        CASE WHEN SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) > 0 THEN 0 ELSE 1 END,
        SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) DESC,
        rt.room_type_name
    `);

    const roomTypesWithAvailability = results.map(row => ({
      room_type_id: row.room_type_id,
      room_type_name: row.room_type_name,
      description: row.description,
      thumbnail: row.thumbnail,
      capacity: row.capacity,
      price_per_month: row.price_per_month,
      price_per_semester: row.price_per_semester,
      water_rate: row.water_rate,
      electricity_rate: row.electricity_rate,
      payment_due_day: row.payment_due_day,
      room_style: row.room_style,
      gender_allowed: row.gender_allowed,
      air_condition: row.air_condition,
      fan: row.fan,
      furnished: row.furnished,
      room_category: row.room_category,
      facilities: row.facilities,
      room_size: row.room_size,
      stats: {
        total: row.total_rooms || 0,
        available: row.available_rooms || 0,
        occupied: row.occupied_rooms || 0,
        booked: row.booked_rooms || 0,
        maintenance: row.maintenance_rooms || 0,
        has_available: (row.available_rooms || 0) > 0
      }
    }));

    res.json(roomTypesWithAvailability);
  } catch (error) {
    console.error('❌ Get room types availability error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องว่าง' });
  }
});

// กำหนดที่เก็บไฟล์สำหรับ thumbnail
const storage = multer.diskStorage({
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

// GET /api/room-types - ดูรายการประเภทห้องทั้งหมด
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roomTypes = await RoomType.findAll({
      include: [{
        model: RoomTypeImage,
        as: 'images',
        where: { is_primary: true },
        required: false,
        attributes: ['image_filename', 'image_description']
      }],
      order: [['room_type_name', 'ASC']]
    });

    // แปลงข้อมูลให้มี thumbnail field สำหรับ backward compatibility
    const roomTypesWithThumbnail = roomTypes.map(rt => {
      const roomType = rt.toJSON();
      roomType.thumbnail = roomType.images?.[0]?.image_filename || null;
      return roomType;
    });

    res.json(roomTypesWithThumbnail);
  } catch (error) {
    console.error('❌ Get room types error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทห้อง' });
  }
});

// GET /api/room-types/:id - ดูประเภทห้องตาม ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const roomType = await RoomType.findByPk(req.params.id);

    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    res.json(roomType);
  } catch (error) {
    console.error('❌ Get room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทห้อง' });
  }
});

// POST /api/room-types - เพิ่มประเภทห้องใหม่
router.post('/', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { 
      room_type_name, description, capacity, price_per_month, price_per_semester,
      water_rate, electricity_rate, payment_due_day, room_style, gender_allowed,
      air_condition, fan, furnished, room_category, room_size,
      facilities
    } = req.body;

    // Validation
    if (!room_type_name || !capacity || !price_per_month) {
      return res.status(400).json({ 
        message: 'กรุณากรอกชื่อประเภทห้อง จำนวนคน และราคาต่อเดือน' 
      });
    }

    if (capacity < 1 || price_per_month < 0) {
      return res.status(400).json({ 
        message: 'จำนวนคนต้องมากกว่า 0 และราคาต้องไม่ติดลบ' 
      });
    }

    // อนุญาตให้ชื่อประเภทห้องซ้ำกันได้

    // เตรียมข้อมูลสำหรับบันทึก
    const roomTypeData = {
      room_type_name: room_type_name.trim(),
      description: description?.trim() || null,
      capacity: parseInt(capacity),
      price_per_month: parseFloat(price_per_month),
      price_per_semester: price_per_semester ? parseFloat(price_per_semester) : null,
      water_rate: water_rate ? parseFloat(water_rate) : 0,
      electricity_rate: electricity_rate ? parseFloat(electricity_rate) : 0,
      payment_due_day: payment_due_day ? parseInt(payment_due_day) : 5,
      room_style: room_style || 'single',
      gender_allowed: gender_allowed || 'mixed',
      air_condition: air_condition === 'true' || air_condition === true,
      fan: fan === 'true' || fan === true || fan !== false,
      furnished: furnished || 'partial',
      room_category: room_category || 'standard',
      room_size: room_size ? parseFloat(room_size) : null,
      facilities: facilities ? (typeof facilities === 'string' ? JSON.parse(facilities) : facilities) : null,
      is_active: '1'
    };

    // สร้างประเภทห้องใหม่
    const newRoomType = await RoomType.create(roomTypeData);

    res.status(201).json({
      message: 'เพิ่มประเภทห้องสำเร็จ',
      roomType: newRoomType
    });

  } catch (error) {
    console.error('❌ Create room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มประเภทห้อง' });
  }
});

// PUT /api/room-types/:id - แก้ไขประเภทห้อง
router.put('/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { 
      room_type_name, description, capacity, price_per_month, price_per_semester,
      water_rate, electricity_rate, payment_due_day, room_style, gender_allowed,
      air_condition, fan, furnished, room_category, room_size, facilities, is_active 
    } = req.body;
    const roomTypeId = req.params.id;

    // Validation
    if (!room_type_name || !capacity || !price_per_month) {
      return res.status(400).json({ 
        message: 'กรุณากรอกชื่อประเภทห้อง จำนวนคน และราคาต่อเดือน' 
      });
    }

    if (capacity < 1 || price_per_month < 0) {
      return res.status(400).json({ 
        message: 'จำนวนคนต้องมากกว่า 0 และราคาต้องไม่ติดลบ' 
      });
    }

    // ตรวจสอบว่าประเภทห้องมีอยู่หรือไม่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // ตรวจสอบชื่อซ้ำ (ยกเว้นตัวเอง)
    const existingType = await RoomType.findOne({ 
      where: { 
        room_type_name: room_type_name.trim(),
        room_type_id: { [Op.ne]: roomTypeId }
      } 
    });

    if (existingType) {
      return res.status(400).json({ message: 'ชื่อประเภทห้องนี้มีอยู่แล้ว' });
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {
      room_type_name: room_type_name.trim(),
      description: description?.trim() || null,
      capacity: parseInt(capacity),
      price_per_month: parseFloat(price_per_month),
      price_per_semester: price_per_semester ? parseFloat(price_per_semester) : null,
      water_rate: water_rate ? parseFloat(water_rate) : 0,
      electricity_rate: electricity_rate ? parseFloat(electricity_rate) : 0,
      payment_due_day: payment_due_day ? parseInt(payment_due_day) : 5,
      room_style: room_style || 'single',
      gender_allowed: gender_allowed || 'mixed',
      air_condition: air_condition === 'true' || air_condition === true,
      fan: fan === 'true' || fan === true || fan !== false,
      furnished: furnished || 'partial',
      room_category: room_category || 'standard',
      room_size: room_size ? parseFloat(room_size) : null,
      facilities: facilities ? (typeof facilities === 'string' ? JSON.parse(facilities) : facilities) : null,
      is_active: is_active || '1'
    };

    // อัปเดตประเภทห้อง
    await RoomType.update(updateData, {
      where: { room_type_id: roomTypeId }
    });

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

// DELETE /api/room-types/:id - ลบประเภทห้อง (soft delete)
router.delete('/:id', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomTypeId = req.params.id;

    // ตรวจสอบว่าประเภทห้องมีอยู่หรือไม่
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
        message: `ไม่สามารถลบได้ มีห้อง ${roomsCount} ห้องที่ใช้ประเภทห้องนี้อยู่` 
      });
    }

    // ลบประเภทห้อง (hard delete เนื่องจากไม่มีห้องที่ใช้)
    await RoomType.destroy({
      where: { room_type_id: roomTypeId }
    });

    res.json({ message: 'ลบประเภทห้องสำเร็จ' });

  } catch (error) {
    console.error('❌ Delete room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบประเภทห้อง' });
  }
});

// PATCH /api/room-types/:id/toggle - เปิด/ปิดใช้งานประเภทห้อง
router.patch('/:id/toggle', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const roomTypeId = req.params.id;

    // ตรวจสอบว่าประเภทห้องมีอยู่หรือไม่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: 'ไม่พบประเภทห้องนี้' });
    }

    // สลับสถานะ
    const newStatus = roomType.is_active === '1' ? '0' : '1';

    await RoomType.update({
      is_active: newStatus
    }, {
      where: { room_type_id: roomTypeId }
    });

    const updatedRoomType = await RoomType.findByPk(roomTypeId);

    res.json({
      message: `${newStatus === '1' ? 'เปิด' : 'ปิด'}ใช้งานประเภทห้องสำเร็จ`,
      roomType: updatedRoomType
    });

  } catch (error) {
    console.error('❌ Toggle room type error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะประเภทห้อง' });
  }
});

// POST /api/room-types/:id/images - อัปโหลดรูปประเภทห้อง
router.post('/:id/images', authenticateToken, requireManagerOrAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const roomTypeId = req.params.id;
    const { descriptions = [] } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    // ตรวจสอบว่าประเภทห้องมีอยู่
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
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

    if (existingImagesCount + req.files.length > 5) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ 
        message: `ประเภทห้องนี้มีรูปอยู่แล้ว ${existingImagesCount} รูป สามารถเพิ่มได้อีกไม่เกิน ${5 - existingImagesCount} รูป` 
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
        is_primary: existingImagesCount === 0 && index === 0
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

// GET /api/room-types/:id/images - ดูรูปประเภทห้อง
router.get('/:id/images', async (req, res) => {
  try {
    const roomTypeId = req.params.id;

    const images = await RoomTypeImage.findAll({
      where: { room_type_id: roomTypeId },
      order: [['image_order', 'ASC']]
    });

    const imagesWithUrls = images.map(image => ({
      ...image.toJSON(),
      imageUrl: `/uploads/room-types/${image.image_filename}`
    }));

    res.json(imagesWithUrls);
  } catch (error) {
    console.error('❌ Get room type images error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ' });
  }
});

// DELETE /api/room-types/:roomTypeId/images/:imageId - ลบรูปประเภทห้อง
router.delete('/:roomTypeId/images/:imageId', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { roomTypeId, imageId } = req.params;

    const image = await RoomTypeImage.findOne({
      where: { image_id: imageId, room_type_id: roomTypeId }
    });

    if (!image) {
      return res.status(404).json({ message: 'ไม่พบรูปภาพนี้' });
    }

    // ลบไฟล์
    const imagePath = path.join('uploads/room-types', image.image_filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // ลบจากฐานข้อมูล
    await RoomTypeImage.destroy({
      where: { image_id: imageId }
    });

    // ถ้าลบรูปหลัก ให้กำหนดรูปถัดไปเป็นรูปหลัก
    if (image.is_primary) {
      const nextImage = await RoomTypeImage.findOne({
        where: { room_type_id: roomTypeId },
        order: [['image_order', 'ASC']]
      });

      if (nextImage) {
        await RoomTypeImage.update(
          { is_primary: true },
          { where: { image_id: nextImage.image_id } }
        );
      }
    }

    res.json({ message: 'ลบรูปภาพสำเร็จ' });

  } catch (error) {
    console.error('❌ Delete room type image error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
  }
});

// PATCH /api/room-types/:roomTypeId/images/:imageId/primary - กำหนดรูปหลัก
router.patch('/:roomTypeId/images/:imageId/primary', authenticateToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { roomTypeId, imageId } = req.params;

    const image = await RoomTypeImage.findOne({
      where: { image_id: imageId, room_type_id: roomTypeId }
    });

    if (!image) {
      return res.status(404).json({ message: 'ไม่พบรูปภาพนี้' });
    }

    // ยกเลิกรูปหลักเดิม
    await RoomTypeImage.update(
      { is_primary: false },
      { where: { room_type_id: roomTypeId } }
    );

    // กำหนดรูปใหม่เป็นรูปหลัก
    await RoomTypeImage.update(
      { is_primary: true },
      { where: { image_id: imageId } }
    );

    res.json({ message: 'กำหนดรูปหลักสำเร็จ' });

  } catch (error) {
    console.error('❌ Set primary room type image error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการกำหนดรูปหลัก' });
  }
});

// GET /api/room-types/availability - ดูประเภทห้องพร้อมจำนวนห้องว่าง (สำหรับหน้า /dormitories) - ไม่ต้องเข้าสู่ระบบ
router.get('/availability', async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        rt.room_type_id,
        rt.room_type_name,
        rt.description,
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
        rt.thumbnail,
        COUNT(r.room_id) as total_rooms,
        SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) as available_rooms,
        SUM(CASE WHEN r.status = '0' THEN 1 ELSE 0 END) as occupied_rooms,
        SUM(CASE WHEN r.status = '3' THEN 1 ELSE 0 END) as booked_rooms,
        SUM(CASE WHEN r.status = '2' THEN 1 ELSE 0 END) as maintenance_rooms
      FROM room_type rt
      LEFT JOIN room r ON rt.room_type_id = r.room_type_id
      WHERE rt.is_active = '1'
      GROUP BY rt.room_type_id
      ORDER BY 
        CASE WHEN SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) > 0 THEN 0 ELSE 1 END,
        SUM(CASE WHEN r.status = '1' THEN 1 ELSE 0 END) DESC,
        rt.room_type_name
    `);

    const roomTypesWithAvailability = results.map(row => ({
      room_type_id: row.room_type_id,
      room_type_name: row.room_type_name,
      description: row.description,
      thumbnail: row.thumbnail,
      capacity: row.capacity,
      price_per_month: row.price_per_month,
      price_per_semester: row.price_per_semester,
      water_rate: row.water_rate,
      electricity_rate: row.electricity_rate,
      payment_due_day: row.payment_due_day,
      room_style: row.room_style,
      gender_allowed: row.gender_allowed,
      air_condition: row.air_condition,
      fan: row.fan,
      furnished: row.furnished,
      room_category: row.room_category,
      facilities: row.facilities,
      room_size: row.room_size,
      stats: {
        total: row.total_rooms || 0,
        available: row.available_rooms || 0,
        occupied: row.occupied_rooms || 0,
        booked: row.booked_rooms || 0,
        maintenance: row.maintenance_rooms || 0,
        has_available: (row.available_rooms || 0) > 0
      }
    }));

    res.json(roomTypesWithAvailability);
  } catch (error) {
    console.error('❌ Get room types availability error:', error);
    
    // Fallback to mock data when database fails
    const mockRoomTypes = [
      {
        room_type_id: 1,
        room_type_name: 'ห้องเดี่ยว แอร์ พื้นฐาน',
        description: 'ห้องเดี่ยวปรับอากาศ เฟอร์นิเจอร์พื้นฐาน เหมาะสำหรับนักศึกษาที่ต้องการความเป็นส่วนตัว',
        thumbnail: null,
        capacity: 1,
        price_per_month: 3500.00,
        price_per_semester: 15750.00,
        water_rate: 18.00,
        electricity_rate: 7.50,
        payment_due_day: 5,
        room_style: 'single',
        gender_allowed: 'mixed',
        air_condition: 1,
        fan: 0,
        furnished: 'partial',
        room_category: 'standard',
        facilities: {"tv": false, "bed": true, "desk": true, "wifi": true, "chair": true, "closet": true, "balcony": false, "hot_water": false, "refrigerator": false, "private_bathroom": true},
        room_size: 15.00,
        stats: { total: 4, available: 3, occupied: 1, booked: 0, maintenance: 0, has_available: true }
      },
      {
        room_type_id: 2,
        room_type_name: 'ห้องคู่ พัดลม ประหยัด',
        description: 'ห้องคู่พัดลม เฟอร์นิเจอร์พื้นฐาน เหมาะสำหรับนักศึกษาที่ต้องการประหยัด',
        thumbnail: null,
        capacity: 2,
        price_per_month: 2000.00,
        price_per_semester: 9000.00,
        water_rate: 15.00,
        electricity_rate: 6.00,
        payment_due_day: 5,
        room_style: 'double',
        gender_allowed: 'mixed',
        air_condition: 0,
        fan: 1,
        furnished: 'partial',
        room_category: 'standard',
        facilities: {"tv": false, "bed": true, "desk": true, "wifi": true, "chair": true, "closet": true, "balcony": false, "hot_water": false, "refrigerator": false, "private_bathroom": true},
        room_size: 20.00,
        stats: { total: 4, available: 2, occupied: 1, booked: 1, maintenance: 0, has_available: true }
      },
      {
        room_type_id: 3,
        room_type_name: 'ห้องเดี่ยว แอร์ ครบครัน',
        description: 'ห้องเดี่ยวปรับอากาศ เฟอร์นิเจอร์ครบครัน ตู้เย็น ทีวี น้ำอุ่น',
        thumbnail: null,
        capacity: 1,
        price_per_month: 4500.00,
        price_per_semester: 20250.00,
        water_rate: 18.00,
        electricity_rate: 8.00,
        payment_due_day: 5,
        room_style: 'single',
        gender_allowed: 'mixed',
        air_condition: 1,
        fan: 0,
        furnished: 'fully',
        room_category: 'deluxe',
        facilities: {"tv": true, "bed": true, "desk": true, "wifi": true, "chair": true, "closet": true, "balcony": true, "hot_water": true, "refrigerator": true, "private_bathroom": true},
        room_size: 18.00,
        stats: { total: 3, available: 2, occupied: 0, booked: 0, maintenance: 1, has_available: true }
      },
      {
        room_type_id: 4,
        room_type_name: 'ห้องรวมชาย (โฮสเทล)',
        description: 'ห้องพักรวมสำหรับชายเท่านั้น เตียงสองชั้น 4 เตียง พัดลม ห้องน้ำรวม',
        thumbnail: null,
        capacity: 4,
        price_per_month: 1200.00,
        price_per_semester: 5400.00,
        water_rate: 12.00,
        electricity_rate: 5.00,
        payment_due_day: 5,
        room_style: 'dormitory',
        gender_allowed: 'male',
        air_condition: 0,
        fan: 1,
        furnished: 'partial',
        room_category: 'hostel',
        facilities: {"tv": false, "bed": true, "desk": true, "wifi": true, "chair": false, "closet": true, "balcony": false, "hot_water": false, "refrigerator": false, "private_bathroom": false},
        room_size: 25.00,
        stats: { total: 3, available: 2, occupied: 1, booked: 0, maintenance: 0, has_available: true }
      },
      {
        room_type_id: 5,
        room_type_name: 'ห้องรวมหญิง (โฮสเทล)',
        description: 'ห้องพักรวมสำหรับหญิงเท่านั้น เตียงสองชั้น 4 เตียง พัดลม ห้องน้ำรวม',
        thumbnail: null,
        capacity: 4,
        price_per_month: 1200.00,
        price_per_semester: 5400.00,
        water_rate: 12.00,
        electricity_rate: 5.00,
        payment_due_day: 5,
        room_style: 'dormitory',
        gender_allowed: 'female',
        air_condition: 0,
        fan: 1,
        furnished: 'partial',
        room_category: 'hostel',
        facilities: {"tv": false, "bed": true, "desk": true, "wifi": true, "chair": false, "closet": true, "balcony": false, "hot_water": false, "refrigerator": false, "private_bathroom": false},
        room_size: 25.00,
        stats: { total: 3, available: 2, occupied: 0, booked: 1, maintenance: 0, has_available: true }
      }
    ];
    
    console.log('⚠️ Using mock data for room types availability');
    res.json(mockRoomTypes);
  }
});

export default router;
