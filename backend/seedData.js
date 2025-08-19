import User from './models/User.js';
import sequelize from './config/database.js';

const seedData = async () => {
  try {
    // Sync database (without dropping existing tables)
    await sequelize.sync({ alter: true });
    console.log('🗄️ Database synced successfully!');

    // Check if data already exists
    const existingUsers = await User.findAll();
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist in database. Deleting existing users...');
      await User.destroy({ where: {} });
    }

    // Create admin user
    const adminUser = await User.create({
      mem_password: 'admin123',
      mem_name: 'Admin User',
      mem_card_id: '1234567890123',
      mem_addr: '123 ถนนมหาวิทยาลัย กรุงเทพฯ 10400',
      mem_email: 'admin@dormitory.com',
      mem_tel: '0812345678',
      mem_img: null,
      mem_status: '1',
      role: 'Admin'
    });
    console.log('Admin user created:', adminUser.mem_name);

    // Create manager user
    const managerUser = await User.create({
      mem_password: 'manager123',
      mem_name: 'Manager User',
      mem_card_id: '1234567890124',
      mem_addr: '456 ถนนการจัดการ กรุงเทพฯ 10400',
      mem_email: 'manager@dormitory.com',
      mem_tel: '0823456789',
      mem_img: null,
      mem_status: '1',
      role: 'Manager'
    });
    console.log('Manager user created:', managerUser.mem_name);

    // Create student user
    const studentUser = await User.create({
      mem_password: 'student123',
      mem_name: 'Student User',
      mem_card_id: '1234567890125',
      mem_addr: '789 ถนนนักศึกษา กรุงเทพฯ 10400',
      mem_email: 'student@dormitory.com',
      mem_tel: '0834567890',
      mem_img: null,
      mem_status: '1',
      role: 'Student'
    });
    console.log('Student user created:', studentUser.mem_name);

    console.log('🎯 Seed data completed successfully!');
    console.log('Admin Login: admin@dormitory.com / admin123');
    console.log('Manager Login: manager@dormitory.com / manager123');  
    console.log('Student Login: student@dormitory.com / student123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Run seed data
seedData(); 