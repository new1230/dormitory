import User from './models/User.js';
import sequelize from './config/database.js';

async function createAdmin() {
  try {
    await sequelize.sync();
    
    // ลบ admin เก่า (ถ้ามี)
    await User.destroy({ where: { mem_email: 'admin@dormitory.com' } });
    
    // สร้าง admin ใหม่
    const admin = await User.create({
      mem_name: 'ผู้ดูแลระบบ',
      mem_password: 'admin123', // รหัสผ่านจะถูก hash อัตโนมัติ
      mem_email: 'admin@dormitory.com',
      mem_card_id: '1234567890123',
      mem_addr: 'หอพักนักศึกษา',
      mem_tel: '0123456789',
      mem_status: '1',
      role: 'Admin'
    });
    
    console.log('✅ สร้าง admin สำเร็จ:', admin.mem_email);
    console.log('🔑 รหัสผ่าน: admin123');
    console.log('🔒 Password ถูก hash แล้ว');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
