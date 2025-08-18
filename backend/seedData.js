const { User, Dormitory } = require('./models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    // Clear existing data
    await User.destroy({ where: {} });
    await Dormitory.destroy({ where: {} });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      studentId: 'ADMIN001',
      phone: '0812345678',
      role: 'admin'
    });
    console.log('Admin user created');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      studentId: 'USER001',
      phone: '0898765432',
      role: 'student'
    });
    console.log('Regular user created');

    // Create sample dormitories
    const dormitories = [
      {
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
        totalReviews: 25
      },
      {
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
        totalReviews: 18
      }
    ];

    for (const dormitoryData of dormitories) {
      await Dormitory.create(dormitoryData);
    }

    console.log('Sample dormitories created');
    console.log('Database seeded successfully!');
    
    console.log('\nTest credentials:');
    console.log('Admin - Email: admin@example.com, Password: admin123');
    console.log('User - Email: user@example.com, Password: user123');

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Run seed data
seedData(); 