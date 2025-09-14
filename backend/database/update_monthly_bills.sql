-- SQL สำหรับอัปเดตตาราง monthly_bills เพิ่มฟีเจอร์การชำระเงิน

-- เพิ่ม pending_approval ใน enum bill_status
ALTER TABLE `monthly_bills` 
MODIFY COLUMN `bill_status` enum('draft','issued','pending_approval','paid','overdue','cancelled') NOT NULL DEFAULT 'draft';

-- เพิ่ม columns สำหรับระบบชำระเงิน
ALTER TABLE `monthly_bills` 
ADD COLUMN `payment_slip_url` varchar(255) DEFAULT NULL COMMENT 'ไฟล์สลิปการชำระ' AFTER `paid_date`,
ADD COLUMN `payment_slip_uploaded_at` datetime DEFAULT NULL COMMENT 'วันที่อัปโหลดสลิป' AFTER `payment_slip_url`,
ADD COLUMN `approved_by` int(11) DEFAULT NULL COMMENT 'ผู้อนุมัติ (mem_id)' AFTER `payment_slip_uploaded_at`,
ADD COLUMN `rejected_by` int(11) DEFAULT NULL COMMENT 'ผู้ปฏิเสธ (mem_id)' AFTER `approved_by`,
ADD COLUMN `rejected_at` datetime DEFAULT NULL COMMENT 'วันที่ปฏิเสธ' AFTER `rejected_by`,
ADD COLUMN `rejection_reason` text DEFAULT NULL COMMENT 'เหตุผลการปฏิเสธ' AFTER `rejected_at`;

-- เพิ่ม foreign key constraints สำหรับผู้อนุมัติและผู้ปฏิเสธ
ALTER TABLE `monthly_bills`
ADD CONSTRAINT `fk_monthly_bills_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `member` (`mem_id`),
ADD CONSTRAINT `fk_monthly_bills_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `member` (`mem_id`);

-- เพิ่ม index สำหรับการค้นหา
ALTER TABLE `monthly_bills`
ADD INDEX `idx_payment_status` (`bill_status`, `payment_slip_uploaded_at`),
ADD INDEX `idx_approved_by` (`approved_by`),
ADD INDEX `idx_rejected_by` (`rejected_by`);

-- ตรวจสอบผลลัพธ์
DESCRIBE `monthly_bills`;
