import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Debug middleware (ปิดไว้ในโหมดพัฒนา)
// router.use((req, res, next) => {
//   console.log(`🔗 Profile route: ${req.method} ${req.path}`);
//   next();
// });

// กำหนดที่เก็บไฟล์สำหรับรูปโปรไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    // สร้างโฟลเดอร์ถ้าไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `profile-${req.user.mem_id}-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
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

// บันทึก Audit Log
const logUserActivity = async (userId, action, details = {}) => {
  try {
    const userAgent = details.userAgent || 'Unknown';
    const ipAddress = details.ipAddress || 'Unknown';
    
    await LoginHistory.create({
      member_id: userId,
      login_time: new Date(),
      user_agent: `${action}: ${userAgent}`,
      ip_address: ipAddress,
      login_status: 'success'
    });
    
    console.log(`📝 Audit Log - User ${userId}: ${action}`);
  } catch (error) {
    console.error('❌ Failed to log user activity:', error);
  }
};

// Removed duplicate /me endpoint - using /api/auth/me instead

// PUT /api/profile/update - อัปเดตข้อมูลโปรไฟล์
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { mem_name, mem_tel, mem_addr } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!mem_name || !mem_tel || !mem_addr) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบเบอร์โทรศัพท์
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mem_tel)) {
      return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' });
    }

    // อัปเดตข้อมูล
    await User.update({
      mem_name,
      mem_tel,
      mem_addr
    }, {
      where: { mem_id: req.user.mem_id }
    });

    // บันทึก audit log
    await logUserActivity(req.user.mem_id, 'UPDATE_PROFILE', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      changes: { mem_name, mem_tel, mem_addr }
    });

    res.json({ message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

// PUT /api/profile/change-password - เปลี่ยนรหัสผ่าน
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    // ดึงข้อมูลผู้ใช้
    const user = await User.findByPk(req.user.mem_id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.mem_password);
    if (!isCurrentPasswordValid) {
      await logUserActivity(req.user.mem_id, 'CHANGE_PASSWORD_FAILED', {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        reason: 'Invalid current password'
      });
      
      return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // อัปเดตรหัสผ่าน
    await User.update({
      mem_password: hashedNewPassword
    }, {
      where: { mem_id: req.user.mem_id }
    });

    // บันทึก audit log
    await logUserActivity(req.user.mem_id, 'CHANGE_PASSWORD_SUCCESS', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

// POST /api/profile/upload-image - อัปโหลดรูปโปรไฟล์
router.post('/upload-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    // ดึงข้อมูลผู้ใช้เดิม
    const user = await User.findByPk(req.user.mem_id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // ลบรูปเดิมถ้ามี
    if (user.mem_img) {
      const oldImagePath = path.join('uploads/profiles', user.mem_img);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old profile image:', oldImagePath);
      }
    }

    // อัปเดตชื่อไฟล์รูปใหม่ในฐานข้อมูล
    const fileName = req.file.filename;
    await User.update({
      mem_img: fileName
    }, {
      where: { mem_id: req.user.mem_id }
    });

    // บันทึก audit log
    await logUserActivity(req.user.mem_id, 'UPLOAD_PROFILE_IMAGE', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      fileName: fileName
    });

    res.json({ 
      message: 'อัปโหลดรูปภาพสำเร็จ',
      fileName: fileName,
      imageUrl: `/uploads/profiles/${fileName}`
    });
  } catch (error) {
    console.error('❌ Upload image error:', error);
    
    // ลบไฟล์ที่อัปโหลดแล้วถ้าเกิดข้อผิดพลาด
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.message === 'รองรับเฉพาะไฟล์ JPG, PNG, GIF') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
});

// DELETE /api/profile/delete-image - ลบรูปโปรไฟล์
router.delete('/delete-image', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.mem_id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    if (!user.mem_img) {
      return res.status(400).json({ message: 'ไม่มีรูปโปรไฟล์ให้ลบ' });
    }

    // ลบไฟล์รูป
    const imagePath = path.join('uploads/profiles', user.mem_img);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted profile image:', imagePath);
    }

    // อัปเดตฐานข้อมูล
    await User.update({
      mem_img: null
    }, {
      where: { mem_id: req.user.mem_id }
    });

    // บันทึก audit log
    await logUserActivity(req.user.mem_id, 'DELETE_PROFILE_IMAGE', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.json({ message: 'ลบรูปโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('❌ Delete image error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
  }
});

// GET /api/profile/activity-log - ดูประวัติการใช้งาน (เฉพาะของตนเอง)
router.get('/activity-log', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: activities } = await LoginHistory.findAndCountAll({
      where: { member_id: req.user.mem_id },
      order: [['login_time', 'DESC']],
      limit,
      offset
    });

    res.json({
      activities,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    });
  } catch (error) {
    console.error('❌ Get activity log error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งาน' });
  }
});

export default router;
