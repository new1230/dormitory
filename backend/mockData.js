// Mock data for testing without database
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
    firstName: 'Admin',
    lastName: 'User',
    studentId: 'ADMIN001',
    phone: '0812345678',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: user123
    firstName: 'Regular',
    lastName: 'User',
    studentId: 'USER001',
    phone: '0898765432',
    role: 'student'
  }
];

const mockDormitories = [
  {
    id: 1,
    name: 'หอพักนักศึกษา A',
    description: 'หอพักนักศึกษาที่สะอาด ปลอดภัย ใกล้มหาวิทยาลัย พร้อมสิ่งอำนวยความสะดวกครบครัน',
    address: {
      street: '123 ถนนมหาวิทยาลัย',
      city: 'กรุงเทพฯ',
      state: 'กรุงเทพฯ',
      zipCode: '10400'
    },
    contactInfo: {
      phone: '02-123-4567',
      email: 'dormitoryA@example.com'
    },
    facilities: ['Wi-Fi', 'เครื่องปรับอากาศ', 'เฟอร์นิเจอร์', 'ที่จอดรถ', 'ร้านอาหาร'],
    roomTypes: [
      {
        name: 'ห้องเดี่ยว',
        price: 3500,
        description: 'ห้องเดี่ยวพร้อมเฟอร์นิเจอร์ครบครัน'
      }
    ],
    images: [],
    rules: ['ห้ามสูบบุหรี่', 'ห้ามเลี้ยงสัตว์', 'ห้ามจัดปาร์ตี้'],
    rating: 4.5,
    totalReviews: 25,
    isActive: true
  },
  {
    id: 2,
    name: 'หอพักนักศึกษา B',
    description: 'หอพักนักศึกษาสไตล์โมเดิร์น เน้นความเป็นส่วนตัวและความปลอดภัย',
    address: {
      street: '456 ถนนการศึกษา',
      city: 'กรุงเทพฯ',
      state: 'กรุงเทพฯ',
      zipCode: '10400'
    },
    contactInfo: {
      phone: '02-456-7890',
      email: 'dormitoryB@example.com'
    },
    facilities: ['Wi-Fi', 'เครื่องปรับอากาศ', 'เฟอร์นิเจอร์', 'ที่จอดรถ', 'ห้องซักรีด', 'ห้องครัว'],
    roomTypes: [
      {
        name: 'ห้องคู่',
        price: 2800,
        description: 'ห้องคู่พร้อมเฟอร์นิเจอร์'
      }
    ],
    images: [],
    rules: ['ห้ามสูบบุหรี่', 'ห้ามเลี้ยงสัตว์'],
    rating: 4.2,
    totalReviews: 18,
    isActive: true
  }
];

module.exports = { mockUsers, mockDormitories }; 