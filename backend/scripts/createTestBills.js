import sequelize from '../config/database.js';

async function createTestBills() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // ลบบิลทดสอบเก่า
    await sequelize.query('DELETE FROM monthly_bills WHERE member_id = 3');
    
    // สร้างบิลทดสอบ 3 บิล สำหรับ member_id = 3 (นักศึกษา)
    const testBills = [
      {
        room_id: 18,
        member_id: 3,
        bill_month: 12,
        bill_year: 2024,
        room_rent: 3000.00,
        water_cost: 150.00,
        electricity_cost: 200.00,
        other_charges: 50.00,
        other_charges_reason: 'ค่าซ่อมแซม',
        penalty_amount: 0.00,
        penalty_days: 0,
        due_date: '2024-12-05',
        bill_status: 'issued',
        issued_date: '2024-12-01 00:00:00',
        created_by: 1
      },
      {
        room_id: 18,
        member_id: 3,
        bill_month: 1,
        bill_year: 2025,
        room_rent: 3000.00,
        water_cost: 180.00,
        electricity_cost: 250.00,
        other_charges: 0.00,
        penalty_amount: 30.00,
        penalty_days: 3,
        due_date: '2025-01-05',
        bill_status: 'overdue',
        issued_date: '2025-01-01 00:00:00',
        created_by: 1
      },
      {
        room_id: 18,
        member_id: 3,
        bill_month: 2,
        bill_year: 2025,
        room_rent: 3000.00,
        water_cost: 140.00,
        electricity_cost: 220.00,
        other_charges: 0.00,
        penalty_amount: 0.00,
        penalty_days: 0,
        due_date: '2025-02-05',
        bill_status: 'pending_approval',
        issued_date: '2025-02-01 00:00:00',
        payment_slip_url: 'slip-test123.jpg',
        payment_slip_uploaded_at: '2025-02-03 10:00:00',
        created_by: 1
      },
      {
        room_id: 18,
        member_id: 3,
        bill_month: 11,
        bill_year: 2024,
        room_rent: 3000.00,
        water_cost: 120.00,
        electricity_cost: 180.00,
        other_charges: 0.00,
        penalty_amount: 0.00,
        penalty_days: 0,
        due_date: '2024-11-05',
        bill_status: 'paid',
        issued_date: '2024-11-01 00:00:00',
        paid_date: '2024-11-03 14:30:00',
        created_by: 1
      }
    ];

    for (const bill of testBills) {
      const columns = Object.keys(bill).join(', ');
      const values = Object.keys(bill).map(key => `:${key}`).join(', ');
      
      await sequelize.query(`
        INSERT INTO monthly_bills (${columns}, created_date) 
        VALUES (${values}, NOW())
      `, {
        replacements: bill
      });
    }

    console.log('✅ Created 4 test bills for member_id = 3');
    
    // ตรวจสอบผลลัพธ์
    const [results] = await sequelize.query(`
      SELECT bill_id, room_id, member_id, bill_month, bill_year, 
             bill_status, room_rent, water_cost, electricity_cost, 
             penalty_amount, due_date
      FROM monthly_bills 
      WHERE member_id = 3 
      ORDER BY bill_year DESC, bill_month DESC
    `);
    
    console.log('📋 Created bills:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createTestBills();
