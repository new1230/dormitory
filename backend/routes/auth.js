import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login with rate limiting
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔍 Login attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    // Get client info
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    const deviceInfo = {
      browser: req.get('User-Agent'),
      platform: req.get('Platform') || 'Unknown',
      timestamp: new Date()
    };

    let user = null;
    let loginStatus = 'failed';
    let failureReason = null;

    try {
      // Find user in database
      user = await User.findOne({ where: { mem_email: email, mem_status: '1' } });
      if (!user) {
        // Don't log failed attempts for unknown users (to avoid foreign key issues)
        console.log(`❌ Login failed: Email not found - ${email} from ${clientIP}`);
        return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      // Auto-detect role from database (no need to check role parameter)

      // Check password (using User's comparePassword method)
      console.log('🔐 Checking password...');
      const isMatch = await user.comparePassword(password);
      console.log('🔐 Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ Password mismatch - logging failed attempt');
        failureReason = 'Invalid password';
        await LoginHistory.create({
          member_id: user.mem_id,
          login_time: new Date(),
          ip_address: clientIP,
          user_agent: userAgent,
          device_info: deviceInfo,
          login_status: 'failed',
          failure_reason: 'Wrong password'
        });
        return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      // Login successful - record it
      console.log('✅ Password correct - logging success');
      loginStatus = 'success';
      await LoginHistory.create({
        member_id: user.mem_id,
        login_time: new Date(),
        ip_address: clientIP,
        user_agent: userAgent,
        device_info: deviceInfo,
        login_status: 'success',
        failure_reason: null
      });
      console.log('✅ Success login_history recorded');

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }

    // Create token with different expiry based on rememberMe
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set! Using fallback secret.');
    }
    
    const token = jwt.sign(
      { 
        userId: user.mem_id,
        role: user.role,
        email: user.mem_email
      },
      jwtSecret,
      { expiresIn: tokenExpiry }
    );

    // Log login attempt
    console.log(`✅ Login successful: ${user.mem_email} (${user.role}) from ${clientIP} - Remember: ${rememberMe}`);
    console.log(`🕒 Token expires in: ${tokenExpiry}`);
    console.log(`🎯 JWT Token created for user ${user.mem_id}`);

    res.json({
      token,
      user: {
        id: user.mem_id,
        name: user.mem_name,
        email: user.mem_email,
        phone: user.mem_tel,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new student
router.post('/register', [
  body('mem_name').notEmpty().withMessage('ชื่อ-นามสกุลจำเป็น').isLength({ max: 30 }).withMessage('ชื่อ-นามสกุลยาวเกินไป'),
  body('mem_email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง').isLength({ max: 50 }).withMessage('อีเมลยาวเกินไป'),
  body('mem_password').isLength({ min: 6, max: 30 }).withMessage('รหัสผ่านต้องมี 6-30 ตัวอักษร'),
  body('mem_card_id').isLength({ min: 13, max: 13 }).withMessage('เลขบัตรประชาชนต้องมี 13 หลัก').isNumeric().withMessage('เลขบัตรประชาชนต้องเป็นตัวเลข'),
  body('mem_addr').notEmpty().withMessage('ที่อยู่จำเป็น').isLength({ max: 255 }).withMessage('ที่อยู่ยาวเกินไป'),
  body('mem_tel').notEmpty().withMessage('เบอร์โทรศัพท์จำเป็น').isLength({ max: 20 }).withMessage('เบอร์โทรศัพท์ยาวเกินไป'),
  body('role').optional().isIn(['Student', 'Manager', 'Admin']).withMessage('บทบาทไม่ถูกต้อง')
], async (req, res) => {
  try {
    console.log('🎯 Registration attempt:', {
      email: req.body.mem_email,
      name: req.body.mem_name,
      role: req.body.role || 'Student'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array() 
      });
    }

    const { 
      mem_name, 
      mem_email, 
      mem_password, 
      mem_card_id, 
      mem_addr, 
      mem_tel, 
      role = 'Student' 
    } = req.body;

    // ตรวจสอบอีเมลซ้ำ
    const existingUserByEmail = await User.findOne({ where: { mem_email } });
    if (existingUserByEmail) {
      console.log(`❌ Email already exists: ${mem_email}`);
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
    }

    // ตรวจสอบเลขบัตรประชาชนซ้ำ
    const existingUserByCardId = await User.findOne({ where: { mem_card_id } });
    if (existingUserByCardId) {
      console.log(`❌ Card ID already exists: ${mem_card_id}`);
      return res.status(400).json({ message: 'เลขบัตรประชาชนนี้ถูกใช้แล้ว' });
    }

    // สร้างผู้ใช้ใหม่
    const newUser = await User.create({
      mem_name,
      mem_email,
      mem_password, // จะถูก hash อัตโนมัติใน beforeCreate hook
      mem_card_id,
      mem_addr,
      mem_tel,
      mem_status: '1', // เปิดใช้งาน
      role: role // ใช้ role ที่ส่งมา หรือ 'Student' เป็นค่าเริ่มต้น
    });

    console.log('✅ User registered successfully:', {
      id: newUser.mem_id,
      email: newUser.mem_email,
      name: newUser.mem_name,
      role: newUser.role
    });

    // ส่งข้อมูลกลับ (ไม่รวมรหัสผ่าน และไม่มี token เพื่อไม่ให้ auto login)
    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ',
      user: {
        id: newUser.mem_id,
        name: newUser.mem_name,
        email: newUser.mem_email,
        role: newUser.role,
        phone: newUser.mem_tel
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // ตรวจสอบ Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ 
        message: 'ข้อมูลไม่ถูกต้อง', 
        errors: messages 
      });
    }
    
    // ตรวจสอบ Unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      if (field === 'mem_email') {
        return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
      } else if (field === 'mem_card_id') {
        return res.status(400).json({ message: 'เลขบัตรประชาชนนี้ถูกใช้แล้ว' });
      }
    }
    
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Verify identity for password reset
router.post('/verify-identity', [
  body('mem_email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('mem_card_id').isLength({ min: 13, max: 13 }).withMessage('เลขบัตรประชาชนต้องมี 13 หลัก').isNumeric().withMessage('เลขบัตรประชาชนต้องเป็นตัวเลข')
], async (req, res) => {
  try {
    console.log('🔍 Verify identity attempt:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array() 
      });
    }

    const { mem_email, mem_card_id } = req.body;

    // ค้นหาผู้ใช้ด้วยอีเมลและเลขบัตรประชาชน
    const user = await User.findOne({ 
      where: { 
        mem_email, 
        mem_card_id,
        mem_status: '1' 
      } 
    });

    if (!user) {
      console.log(`❌ Identity verification failed: ${mem_email} - ${mem_card_id}`);
      return res.status(400).json({ message: 'ไม่พบข้อมูลผู้ใช้ กรุณาตรวจสอบอีเมลและเลขบัตรประชาชน' });
    }

    console.log('✅ Identity verified:', user.mem_email);

    res.json({
      message: 'ตรวจสอบตัวตนสำเร็จ',
      user: {
        id: user.mem_id,
        name: user.mem_name,
        email: user.mem_email
      }
    });

  } catch (error) {
    console.error('❌ Verify identity error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Reset password
router.post('/reset-password', [
  body('mem_email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('mem_card_id').isLength({ min: 13, max: 13 }).withMessage('เลขบัตรประชาชนต้องมี 13 หลัก').isNumeric().withMessage('เลขบัตรประชาชนต้องเป็นตัวเลข'),
  body('new_password').isLength({ min: 6, max: 30 }).withMessage('รหัสผ่านต้องมี 6-30 ตัวอักษร')
], async (req, res) => {
  try {
    console.log('🔐 Reset password attempt:', {
      email: req.body.mem_email,
      cardId: req.body.mem_card_id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array() 
      });
    }

    const { mem_email, mem_card_id, new_password } = req.body;

    // ค้นหาผู้ใช้ด้วยอีเมลและเลขบัตรประชาชนอีกครั้ง
    const user = await User.findOne({ 
      where: { 
        mem_email, 
        mem_card_id,
        mem_status: '1' 
      } 
    });

    if (!user) {
      console.log(`❌ User not found for password reset: ${mem_email}`);
      return res.status(400).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // อัปเดตรหัสผ่าน (จะถูก hash อัตโนมัติใน beforeUpdate hook)
    await user.update({ mem_password: new_password });

    console.log('✅ Password reset successful:', user.mem_email);

    res.json({
      message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

// Get current user (requires auth middleware)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // ดึงข้อมูลผู้ใช้ครบถ้วนจาก database
    const user = await User.findByPk(req.user.mem_id, {
      attributes: { exclude: ['mem_password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    console.log('✅ /me endpoint - User data:', user.toJSON());
    
    res.json(user.toJSON());
  } catch (error) {
    console.error('❌ /me endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 