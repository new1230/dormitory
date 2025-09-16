-- SQL สำหรับเพิ่มฟิลด์ข้อมูลนักศึกษาในตาราง member
-- ใช้สำหรับระบบหอพักนักศึกษา

-- เพิ่มฟิลด์สำหรับข้อมูลนักศึกษา
ALTER TABLE `member` 
ADD COLUMN `student_id` varchar(20) DEFAULT NULL COMMENT 'รหัสนักศึกษา' AFTER `mem_tel`,
ADD COLUMN `faculty` varchar(100) DEFAULT NULL COMMENT 'คณะ' AFTER `student_id`,
ADD COLUMN `major` varchar(100) DEFAULT NULL COMMENT 'สาขา' AFTER `faculty`,
ADD COLUMN `year` int(2) DEFAULT NULL COMMENT 'ชั้นปี (1-8)' AFTER `major`;

-- เพิ่ม index สำหรับ student_id เพื่อการค้นหาที่เร็วขึ้น
ALTER TABLE `member` 
ADD INDEX `idx_student_id` (`student_id`);

-- เพิ่ม index สำหรับ faculty และ major เพื่อการกรองข้อมูล
ALTER TABLE `member` 
ADD INDEX `idx_faculty` (`faculty`),
ADD INDEX `idx_major` (`major`),
ADD INDEX `idx_year` (`year`);

-- อัปเดตข้อมูลนักศึกษาที่มีอยู่แล้ว (ถ้าต้องการ)
-- ตัวอย่างการอัปเดตข้อมูลนักศึกษาที่มีอยู่
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

-- ตรวจสอบผลลัพธ์
SELECT 
  mem_id, 
  mem_name, 
  mem_email, 
  role,
  student_id, 
  faculty, 
  major, 
  year 
FROM `member` 
WHERE `role` = 'Student';

-- แสดงโครงสร้างตารางที่อัปเดตแล้ว
DESCRIBE `member`;
