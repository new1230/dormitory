-- =====================================================
-- SQL Script สำหรับอัปเดต Database สำหรับระบบ Room Management ใหม่
-- รวมการจัดการห้องและประเภทห้องในหน้าเดียว
-- =====================================================

-- 1. เพิ่มฟิลด์ข้อมูลนักศึกษาในตาราง member (ถ้ายังไม่มี)
-- ตรวจสอบว่าฟิลด์มีอยู่แล้วหรือไม่ก่อนเพิ่ม
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'dorm' 
     AND TABLE_NAME = 'member' 
     AND COLUMN_NAME = 'student_id') > 0,
    'SELECT "student_id column already exists" as status;',
    'ALTER TABLE `member` 
     ADD COLUMN `student_id` varchar(20) DEFAULT NULL COMMENT "รหัสนักศึกษา" AFTER `mem_tel`,
     ADD COLUMN `faculty` varchar(100) DEFAULT NULL COMMENT "คณะ" AFTER `student_id`,
     ADD COLUMN `major` varchar(100) DEFAULT NULL COMMENT "สาขา" AFTER `faculty`,
     ADD COLUMN `year` int(2) DEFAULT NULL COMMENT "ชั้นปี (1-8)" AFTER `major`;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. เพิ่ม Index สำหรับฟิลด์ใหม่ (ถ้ายังไม่มี)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'dorm' 
     AND TABLE_NAME = 'member' 
     AND INDEX_NAME = 'idx_student_id') > 0,
    'SELECT "student_id index already exists" as status;',
    'ALTER TABLE `member` 
     ADD INDEX `idx_student_id` (`student_id`),
     ADD INDEX `idx_faculty` (`faculty`),
     ADD INDEX `idx_major` (`major`),
     ADD INDEX `idx_year` (`year`);'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. อัปเดตข้อมูลนักศึกษาที่มีอยู่แล้ว (ถ้ายังไม่ได้อัปเดต)
UPDATE `member` 
SET 
  `student_id` = '1234567890125',
  `faculty` = 'คณะวิศวกรรมศาสตร์',
  `major` = 'วิศวกรรมคอมพิวเตอร์',
  `year` = 3
WHERE `mem_id` = 3 AND `role` = 'Student' AND `student_id` IS NULL;

UPDATE `member` 
SET 
  `student_id` = '1234567890126',
  `faculty` = 'คณะบริหารธุรกิจ',
  `major` = 'การจัดการ',
  `year` = 2
WHERE `mem_id` = 4 AND `role` = 'Student' AND `student_id` IS NULL;

UPDATE `member` 
SET 
  `student_id` = '1234567890127',
  `faculty` = 'คณะวิทยาศาสตร์',
  `major` = 'วิทยาการคอมพิวเตอร์',
  `year` = 4
WHERE `mem_id` = 5 AND `role` = 'Student' AND `student_id` IS NULL;

UPDATE `member` 
SET 
  `student_id` = '1379900099929',
  `faculty` = 'คณะเทคโนโลยีสารสนเทศ',
  `major` = 'เทคโนโลยีสารสนเทศ',
  `year` = 1
WHERE `mem_id` = 6 AND `role` = 'Student' AND `student_id` IS NULL;

-- 4. ตรวจสอบว่าตาราง room_type มีฟิลด์ที่จำเป็นครบถ้วนหรือไม่
-- (ฟิลด์เหล่านี้ควรมีอยู่แล้วใน SQL.sql เดิม)
-- room_type_name, description, capacity, price_per_month, water_rate, electricity_rate
-- payment_due_day, room_style, gender_allowed, air_condition, fan, furnished
-- room_category, facilities, room_size, is_active

-- 5. ตรวจสอบว่าตาราง room มีฟิลด์ที่จำเป็นครบถ้วนหรือไม่
-- (ฟิลด์เหล่านี้ควรมีอยู่แล้วใน SQL.sql เดิม)
-- room_id, room_type_id, room_number, status, description, room_img

-- 6. ตรวจสอบว่าตาราง room_images และ room_type_images มีอยู่หรือไม่
-- (ตารางเหล่านี้ควรมีอยู่แล้วใน SQL.sql เดิม)

-- 7. สร้าง View สำหรับการแสดงข้อมูลห้องแบบรวม (ถ้ายังไม่มี)
CREATE OR REPLACE VIEW `room_management_view` AS
SELECT 
    r.room_id,
    r.room_number,
    r.status,
    r.description as room_description,
    r.room_img,
    r.contract_start,
    r.contract_end,
    r.current_tenant_id,
    rt.room_type_id,
    rt.room_type_name,
    rt.description as room_type_description,
    rt.thumbnail,
    rt.capacity,
    rt.price_per_month,
    rt.price_per_semester,
    rt.water_rate,
    rt.electricity_rate,
    rt.payment_due_day,
    rt.room_style,
    rt.gender_allowed,
    rt.air_condition,
    rt.fan,
    rt.furnished,
    rt.room_category,
    rt.facilities,
    rt.room_size,
    rt.is_active as room_type_active,
    m.mem_name as tenant_name,
    m.mem_tel as tenant_tel,
    m.mem_email as tenant_email,
    CASE 
        WHEN r.status = '1' THEN 'ว่าง'
        WHEN r.status = '0' THEN 'มีผู้พัก'
        WHEN r.status = '2' THEN 'ปิดซ่อม'
        WHEN r.status = '3' THEN 'จองแล้ว'
        ELSE 'ไม่ทราบสถานะ'
    END as status_text,
    CASE 
        WHEN r.contract_end IS NOT NULL THEN (TO_DAYS(r.contract_end) - TO_DAYS(CURDATE()))
        ELSE NULL
    END as days_left_contract
FROM room r
LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
LEFT JOIN member m ON r.current_tenant_id = m.mem_id;

-- 8. สร้าง Stored Procedure สำหรับการสร้างห้องพร้อมประเภทห้องใหม่
DELIMITER $$

CREATE PROCEDURE `CreateRoomWithNewType`(
    IN p_room_type_name VARCHAR(100),
    IN p_room_type_description TEXT,
    IN p_capacity INT,
    IN p_price_per_month DECIMAL(10,2),
    IN p_price_per_semester DECIMAL(10,2),
    IN p_water_rate DECIMAL(8,2),
    IN p_electricity_rate DECIMAL(8,2),
    IN p_payment_due_day INT,
    IN p_room_style ENUM('single','double','triple','quadruple','dormitory'),
    IN p_gender_allowed ENUM('male','female','mixed'),
    IN p_air_condition BOOLEAN,
    IN p_fan BOOLEAN,
    IN p_furnished ENUM('fully','partial','unfurnished'),
    IN p_room_category ENUM('standard','deluxe','suite','hostel'),
    IN p_facilities JSON,
    IN p_room_size DECIMAL(5,2),
    IN p_room_number VARCHAR(10),
    IN p_room_description VARCHAR(255),
    IN p_room_status VARCHAR(1),
    OUT p_room_type_id INT,
    OUT p_room_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'เกิดข้อผิดพลาดในการสร้างห้องและประเภทห้อง';
        SET p_room_type_id = NULL;
        SET p_room_id = NULL;
    END;

    START TRANSACTION;

    -- ตรวจสอบว่าชื่อประเภทห้องซ้ำหรือไม่
    IF EXISTS (SELECT 1 FROM room_type WHERE room_type_name = p_room_type_name) THEN
        SET p_message = 'ชื่อประเภทห้องนี้มีอยู่แล้ว';
        SET p_room_type_id = NULL;
        SET p_room_id = NULL;
        ROLLBACK;
    ELSE
        -- สร้างประเภทห้องใหม่
        INSERT INTO room_type (
            room_type_name, description, capacity, price_per_month, price_per_semester,
            water_rate, electricity_rate, payment_due_day, room_style, gender_allowed,
            air_condition, fan, furnished, room_category, facilities, room_size, is_active
        ) VALUES (
            p_room_type_name, p_room_type_description, p_capacity, p_price_per_month, p_price_per_semester,
            p_water_rate, p_electricity_rate, p_payment_due_day, p_room_style, p_gender_allowed,
            p_air_condition, p_fan, p_furnished, p_room_category, p_facilities, p_room_size, '1'
        );

        SET p_room_type_id = LAST_INSERT_ID();

        -- ตรวจสอบว่าหมายเลขห้องซ้ำหรือไม่
        IF EXISTS (SELECT 1 FROM room WHERE room_number = p_room_number) THEN
            SET p_message = 'หมายเลขห้องนี้มีอยู่แล้ว';
            SET p_room_type_id = NULL;
            SET p_room_id = NULL;
            ROLLBACK;
        ELSE
            -- สร้างห้องใหม่
            INSERT INTO room (
                room_type_id, room_number, status, description
            ) VALUES (
                p_room_type_id, p_room_number, p_room_status, p_room_description
            );

            SET p_room_id = LAST_INSERT_ID();
            SET p_message = 'สร้างประเภทห้องและห้องใหม่สำเร็จ';
            COMMIT;
        END IF;
    END IF;
END$$

DELIMITER ;

-- 9. สร้าง Trigger สำหรับการอัปเดต thumbnail ของ room_type เมื่อมีรูปภาพใหม่
DELIMITER $$

CREATE TRIGGER `update_room_type_thumbnail` 
AFTER INSERT ON `room_type_images`
FOR EACH ROW
BEGIN
    -- ถ้าเป็นรูปแรกที่อัปโหลด ให้ตั้งเป็น thumbnail
    IF NEW.is_primary = 1 THEN
        UPDATE room_type 
        SET thumbnail = NEW.image_filename 
        WHERE room_type_id = NEW.room_type_id;
    END IF;
END$$

DELIMITER ;

-- 10. สร้าง Trigger สำหรับการอัปเดต room_img ของ room เมื่อมีรูปภาพใหม่
DELIMITER $$

CREATE TRIGGER `update_room_primary_image` 
AFTER INSERT ON `room_images`
FOR EACH ROW
BEGIN
    -- ถ้าเป็นรูปแรกที่อัปโหลด ให้ตั้งเป็นรูปหลัก
    IF NEW.is_primary = 1 THEN
        UPDATE room 
        SET room_img = NEW.image_filename 
        WHERE room_id = NEW.room_id;
    END IF;
END$$

DELIMITER ;

-- 11. ตรวจสอบผลลัพธ์
SELECT 'Database update completed successfully' as status;

-- แสดงโครงสร้างตารางที่อัปเดตแล้ว
SELECT 'Updated member table structure:' as info;
DESCRIBE member;

-- แสดงข้อมูลนักศึกษาที่อัปเดตแล้ว
SELECT 'Updated student data:' as info;
SELECT 
    mem_id, 
    mem_name, 
    mem_email, 
    role,
    student_id, 
    faculty, 
    major, 
    year 
FROM member 
WHERE role = 'Student';

-- แสดงข้อมูลประเภทห้อง
SELECT 'Room types:' as info;
SELECT 
    room_type_id,
    room_type_name,
    capacity,
    price_per_month,
    is_active
FROM room_type;

-- แสดงข้อมูลห้อง
SELECT 'Rooms:' as info;
SELECT 
    room_id,
    room_number,
    room_type_id,
    status
FROM room
LIMIT 10;
