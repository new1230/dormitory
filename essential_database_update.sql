-- =====================================================
-- SQL Script ที่จำเป็นจริงๆ สำหรับระบบ Room Management ใหม่
-- =====================================================

-- 1. เพิ่มฟิลด์ข้อมูลนักศึกษาในตาราง member (ถ้ายังไม่มี)
ALTER TABLE `member` 
ADD COLUMN `student_id` varchar(20) DEFAULT NULL COMMENT 'รหัสนักศึกษา' AFTER `mem_tel`,
ADD COLUMN `faculty` varchar(100) DEFAULT NULL COMMENT 'คณะ' AFTER `student_id`,
ADD COLUMN `major` varchar(100) DEFAULT NULL COMMENT 'สาขา' AFTER `faculty`,
ADD COLUMN `year` int(2) DEFAULT NULL COMMENT 'ชั้นปี (1-8)' AFTER `major`;

-- 2. เพิ่ม Index สำหรับการค้นหาที่เร็วขึ้น
ALTER TABLE `member` 
ADD INDEX `idx_student_id` (`student_id`),
ADD INDEX `idx_faculty` (`faculty`),
ADD INDEX `idx_major` (`major`),
ADD INDEX `idx_year` (`year`);

-- 3. อัปเดตข้อมูลนักศึกษาที่มีอยู่แล้ว
UPDATE `member` 
SET 
  `student_id` = '1234567890125',
  `faculty` = 'คณะวิศวกรรมศาสตร์',
  `major` = 'วิศวกรรมคอมพิวเตอร์',
  `year` = 3
WHERE `mem_id` = 3 AND `role` = 'Student';

UPDATE `member` 
SET 
  `student_id` = '1234567890126',
  `faculty` = 'คณะบริหารธุรกิจ',
  `major` = 'การจัดการ',
  `year` = 2
WHERE `mem_id` = 4 AND `role` = 'Student';

UPDATE `member` 
SET 
  `student_id` = '1234567890127',
  `faculty` = 'คณะวิทยาศาสตร์',
  `major` = 'วิทยาการคอมพิวเตอร์',
  `year` = 4
WHERE `mem_id` = 5 AND `role` = 'Student';

UPDATE `member` 
SET 
  `student_id` = '1379900099929',
  `faculty` = 'คณะเทคโนโลยีสารสนเทศ',
  `major` = 'เทคโนโลยีสารสนเทศ',
  `year` = 1
WHERE `mem_id` = 6 AND `role` = 'Student';

-- เสร็จแล้ว! ระบบพร้อมใช้งาน
