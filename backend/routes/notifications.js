import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// API สำหรับ Navbar Notifications
router.get('/navbar', authenticateToken, async (req, res) => {
  try {
    const { role, mem_id } = req.user;

    if (role === 'Student') {
      // นักเรียน: ตรวจสอบบิลค้างชำระ
      let overdueBillsCount = 0;
      try {
        const [overdueBills] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM monthly_bills mb
          JOIN room r ON mb.room_id = r.room_id
          WHERE r.current_tenant_id = :mem_id 
          AND mb.bill_status IN ('issued', 'overdue')
          AND mb.due_date < NOW()
        `, {
          replacements: { mem_id },
          type: Sequelize.QueryTypes.SELECT
        });
        overdueBillsCount = overdueBills?.count || 0;
      } catch (error) {
        console.log('Monthly bills table might not exist yet');
        // Mock data for student if they have room
        const [studentRoom] = await sequelize.query(`
          SELECT room_id FROM room WHERE current_tenant_id = :mem_id
        `, {
          replacements: { mem_id },
          type: Sequelize.QueryTypes.SELECT
        });
        overdueBillsCount = studentRoom.length > 0 ? 1 : 0; // Mock 1 overdue bill if has room
      }

      return res.json({
        overdueBills: overdueBillsCount
      });

    } else if (role === 'Manager' || role === 'Admin') {
      // Manager/Admin: ตรวจสอบบิลรออนุมัติและค้างชำระ
      let pendingApprovalCount = 0;
      let overdueBillsCount = 0;
      
      try {
        const [pendingApproval] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM monthly_bills
          WHERE bill_status = 'pending_approval'
        `, {
          type: Sequelize.QueryTypes.SELECT
        });
        pendingApprovalCount = pendingApproval?.count || 0;
      } catch (error) {
        console.log('Monthly bills table might not exist yet');
        pendingApprovalCount = 1; // Mock data
      }

      try {
        const [overdueBills] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM monthly_bills
          WHERE bill_status IN ('issued', 'overdue')
          AND due_date < NOW()
        `, {
          type: Sequelize.QueryTypes.SELECT
        });
        overdueBillsCount = overdueBills?.count || 0;
      } catch (error) {
        console.log('Monthly bills table might not exist yet');
        overdueBillsCount = 1; // Mock data
      }

      return res.json({
        pendingApproval: pendingApprovalCount,
        overdueBills: overdueBillsCount
      });
    }

    res.json({});
  } catch (error) {
    console.error('Navbar notifications error:', error);
    
    // Return mock data if all else fails
    if (req.user?.role === 'Student') {
      res.json({ overdueBills: 0 });
    } else if (req.user?.role === 'Manager' || req.user?.role === 'Admin') {
      res.json({ pendingApproval: 1, overdueBills: 1 });
    } else {
      res.json({});
    }
  }
});

export default router;
