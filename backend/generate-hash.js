import bcrypt from 'bcryptjs';

async function generateAllHashes() {
  const users = [
    { role: 'Admin', email: 'admin@dormitory.com', password: 'admin123' },
    { role: 'Manager', email: 'manager@dormitory.com', password: 'manager123' },
    { role: 'Student', email: 'student@dormitory.com', password: 'student123' }
  ];
  
  console.log('--- การสร้าง Hash สำหรับผู้ใช้ทั้งหมด ---\n');
  
  const hashes = {};
  
  for (const user of users) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    hashes[user.role] = hash;
    
    console.log(`${user.role}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Hash: ${hash}\n`);
  }
  
  // SQL Commands
  console.log('\n--- SQL Commands สำหรับแก้ไขฐานข้อมูล ---\n');
  
  // แก้ไข column ให้รองรับ hash ที่ยาวขึ้น
  console.log('-- 1. แก้ไข column ให้รองรับ bcrypt hash');
  console.log('ALTER TABLE `member` MODIFY `mem_password` VARCHAR(255);\n');
  
  // อัปเดต password ทั้งหมด
  console.log('-- 2. อัปเดต password สำหรับผู้ใช้ทั้งหมด');
  console.log(`UPDATE \`member\` SET \`mem_password\` = '${hashes.Admin}' WHERE \`mem_email\` = 'admin@dormitory.com';`);
  console.log(`UPDATE \`member\` SET \`mem_password\` = '${hashes.Manager}' WHERE \`mem_email\` = 'manager@dormitory.com';`);
  console.log(`UPDATE \`member\` SET \`mem_password\` = '${hashes.Student}' WHERE \`mem_email\` = 'student@dormitory.com';\n`);
  
  console.log('--- ข้อมูล Login ---');
  console.log('Admin    - Email: admin@dormitory.com    | Password: admin123');
  console.log('Manager  - Email: manager@dormitory.com  | Password: manager123');
  console.log('Student  - Email: student@dormitory.com  | Password: student123');
}

generateAllHashes();
