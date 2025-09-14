-- Migration Script: แก้ไข booking table ให้ตรงกับ Sequelize Model
-- รันคำสั่งนี้ในฐานข้อมูล dorm

USE dorm;

-- เพิ่มคอลัมน์ใหม่ลงใน booking table
ALTER TABLE `booking` 
ADD COLUMN `contract_accepted` TINYINT(1) DEFAULT 0 COMMENT 'สถานะการยอมรับสัญญา',
ADD COLUMN `contract_accepted_at` DATETIME NULL COMMENT 'วันที่ยอมรับสัญญา',
ADD COLUMN `payment_slip_url` VARCHAR(255) NULL COMMENT 'URL หลักฐานการชำระเงิน', 
ADD COLUMN `payment_slip_uploaded_at` DATETIME NULL COMMENT 'วันที่อัปโหลดหลักฐาน',
ADD COLUMN `payment_deadline` DATETIME NULL COMMENT 'กำหนดเวลาชำระเงิน',
ADD COLUMN `manager_approved_at` DATETIME NULL COMMENT 'วันที่ผู้จัดการอนุมัติ',
ADD COLUMN `manager_approved_by` INT(11) NULL COMMENT 'ผู้จัดการที่อนุมัติ',
ADD COLUMN `total_price` DECIMAL(10,2) NULL COMMENT 'ราคารวมทั้งหมด',
ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้างระเบียน',
ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัปเดตระเบียน';

-- เพิ่ม Foreign Key สำหรับ manager_approved_by
ALTER TABLE `booking` 
ADD CONSTRAINT `fk_booking_manager` 
FOREIGN KEY (`manager_approved_by`) 
REFERENCES `member` (`mem_id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- อัปเดตข้อมูลเก่าให้มี createdAt และ updatedAt
UPDATE `booking` 
SET 
    `createdAt` = `booking_date`,
    `updatedAt` = `booking_date`
WHERE `createdAt` IS NULL OR `updatedAt` IS NULL;

-- แสดงโครงสร้างตารางใหม่
DESCRIBE `booking`;

SELECT 'Database migration completed successfully!' as status;
