import sequelize from '../config/database.js';

async function createSampleData() {
  try {
    console.log('🔄 Creating sample data...');
    
    // เพิ่มข้อมูลผู้เช่าตัวอย่าง (ถ้ายังไม่มี)
    await sequelize.query(`
      UPDATE room SET current_tenant_id = 1 WHERE room_id = 1;
      UPDATE room SET current_tenant_id = 2 WHERE room_id = 2;  
      UPDATE room SET current_tenant_id = 3 WHERE room_id = 3;
      UPDATE room SET status = '0' WHERE room_id IN (1, 2, 3);
    `);
    
    console.log('✅ Sample room tenants updated');
    
    // เพิ่มข้อมูลการจดมิเตอร์เดือนก่อน (กรกฎาคม 2025)
    await sequelize.query(`
      INSERT IGNORE INTO meter_readings 
      (room_id, reading_month, reading_year, previous_water_reading, current_water_reading, 
       previous_electricity_reading, current_electricity_reading, recorded_by, other_charges, notes)
      VALUES 
      (1, 7, 2025, 0, 100, 0, 200, 1, 0, 'เริ่มต้น'),
      (2, 7, 2025, 0, 80, 0, 150, 1, 0, 'เริ่มต้น'),
      (3, 7, 2025, 0, 120, 0, 250, 1, 0, 'เริ่มต้น');
    `);
    
    console.log('✅ Sample meter readings created for July 2025');
    console.log('🎉 Sample data created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSampleData();
