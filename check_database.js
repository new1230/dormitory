const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dorm'
  });

  try {
    console.log('🔗 เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    // ตรวจสอบโครงสร้างตารางปัจจุบัน
    const [columns] = await connection.execute('DESCRIBE booking');
    console.log('📋 โครงสร้างตาราง booking ปัจจุบัน:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // ตรวจสอบว่ามีคอลัมน์ที่จำเป็นหรือไม่
    const requiredColumns = [
      'contract_accepted', 'contract_accepted_at', 'payment_slip_url', 
      'payment_slip_uploaded_at', 'payment_deadline', 'manager_approved_at', 
      'manager_approved_by', 'total_price', 'createdAt', 'updatedAt'
    ];
    const existingColumns = columns.map(col => col.Field);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ ขาดคอลัมน์:', missingColumns);
      console.log('🔧 เริ่มการเพิ่มคอลัมน์...');
      
      // เพิ่มคอลัมน์ทีละตัว
      const alterStatements = [
        "ALTER TABLE `booking` ADD COLUMN `contract_accepted` TINYINT(1) DEFAULT 0",
        "ALTER TABLE `booking` ADD COLUMN `contract_accepted_at` DATETIME NULL",
        "ALTER TABLE `booking` ADD COLUMN `payment_slip_url` VARCHAR(255) NULL",
        "ALTER TABLE `booking` ADD COLUMN `payment_slip_uploaded_at` DATETIME NULL",
        "ALTER TABLE `booking` ADD COLUMN `payment_deadline` DATETIME NULL",
        "ALTER TABLE `booking` ADD COLUMN `manager_approved_at` DATETIME NULL",
        "ALTER TABLE `booking` ADD COLUMN `manager_approved_by` INT(11) NULL",
        "ALTER TABLE `booking` ADD COLUMN `total_price` DECIMAL(10,2) NULL",
        "ALTER TABLE `booking` ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE `booking` ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ];
      
      for (const statement of alterStatements) {
        try {
          await connection.execute(statement);
          console.log('✅ เพิ่มคอลัมน์สำเร็จ');
        } catch (err) {
          if (err.message.includes('Duplicate column')) {
            console.log('⚠️ คอลัมน์มีอยู่แล้ว');
          } else {
            console.error('❌ ข้อผิดพลาด:', err.message);
          }
        }
      }
      
      // เพิ่ม Foreign Key
      try {
        await connection.execute(`
          ALTER TABLE \`booking\` 
          ADD CONSTRAINT \`fk_booking_manager\` 
          FOREIGN KEY (\`manager_approved_by\`) 
          REFERENCES \`member\` (\`mem_id\`) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
        `);
        console.log('✅ เพิ่ม Foreign Key สำเร็จ');
      } catch (err) {
        if (!err.message.includes('Duplicate')) {
          console.error('❌ ข้อผิดพลาด Foreign Key:', err.message);
        }
      }
      
      // อัปเดตข้อมูลเก่า
      await connection.execute(`
        UPDATE \`booking\` 
        SET 
          \`createdAt\` = \`booking_date\`,
          \`updatedAt\` = \`booking_date\`
        WHERE \`createdAt\` IS NULL OR \`updatedAt\` IS NULL
      `);
      
      console.log('🎉 Migration เสร็จสมบูรณ์!');
    } else {
      console.log('✅ โครงสร้างตารางครบถ้วนแล้ว');
    }
    
    // แสดงโครงสร้างใหม่
    const [newColumns] = await connection.execute('DESCRIBE booking');
    console.log('📋 โครงสร้างตารางหลัง migration:');
    newColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('🔌 ปิดการเชื่อมต่อฐานข้อมูล');
  }
}

runMigration();
