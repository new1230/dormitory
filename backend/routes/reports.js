import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// รายงานรายรับรายเดือน
router.get('/monthly-revenue', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // รายรับจากบิลรายเดือน
    const billRevenue = await sequelize.query(`
      SELECT 
        bill_month,
        bill_year,
        COUNT(*) as bill_count,
        SUM(room_rent + water_cost + electricity_cost + other_charges) as bills_total,
        SUM(room_rent) as room_rent_total,
        SUM(water_cost) as water_cost_total,
        SUM(electricity_cost) as electricity_cost_total,
        SUM(other_charges) as other_charges_total
      FROM monthly_bills 
      WHERE bill_status = 'paid'
      ${startDate && endDate ? `AND STR_TO_DATE(CONCAT(bill_year, '-', bill_month, '-01'), '%Y-%m-%d') BETWEEN :startDate AND :endDate` : ''}
      GROUP BY bill_year, bill_month
      ORDER BY bill_year DESC, bill_month DESC
    `, {
      replacements: { startDate, endDate },
      type: Sequelize.QueryTypes.SELECT
    });

    // รายรับจากการจอง
    const bookingRevenue = await sequelize.query(`
      SELECT 
        MONTH(manager_approved_at) as approval_month,
        YEAR(manager_approved_at) as approval_year,
        COUNT(*) as booking_count,
        SUM(deposit_amount) as deposit_total,
        SUM(total_price) as booking_total
      FROM booking
      WHERE deposit_status = 'paid' AND manager_approved_at IS NOT NULL
      ${startDate && endDate ? `AND manager_approved_at BETWEEN :startDate AND :endDate` : ''}
      GROUP BY YEAR(manager_approved_at), MONTH(manager_approved_at)
      ORDER BY approval_year DESC, approval_month DESC
    `, {
      replacements: { startDate, endDate },
      type: Sequelize.QueryTypes.SELECT
    });

    res.json({
      billRevenue,
      bookingRevenue
    });
  } catch (error) {
    console.error('Monthly revenue report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานบิลค้างชำระ
router.get('/overdue-bills', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const overdueBills = await sequelize.query(`
      SELECT 
        mb.bill_id,
        mb.bill_month,
        mb.bill_year,
        r.room_number,
        rt.room_type_name,
        m.mem_name as tenant_name,
        m.mem_tel as tenant_phone,
        m.mem_email as tenant_email,
        mb.room_rent,
        mb.water_cost,
        mb.electricity_cost,
        mb.other_charges,
        mb.room_rent + mb.water_cost + mb.electricity_cost + mb.other_charges as total_amount,
        mb.due_date,
        DATEDIFF(NOW(), mb.due_date) as days_overdue,
        mb.penalty_amount,
        mb.bill_status
      FROM monthly_bills mb
      JOIN room r ON mb.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      JOIN \`member\` m ON mb.member_id = m.mem_id
      WHERE mb.bill_status IN ('issued', 'overdue')
      AND mb.due_date < NOW()
      ORDER BY mb.due_date ASC
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(overdueBills);
  } catch (error) {
    console.error('Overdue bills report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานสถานะห้องพัก
router.get('/room-status', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const roomStatus = await sequelize.query(`
      SELECT 
        r.room_id,
        r.room_number,
        rt.room_type_name,
        rt.price_per_month,
        CASE 
          WHEN r.status = '0' THEN 'มีผู้พัก'
          WHEN r.status = '1' THEN 'ว่าง'
          WHEN r.status = '2' THEN 'ซ่อมแซม'
          WHEN r.status = '3' THEN 'จอง'
          ELSE 'ไม่ระบุ'
        END as room_status,
        m.mem_name as current_tenant,
        m.mem_tel as tenant_phone,
        r.contract_start,
        r.contract_end,
        CASE 
          WHEN r.contract_end IS NOT NULL THEN DATEDIFF(r.contract_end, NOW())
          ELSE NULL
        END as days_until_expire
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN \`member\` m ON r.current_tenant_id = m.mem_id
      ORDER BY r.room_number
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(roomStatus);
  } catch (error) {
    console.error('Room status report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานสมาชิก
router.get('/members', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const members = await sequelize.query(`
      SELECT 
        m.mem_id,
        m.mem_name,
        m.mem_email,
        m.mem_tel,
        m.mem_card_id,
        m.role,
        CASE 
          WHEN m.mem_status = '1' THEN 'ใช้งาน'
          ELSE 'ระงับ'
        END as status,
        r.room_number,
        rt.room_type_name,
        r.contract_start,
        r.contract_end,
        lh.last_login
      FROM \`member\` m
      LEFT JOIN room r ON m.mem_id = r.current_tenant_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN (
        SELECT member_id, MAX(login_time) as last_login
        FROM login_history 
        WHERE login_status = 'success'
        GROUP BY member_id
      ) lh ON m.mem_id = lh.member_id
      ORDER BY m.mem_name
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(members);
  } catch (error) {
    console.error('Members report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานการจอง
router.get('/bookings', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let whereClause = '';
    if (startDate && endDate) {
      whereClause += `AND b.booking_date BETWEEN :startDate AND :endDate `;
    }
    if (status) {
      whereClause += `AND b.booking_status = :status `;
    }

    const bookings = await sequelize.query(`
      SELECT 
        b.booking_id,
        b.booking_date,
        m.mem_name as student_name,
        m.mem_tel as student_phone,
        m.mem_email as student_email,
        r.room_number,
        rt.room_type_name,
        rt.price_per_month,
        b.check_in_date,
        b.check_out_date,
        b.booking_status,
        b.deposit_status,
        b.deposit_amount,
        b.total_price,
        CASE 
          WHEN b.deposit_status = 'paid' THEN b.deposit_amount + b.total_price
          ELSE 0
        END as total_paid,
        b.manager_approved_at,
        approver.mem_name as approved_by
      FROM booking b
      JOIN \`member\` m ON b.member_id = m.mem_id
      JOIN room r ON b.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN \`member\` approver ON b.manager_approved_by = approver.mem_id
      WHERE 1=1 ${whereClause}
      ORDER BY b.booking_date DESC
    `, {
      replacements: { startDate, endDate, status },
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(bookings);
  } catch (error) {
    console.error('Bookings report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานการจดมิเตอร์
router.get('/meter-readings', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = '';
    if (month && year) {
      whereClause = `WHERE mr.reading_month = :month AND mr.reading_year = :year`;
    }

    const meterReadings = await sequelize.query(`
      SELECT 
        mr.reading_id,
        mr.reading_month,
        mr.reading_year,
        r.room_number,
        rt.room_type_name,
        m.mem_name as tenant_name,
        mr.previous_water_reading,
        mr.current_water_reading,
        mr.current_water_reading - mr.previous_water_reading as water_usage,
        mr.previous_electricity_reading,
        mr.current_electricity_reading,
        mr.current_electricity_reading - mr.previous_electricity_reading as electricity_usage,
        mr.other_charges,
        mr.other_charges_reason,
        mr.recorded_date,
        recorder.mem_name as recorded_by_name,
        mr.notes
      FROM meter_readings mr
      JOIN room r ON mr.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN \`member\` m ON r.current_tenant_id = m.mem_id
      JOIN \`member\` recorder ON mr.recorded_by = recorder.mem_id
      ${whereClause}
      ORDER BY mr.reading_year DESC, mr.reading_month DESC, r.room_number
    `, {
      replacements: { month, year },
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(meterReadings);
  } catch (error) {
    console.error('Meter readings report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานประวัติการเข้าสู่ระบบ
router.get('/login-history', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = '';
    if (startDate && endDate) {
      whereClause = `WHERE lh.login_time BETWEEN :startDate AND :endDate`;
    }

    const loginHistory = await sequelize.query(`
      SELECT 
        lh.id,
        lh.login_time,
        m.mem_name,
        m.mem_email,
        m.role,
        lh.ip_address,
        lh.login_status,
        lh.failure_reason,
        lh.user_agent
      FROM login_history lh
      JOIN \`member\` m ON lh.member_id = m.mem_id
      ${whereClause}
      ORDER BY lh.login_time DESC
    `, {
      replacements: { startDate, endDate },
      type: Sequelize.QueryTypes.SELECT
    });

    res.json(loginHistory);
  } catch (error) {
    console.error('Login history report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// รายงานสรุปรายเดือน (สำหรับ Excel)
router.get('/monthly-summary', authenticateToken, authorizeRoles('Manager', 'Admin'), async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    // สรุปรายรับรายเดือน
    const [summary] = await sequelize.query(`
      SELECT 
        :month as report_month,
        :year as report_year,
        COUNT(DISTINCT r.room_id) as total_rooms,
        COUNT(DISTINCT CASE WHEN r.current_tenant_id IS NOT NULL THEN r.room_id END) as occupied_rooms,
        COUNT(DISTINCT mb.bill_id) as total_bills,
        SUM(CASE WHEN mb.bill_status = 'paid' THEN mb.room_rent + mb.water_cost + mb.electricity_cost + mb.other_charges ELSE 0 END) as bill_revenue,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        SUM(CASE WHEN b.deposit_status = 'paid' AND MONTH(b.manager_approved_at) = :month AND YEAR(b.manager_approved_at) = :year THEN b.deposit_amount + b.total_price ELSE 0 END) as booking_revenue
      FROM room r
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN monthly_bills mb ON r.room_id = mb.room_id AND mb.bill_month = :month AND mb.bill_year = :year
      LEFT JOIN booking b ON r.room_id = b.room_id
    `, {
      replacements: { month: parseInt(month), year: parseInt(year) },
      type: Sequelize.QueryTypes.SELECT
    });

    const totalRevenue = parseFloat(summary.bill_revenue || 0) + parseFloat(summary.booking_revenue || 0);

    res.json({
      ...summary,
      total_revenue: totalRevenue,
      occupancy_rate: summary.total_rooms > 0 ? ((summary.occupied_rooms / summary.total_rooms) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Monthly summary report error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

export default router;
