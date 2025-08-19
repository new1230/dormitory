-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 18, 2025 at 05:48 PM
-- Server version: 8.0.17
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dorm`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `calculate_monthly_rent` (`room_type_id_param` INT, `water_units` DECIMAL(8,2), `electricity_units` DECIMAL(8,2)) RETURNS DECIMAL(10,2) READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE base_rent DECIMAL(10,2);
    DECLARE water_rate_val DECIMAL(8,2);
    DECLARE electricity_rate_val DECIMAL(8,2);
    DECLARE total_rent DECIMAL(10,2);
    
    SELECT price_per_month, water_rate, electricity_rate 
    INTO base_rent, water_rate_val, electricity_rate_val
    FROM room_type 
    WHERE room_type_id = room_type_id_param;
    
    SET total_rent = base_rent + (water_units * water_rate_val) + (electricity_units * electricity_rate_val);
    
    RETURN total_rent;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `booking_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `booking_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `booking_status` enum('pending','approved','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  `remarks` text,
  `deposit_amount` decimal(10,2) DEFAULT NULL,
  `deposit_status` enum('none','pending','paid','refunded') NOT NULL DEFAULT 'none'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int(10) NOT NULL,
  `member_id` int(12) NOT NULL,
  `login_time` datetime NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text,
  `device_info` json DEFAULT NULL,
  `login_status` enum('success','failed','blocked') NOT NULL DEFAULT 'success',
  `failure_reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `member_id`, `login_time`, `ip_address`, `user_agent`, `device_info`, `login_status`, `failure_reason`) VALUES
(1, 1, '2025-08-18 17:37:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:37:43.024Z\"}', 'failed', 'Wrong password'),
(2, 1, '2025-08-18 17:37:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:37:47.310Z\"}', 'failed', 'Wrong password'),
(3, 1, '2025-08-18 17:40:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:40:12.664Z\"}', 'failed', 'Wrong password'),
(4, 1, '2025-08-18 17:40:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:40:16.438Z\"}', 'failed', 'Wrong password'),
(5, 1, '2025-08-18 17:40:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:40:35.754Z\"}', 'failed', 'Wrong password'),
(6, 2, '2025-08-18 17:43:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:43:34.654Z\"}', 'failed', 'Wrong password'),
(7, 1, '2025-08-18 17:45:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:45:08.315Z\"}', 'failed', 'Wrong password'),
(8, 6, '2025-08-18 17:46:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:46:06.985Z\"}', 'success', NULL),
(9, 6, '2025-08-18 17:46:14', '::1', 'UPLOAD_PROFILE_IMAGE: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 'success', NULL),
(10, 1, '2025-08-18 17:46:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:46:53.609Z\"}', 'failed', 'Wrong password'),
(11, 1, '2025-08-18 17:47:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{\"browser\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36\", \"platform\": \"Unknown\", \"timestamp\": \"2025-08-18T17:47:37.146Z\"}', 'success', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `mem_id` int(11) NOT NULL,
  `mem_password` varchar(255) NOT NULL,
  `mem_name` varchar(100) NOT NULL,
  `mem_card_id` varchar(13) NOT NULL,
  `mem_addr` text NOT NULL,
  `mem_email` varchar(100) NOT NULL,
  `mem_tel` varchar(20) NOT NULL,
  `mem_img` varchar(255) DEFAULT NULL,
  `mem_status` varchar(1) NOT NULL DEFAULT '1',
  `role` enum('Student','Manager','Admin') NOT NULL DEFAULT 'Student'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`mem_id`, `mem_password`, `mem_name`, `mem_card_id`, `mem_addr`, `mem_email`, `mem_tel`, `mem_img`, `mem_status`, `role`) VALUES
(1, '$2a$10$CFG4OmkKQS2PoBBhh47Nqu/D5WurFw4.VAw/uUdfK476g0mDE8/2C', 'ผู้ดูแลระบบ', '1234567890123', '123 ถนนมหาวิทยาลัย กรุงเทพฯ 10400', 'admin@dormitory.com', '0812345678', NULL, '1', 'Admin'),
(2, '$2a$10$CFG4OmkKQS2PoBBhh47Nqu/D5WurFw4.VAw/uUdfK476g0mDE8/2C', 'ผู้จัดการหอพัก', '1234567890124', '456 ถนนการจัดการ กรุงเทพฯ 10400', 'manager@dormitory.com', '0823456789', NULL, '1', 'Manager'),
(3, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นายนักศึกษา ตัวอย่าง', '1234567890125', '789 ถนนนักศึกษา กรุงเทพฯ 10400', 'student@dormitory.com', '0834567890', NULL, '1', 'Student'),
(4, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นางสาวศิริ วิทยาลัย', '1234567890126', '101 ถนนอุดมศึกษา กรุงเทพฯ 10400', 'siri.wit@student.ac.th', '0845678901', NULL, '1', 'Student'),
(5, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นายสมชาย เรียนดี', '1234567890127', '202 ถนนความรู้ กรุงเทพฯ 10400', 'somchai.rd@student.ac.th', '0856789012', NULL, '1', 'Student'),
(6, '$2a$10$CFG4OmkKQS2PoBBhh47Nqu/D5WurFw4.VAw/uUdfK476g0mDE8/2C', 'hhh', '1379900099929', 'ss', 'hhh@hhh.hhh', '0850150026', 'profile-6-1755539174644-629127590.png', '1', 'Student');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `stay_id` int(11) NOT NULL,
  `payment_type` enum('rent','utilities','deposit','penalty','other') NOT NULL DEFAULT 'rent',
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','bank_transfer','credit_card','other') NOT NULL DEFAULT 'cash',
  `utility_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `water_units` decimal(8,2) DEFAULT NULL,
  `electricity_units` decimal(8,2) DEFAULT NULL,
  `receipt_no` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','completed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `room_id` int(11) NOT NULL,
  `room_type_id` int(11) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `status` varchar(1) NOT NULL DEFAULT '1',
  `contract_start` date DEFAULT NULL COMMENT 'วันที่เริ่มสัญญา',
  `contract_end` date DEFAULT NULL COMMENT 'วันที่สิ้นสุดสัญญา',
  `current_tenant_id` int(11) DEFAULT NULL COMMENT 'ID ผู้เช่าปัจจุบัน',
  `description` varchar(255) DEFAULT NULL,
  `room_img` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`room_id`, `room_type_id`, `room_number`, `status`, `contract_start`, `contract_end`, `current_tenant_id`, `description`, `room_img`) VALUES
(1, 1, '101', '1', NULL, NULL, NULL, 'ห้องเดี่ยวชั้น 1 วิวสวน', NULL),
(2, 1, '102', '1', NULL, NULL, NULL, 'ห้องเดี่ยวชั้น 1 วิวลานจอดรถ', NULL),
(3, 1, '103', '0', '2024-06-01', '2025-05-31', 3, 'ห้องเดี่ยวชั้น 1 วิวสวน', NULL),
(4, 1, '104', '1', NULL, NULL, NULL, 'ห้องเดี่ยวชั้น 1 วิวถนน', NULL),
(5, 2, '201', '1', NULL, NULL, NULL, 'ห้องคู่ชั้น 2 วิวสวน', NULL),
(6, 2, '202', '3', NULL, NULL, NULL, 'ห้องคู่ชั้น 2 วิวลานจอดรถ', NULL),
(7, 2, '203', '0', '2024-07-01', '2025-06-30', 4, 'ห้องคู่ชั้น 2 วิวสวน', NULL),
(8, 2, '204', '1', NULL, NULL, NULL, 'ห้องคู่ชั้น 2 วิวถนน', NULL),
(9, 3, '301', '1', NULL, NULL, NULL, 'ห้องเดี่ยวพรีเมี่ยม ชั้น 3', NULL),
(10, 3, '302', '2', NULL, NULL, NULL, 'ห้องเดี่ยวพรีเมี่ยม ชั้น 3 (ซ่อมแอร์)', NULL),
(11, 3, '303', '1', NULL, NULL, NULL, 'ห้องเดี่ยวพรีเมี่ยม ชั้น 3 วิวสวย', NULL),
(12, 4, 'D01', '1', NULL, NULL, NULL, 'ห้องรวมชาย ตึก D', NULL),
(13, 4, 'D02', '0', '2024-08-01', '2025-01-31', 5, 'ห้องรวมชาย ตึก D', NULL),
(14, 4, 'D03', '1', NULL, NULL, NULL, 'ห้องรวมชาย ตึก D', NULL),
(15, 5, 'C01', '1', NULL, NULL, NULL, 'ห้องรวมหญิง ตึก C', NULL),
(16, 5, 'C02', '3', NULL, NULL, NULL, 'ห้องรวมหญิง ตึก C', NULL),
(17, 5, 'C03', '1', NULL, NULL, NULL, 'ห้องรวมหญิง ตึก C', NULL);

--
-- Triggers `room`
--
DELIMITER $$
CREATE TRIGGER `update_room_tenant_on_status_change` BEFORE UPDATE ON `room` FOR EACH ROW BEGIN
    -- ถ้าเปลี่ยนจากมีผู้พักเป็นว่าง ให้ล้าง tenant info
    IF OLD.status = '0' AND NEW.status = '1' THEN
        SET NEW.current_tenant_id = NULL;
        SET NEW.contract_start = NULL;
        SET NEW.contract_end = NULL;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `room_detail_view`
-- (See below for the actual view)
--
CREATE TABLE `room_detail_view` (
`air_condition` tinyint(1)
,`capacity` int(11)
,`contract_end` date
,`contract_start` date
,`current_tenant_id` int(11)
,`days_left_contract` int(7)
,`electricity_rate` decimal(8,2)
,`facilities` json
,`fan` tinyint(1)
,`furnished` enum('fully','partial','unfurnished')
,`gender_allowed` enum('male','female','mixed')
,`payment_due_day` int(11)
,`price_per_month` decimal(10,2)
,`price_per_semester` decimal(10,2)
,`room_category` enum('standard','deluxe','suite','hostel')
,`room_description` varchar(255)
,`room_id` int(11)
,`room_img` varchar(255)
,`room_number` varchar(10)
,`room_size` decimal(5,2)
,`room_style` enum('single','double','triple','quadruple','dormitory')
,`room_type_active` varchar(1)
,`room_type_description` text
,`room_type_id` int(11)
,`room_type_name` varchar(100)
,`status` varchar(1)
,`status_text` varchar(12)
,`tenant_email` varchar(100)
,`tenant_name` varchar(100)
,`tenant_tel` varchar(20)
,`thumbnail` varchar(255)
,`water_rate` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `room_type`
--

CREATE TABLE `room_type` (
  `room_type_id` int(11) NOT NULL,
  `room_type_name` varchar(100) NOT NULL,
  `description` text,
  `thumbnail` varchar(255) DEFAULT NULL COMMENT 'รูปภาพตัวอย่างประเภทห้อง',
  `capacity` int(11) NOT NULL,
  `price_per_month` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'ค่าเช่าต่อเดือน (บาท)',
  `price_per_semester` decimal(10,2) DEFAULT '0.00' COMMENT 'ค่าเช่าต่อเทอม (บาท)',
  `water_rate` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT 'ค่าน้ำต่อหน่วย (บาท)',
  `electricity_rate` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT 'ค่าไฟต่อหน่วย (บาท)',
  `payment_due_day` int(11) NOT NULL DEFAULT '5' COMMENT 'วันที่ครบกำหนดชำระ (วันที่ของเดือน)',
  `room_style` enum('single','double','triple','quadruple','dormitory') NOT NULL DEFAULT 'single' COMMENT 'ประเภทตามจำนวนผู้พัก',
  `gender_allowed` enum('male','female','mixed') NOT NULL DEFAULT 'mixed' COMMENT 'เพศที่อนุญาต',
  `air_condition` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'มีแอร์หรือไม่',
  `fan` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'มีพัดลมหรือไม่',
  `furnished` enum('fully','partial','unfurnished') NOT NULL DEFAULT 'partial' COMMENT 'ระดับเฟอร์นิเจอร์',
  `room_category` enum('standard','deluxe','suite','hostel') NOT NULL DEFAULT 'standard' COMMENT 'ประเภทตามรูปแบบการใช้',
  `facilities` json DEFAULT NULL COMMENT 'สิ่งอำนวยความสะดวกเพิ่มเติม',
  `room_size` decimal(5,2) DEFAULT NULL COMMENT 'ขนาดห้อง (ตารางเมตร)',
  `is_active` varchar(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `room_type`
--

INSERT INTO `room_type` (`room_type_id`, `room_type_name`, `description`, `thumbnail`, `capacity`, `price_per_month`, `price_per_semester`, `water_rate`, `electricity_rate`, `payment_due_day`, `room_style`, `gender_allowed`, `air_condition`, `fan`, `furnished`, `room_category`, `facilities`, `room_size`, `is_active`) VALUES
(1, 'ห้องเดี่ยว แอร์ พื้นฐาน', 'ห้องเดี่ยวปรับอากาศ เฟอร์นิเจอร์พื้นฐาน เหมาะสำหรับนักศึกษาที่ต้องการความเป็นส่วนตัว', NULL, 1, '3500.00', '15750.00', '18.00', '7.50', 5, 'single', 'mixed', 1, 0, 'partial', 'standard', '{\"tv\": false, \"bed\": true, \"desk\": true, \"wifi\": true, \"chair\": true, \"closet\": true, \"balcony\": false, \"hot_water\": false, \"refrigerator\": false, \"private_bathroom\": true}', '15.00', '1'),
(2, 'ห้องคู่ พัดลม ประหยัด', 'ห้องคู่พัดลม เฟอร์นิเจอร์พื้นฐาน เหมาะสำหรับนักศึกษาที่ต้องการประหยัด', NULL, 2, '2000.00', '9000.00', '15.00', '6.00', 5, 'double', 'mixed', 0, 1, 'partial', 'standard', '{\"tv\": false, \"bed\": true, \"desk\": true, \"wifi\": true, \"chair\": true, \"closet\": true, \"balcony\": false, \"hot_water\": false, \"refrigerator\": false, \"private_bathroom\": true}', '20.00', '1'),
(3, 'ห้องเดี่ยว แอร์ ครบครัน', 'ห้องเดี่ยวปรับอากาศ เฟอร์นิเจอร์ครบครัน ตู้เย็น ทีวี น้ำอุ่น', NULL, 1, '4500.00', '20250.00', '18.00', '8.00', 5, 'single', 'mixed', 1, 0, 'fully', 'deluxe', '{\"tv\": true, \"bed\": true, \"desk\": true, \"wifi\": true, \"chair\": true, \"closet\": true, \"balcony\": true, \"hot_water\": true, \"refrigerator\": true, \"private_bathroom\": true}', '18.00', '1'),
(4, 'ห้องรวมชาย (โฮสเทล)', 'ห้องพักรวมสำหรับชายเท่านั้น เตียงสองชั้น 4 เตียง พัดลม ห้องน้ำรวม', NULL, 4, '1200.00', '5400.00', '12.00', '5.00', 5, 'dormitory', 'male', 0, 1, 'partial', 'hostel', '{\"tv\": false, \"bed\": true, \"desk\": true, \"wifi\": true, \"chair\": false, \"closet\": true, \"balcony\": false, \"hot_water\": false, \"refrigerator\": false, \"private_bathroom\": false}', '25.00', '1'),
(5, 'ห้องรวมหญิง (โฮสเทล)', 'ห้องพักรวมสำหรับหญิงเท่านั้น เตียงสองชั้น 4 เตียง พัดลม ห้องน้ำรวม', NULL, 4, '1200.00', '5400.00', '12.00', '5.00', 5, 'dormitory', 'female', 0, 1, 'partial', 'hostel', '{\"tv\": false, \"bed\": true, \"desk\": true, \"wifi\": true, \"chair\": false, \"closet\": true, \"balcony\": false, \"hot_water\": false, \"refrigerator\": false, \"private_bathroom\": false}', '25.00', '1');

-- --------------------------------------------------------

--
-- Table structure for table `stay`
--

CREATE TABLE `stay` (
  `stay_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `actual_check_in` datetime DEFAULT NULL,
  `actual_check_out` datetime DEFAULT NULL,
  `total_guests` int(11) NOT NULL DEFAULT '1',
  `stay_status` enum('active','completed','extended','terminated') NOT NULL DEFAULT 'active',
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure for view `room_detail_view`
--
DROP TABLE IF EXISTS `room_detail_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `room_detail_view`  AS  select `r`.`room_id` AS `room_id`,`r`.`room_number` AS `room_number`,`r`.`status` AS `status`,`r`.`description` AS `room_description`,`r`.`room_img` AS `room_img`,`r`.`contract_start` AS `contract_start`,`r`.`contract_end` AS `contract_end`,`r`.`current_tenant_id` AS `current_tenant_id`,`rt`.`room_type_id` AS `room_type_id`,`rt`.`room_type_name` AS `room_type_name`,`rt`.`description` AS `room_type_description`,`rt`.`thumbnail` AS `thumbnail`,`rt`.`capacity` AS `capacity`,`rt`.`price_per_month` AS `price_per_month`,`rt`.`price_per_semester` AS `price_per_semester`,`rt`.`water_rate` AS `water_rate`,`rt`.`electricity_rate` AS `electricity_rate`,`rt`.`payment_due_day` AS `payment_due_day`,`rt`.`room_style` AS `room_style`,`rt`.`gender_allowed` AS `gender_allowed`,`rt`.`air_condition` AS `air_condition`,`rt`.`fan` AS `fan`,`rt`.`furnished` AS `furnished`,`rt`.`room_category` AS `room_category`,`rt`.`facilities` AS `facilities`,`rt`.`room_size` AS `room_size`,`rt`.`is_active` AS `room_type_active`,`m`.`mem_name` AS `tenant_name`,`m`.`mem_tel` AS `tenant_tel`,`m`.`mem_email` AS `tenant_email`,(case when (`r`.`status` = '1') then 'ห้องว่าง' when (`r`.`status` = '0') then 'มีผู้พัก' when (`r`.`status` = '2') then 'ปิดซ่อม' when (`r`.`status` = '3') then 'จองแล้ว' else 'ไม่ทราบสถานะ' end) AS `status_text`,(case when (`r`.`contract_end` is not null) then (to_days(`r`.`contract_end`) - to_days(curdate())) else NULL end) AS `days_left_contract` from ((`room` `r` left join `room_type` `rt` on((`r`.`room_type_id` = `rt`.`room_type_id`))) left join `member` `m` on((`r`.`current_tenant_id` = `m`.`mem_id`))) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `idx_booking_status` (`booking_status`),
  ADD KEY `idx_booking_date` (`booking_date`),
  ADD KEY `idx_booking_checkin` (`check_in_date`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`mem_id`),
  ADD UNIQUE KEY `mem_card_id` (`mem_card_id`),
  ADD UNIQUE KEY `mem_email` (`mem_email`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `stay_id` (`stay_id`),
  ADD KEY `idx_payment_type` (`payment_type`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_number` (`room_number`),
  ADD KEY `room_type_id` (`room_type_id`),
  ADD KEY `idx_room_status` (`status`),
  ADD KEY `idx_room_contract_end` (`contract_end`),
  ADD KEY `idx_room_tenant` (`current_tenant_id`);

--
-- Indexes for table `room_type`
--
ALTER TABLE `room_type`
  ADD PRIMARY KEY (`room_type_id`),
  ADD KEY `idx_room_type_style` (`room_style`),
  ADD KEY `idx_room_type_gender` (`gender_allowed`),
  ADD KEY `idx_room_type_category` (`room_category`),
  ADD KEY `idx_room_type_active` (`is_active`);

--
-- Indexes for table `stay`
--
ALTER TABLE `stay`
  ADD PRIMARY KEY (`stay_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `idx_stay_status` (`stay_status`),
  ADD KEY `idx_stay_checkin` (`actual_check_in`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `mem_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `room_type`
--
ALTER TABLE `room_type`
  MODIFY `room_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stay`
--
ALTER TABLE `stay`
  MODIFY `stay_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`),
  ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `member` (`mem_id`);

--
-- Constraints for table `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `member` (`mem_id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`stay_id`) REFERENCES `stay` (`stay_id`);

--
-- Constraints for table `room`
--
ALTER TABLE `room`
  ADD CONSTRAINT `room_ibfk_1` FOREIGN KEY (`room_type_id`) REFERENCES `room_type` (`room_type_id`),
  ADD CONSTRAINT `room_tenant_fk` FOREIGN KEY (`current_tenant_id`) REFERENCES `member` (`mem_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `stay`
--
ALTER TABLE `stay`
  ADD CONSTRAINT `stay_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
