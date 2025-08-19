import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret);
    
    // ดึงข้อมูลผู้ใช้จาก database
    const user = await User.findByPk(decoded.userId);
    if (!user || user.mem_status !== '1') {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // เพิ่มข้อมูลผู้ใช้ลงใน request object
    req.user = {
      mem_id: user.mem_id,
      id: user.mem_id,
      name: user.mem_name,
      email: user.mem_email,
      phone: user.mem_tel,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
