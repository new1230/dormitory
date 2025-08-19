import sequelize from '../config/database.js';

async function createTables() {
  try {
    console.log('🔄 Creating meter reading tables...');
    
    // สร้าง meter_readings table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`meter_readings\` (
        \`reading_id\` int(11) NOT NULL AUTO_INCREMENT,
        \`room_id\` int(11) NOT NULL,
        \`reading_month\` int(2) NOT NULL COMMENT 'เดือนที่จด (1-12)',
        \`reading_year\` int(4) NOT NULL COMMENT 'ปีที่จด',
        \`previous_water_reading\` decimal(10,2) DEFAULT 0.00 COMMENT 'เลขมิเตอร์น้ำเดือนที่แล้ว',
        \`current_water_reading\` decimal(10,2) NOT NULL COMMENT 'เลขมิเตอร์น้ำเดือนนี้',
        \`previous_electricity_reading\` decimal(10,2) DEFAULT 0.00 COMMENT 'เลขมิเตอร์ไฟเดือนที่แล้ว',
        \`current_electricity_reading\` decimal(10,2) NOT NULL COMMENT 'เลขมิเตอร์ไฟเดือนนี้',
        \`other_charges\` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าใช้จ่ายอื่นๆ',
        \`other_charges_reason\` text COMMENT 'เหตุผลค่าใช้จ่ายอื่นๆ',
        \`meter_photo_water\` varchar(255) DEFAULT NULL COMMENT 'รูปภาพมิเตอร์น้ำ',
        \`meter_photo_electricity\` varchar(255) DEFAULT NULL COMMENT 'รูปภาพมิเตอร์ไฟ',
        \`recorded_by\` int(11) NOT NULL COMMENT 'ผู้จดมิเตอร์ (mem_id)',
        \`recorded_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`notes\` text COMMENT 'หมายเหตุเพิ่มเติม',
        \`is_billed\` tinyint(1) DEFAULT 0 COMMENT 'สร้างบิลแล้วหรือยัง',
        PRIMARY KEY (\`reading_id\`),
        UNIQUE KEY \`unique_room_month_year\` (\`room_id\`, \`reading_month\`, \`reading_year\`),
        KEY \`idx_room_id\` (\`room_id\`),
        KEY \`idx_month_year\` (\`reading_month\`, \`reading_year\`),
        KEY \`idx_recorded_by\` (\`recorded_by\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='การจดมิเตอร์น้ำและไฟรายเดือน';
    `);
    
    console.log('✅ meter_readings table created');
    
    // สร้าง monthly_bills table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`monthly_bills\` (
        \`bill_id\` int(11) NOT NULL AUTO_INCREMENT,
        \`room_id\` int(11) NOT NULL,
        \`member_id\` int(11) NOT NULL COMMENT 'ผู้เช่า',
        \`bill_month\` int(2) NOT NULL COMMENT 'เดือนของบิล (1-12)',
        \`bill_year\` int(4) NOT NULL COMMENT 'ปีของบิล',
        \`reading_id\` int(11) DEFAULT NULL COMMENT 'อ้างอิงข้อมูลมิเตอร์',
        \`room_rent\` decimal(10,2) NOT NULL COMMENT 'ค่าเช่าห้อง',
        \`water_cost\` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าน้ำ',
        \`electricity_cost\` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าไฟ',
        \`other_charges\` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าใช้จ่ายอื่นๆ',
        \`other_charges_reason\` text COMMENT 'เหตุผลค่าใช้จ่ายอื่นๆ',
        \`penalty_amount\` decimal(10,2) DEFAULT 0.00 COMMENT 'ค่าปรับชำระล่าช้า',
        \`penalty_days\` int(3) DEFAULT 0 COMMENT 'จำนวนวันที่เลยกำหนด',
        \`due_date\` date NOT NULL COMMENT 'วันครบกำหนดชำระ',
        \`bill_status\` enum('draft','issued','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
        \`issued_date\` datetime DEFAULT NULL COMMENT 'วันที่ออกบิล',
        \`paid_date\` datetime DEFAULT NULL COMMENT 'วันที่ชำระ',
        \`created_by\` int(11) NOT NULL COMMENT 'ผู้สร้างบิล (mem_id)',
        \`created_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_date\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`bill_id\`),
        UNIQUE KEY \`unique_room_bill_month_year\` (\`room_id\`, \`bill_month\`, \`bill_year\`),
        KEY \`idx_room_id\` (\`room_id\`),
        KEY \`idx_member_id\` (\`member_id\`),
        KEY \`idx_bill_month_year\` (\`bill_month\`, \`bill_year\`),
        KEY \`idx_bill_status\` (\`bill_status\`),
        KEY \`idx_due_date\` (\`due_date\`),
        KEY \`idx_reading_id\` (\`reading_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='บิลค่าใช้จ่ายรายเดือน';
    `);
    
    console.log('✅ monthly_bills table created');
    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createTables();
