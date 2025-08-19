import rateLimit from 'express-rate-limit';

// Rate limit for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'คุณได้ทำการเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณารอ 15 นาทีก่อนลองใหม่'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for general API
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down repeated requests
export const speedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Start slowing down after 100 requests
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // 500ms delay for each request after delayAfter
  skipSuccessfulRequests: true,
});
