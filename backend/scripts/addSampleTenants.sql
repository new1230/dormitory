-- เพิ่มข้อมูลผู้เช่าในห้องตัวอย่าง (ใช้ข้อมูลที่มีอยู่แล้ว)
-- ห้อง 103 มีผู้เช่า mem_id = 3 อยู่แล้ว
-- ห้อง 203 มีผู้เช่า mem_id = 4 อยู่แล้ว  
-- ห้อง D02 มีผู้เช่า mem_id = 5 อยู่แล้ว

-- เพิ่มข้อมูลการจดมิเตอร์เดือนก่อน (กรกฎาคม 2025) สำหรับห้องที่มีผู้เช่า
INSERT IGNORE INTO meter_readings 
(room_id, reading_month, reading_year, previous_water_reading, current_water_reading, 
 previous_electricity_reading, current_electricity_reading, recorded_by, other_charges, notes)
VALUES 
(3, 7, 2025, 0, 100, 0, 200, 1, 0, 'เริ่มต้น - ห้อง 103'),
(7, 7, 2025, 0, 80, 0, 150, 1, 0, 'เริ่มต้น - ห้อง 203'),
(13, 7, 2025, 0, 120, 0, 250, 1, 0, 'เริ่มต้น - ห้อง D02');
