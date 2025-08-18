# คู่มือการใช้งานฐานข้อมูลระบบจองหอพักนักศึกษา

## การติดตั้งฐานข้อมูลใน phpMyAdmin

### ขั้นตอนที่ 1: เข้า phpMyAdmin
1. เปิดเว็บเบราว์เซอร์
2. ไปที่ `http://localhost/phpmyadmin` (หรือ URL ของ phpMyAdmin ของคุณ)
3. เข้าสู่ระบบด้วย username และ password ของ MySQL

### ขั้นตอนที่ 2: สร้างฐานข้อมูล
1. คลิกที่แท็บ "SQL"
2. คัดลอกโค้ดจากไฟล์ `database.sql` ทั้งหมด
3. วางลงในช่อง SQL
4. คลิก "Go" หรือ "Execute"

### ขั้นตอนที่ 3: ตรวจสอบการสร้างฐานข้อมูล
หลังจากรัน SQL สำเร็จ คุณจะเห็น:
- ฐานข้อมูล `dormitory_booking`
- ตารางต่างๆ 8 ตาราง
- ข้อมูลตัวอย่าง
- Views และ Indexes

## โครงสร้างฐานข้อมูล

### ตารางหลัก

#### 1. users (ผู้ใช้)
- `id` - รหัสผู้ใช้ (Primary Key)
- `username` - ชื่อผู้ใช้ (Unique)
- `email` - อีเมล (Unique)
- `password` - รหัสผ่าน (เข้ารหัสแล้ว)
- `first_name` - ชื่อ
- `last_name` - นามสกุล
- `student_id` - รหัสนักศึกษา (Unique)
- `phone` - เบอร์โทรศัพท์
- `role` - สิทธิ์ (student/admin)
- `is_active` - สถานะการใช้งาน

#### 2. dormitories (หอพัก)
- `id` - รหัสหอพัก (Primary Key)
- `name` - ชื่อหอพัก
- `description` - รายละเอียด
- `street`, `city`, `state`, `zip_code` - ที่อยู่
- `contact_phone`, `contact_email` - ข้อมูลติดต่อ
- `rating` - คะแนนเฉลี่ย
- `total_reviews` - จำนวนรีวิว
- `is_active` - สถานะการใช้งาน

#### 3. room_types (ประเภทห้อง)
- `id` - รหัสประเภทห้อง (Primary Key)
- `dormitory_id` - รหัสหอพัก (Foreign Key)
- `name` - ชื่อประเภทห้อง
- `description` - รายละเอียด
- `price` - ราคา
- `capacity` - จำนวนคนที่รองรับ
- `available_rooms` - จำนวนห้องว่าง

#### 4. bookings (การจอง)
- `id` - รหัสการจอง (Primary Key)
- `user_id` - รหัสผู้ใช้ (Foreign Key)
- `dormitory_id` - รหัสหอพัก (Foreign Key)
- `room_type_id` - รหัสประเภทห้อง (Foreign Key)
- `check_in_date` - วันที่เช็คอิน
- `check_out_date` - วันที่เช็คเอาท์
- `total_price` - ราคารวม
- `status` - สถานะการจอง
- `payment_status` - สถานะการชำระเงิน

### ตารางเสริม

#### 5. facilities (สิ่งอำนวยความสะดวก)
- `id` - รหัสสิ่งอำนวยความสะดวก
- `name` - ชื่อ
- `icon` - ไอคอน
- `description` - รายละเอียด

#### 6. dormitory_facilities (ความสัมพันธ์หอพัก-สิ่งอำนวยความสะดวก)
- `dormitory_id` - รหัสหอพัก
- `facility_id` - รหัสสิ่งอำนวยความสะดวก

#### 7. dormitory_images (รูปภาพหอพัก)
- `dormitory_id` - รหัสหอพัก
- `image_url` - URL รูปภาพ
- `is_primary` - เป็นรูปหลักหรือไม่

#### 8. dormitory_rules (กฎระเบียบหอพัก)
- `dormitory_id` - รหัสหอพัก
- `rule_text` - ข้อความกฎ

## การใช้งานไฟล์ database_connection.php

### การตั้งค่า
1. เปิดไฟล์ `database_connection.php`
2. แก้ไขข้อมูลการเชื่อมต่อ:
   ```php
   $host = 'localhost';
   $dbname = 'dormitory_booking';
   $username = 'root';  // เปลี่ยนเป็น username ของคุณ
   $password = '';      // เปลี่ยนเป็น password ของคุณ
   ```

### ฟังก์ชันที่มีให้

#### การเชื่อมต่อฐานข้อมูล
```php
require_once 'database_connection.php';
// $pdo จะพร้อมใช้งาน
```

#### การทำความสะอาดข้อมูล
```php
$clean_data = sanitize_input($_POST['data']);
```

#### การเข้ารหัสรหัสผ่าน
```php
$hashed_password = hash_password($password);
```

#### การตรวจสอบรหัสผ่าน
```php
if (verify_password($password, $hashed_password)) {
    // รหัสผ่านถูกต้อง
}
```

#### การสร้าง JWT Token
```php
$token = generate_jwt_token($user_id);
```

#### การตรวจสอบ Token
```php
$user_id = check_auth(); // ตรวจสอบการเข้าสู่ระบบ
$admin_id = check_admin_auth(); // ตรวจสอบสิทธิ์ admin
```

#### การส่ง JSON Response
```php
send_json_response(['message' => 'สำเร็จ'], 200);
```

## ตัวอย่างการใช้งาน

### การดึงข้อมูลหอพักทั้งหมด
```php
$stmt = $pdo->query("SELECT * FROM dormitory_info");
$dormitories = $stmt->fetchAll();
send_json_response($dormitories);
```

### การเพิ่มผู้ใช้ใหม่
```php
$username = sanitize_input($_POST['username']);
$email = sanitize_input($_POST['email']);
$password = hash_password($_POST['password']);

$stmt = $pdo->prepare("INSERT INTO users (username, email, password, first_name, last_name, student_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([$username, $email, $password, $first_name, $last_name, $student_id, $phone]);
```

### การจองห้องพัก
```php
$user_id = check_auth();
$dormitory_id = $_POST['dormitory_id'];
$room_type_id = $_POST['room_type_id'];
$check_in = $_POST['check_in_date'];
$check_out = $_POST['check_out_date'];

$stmt = $pdo->prepare("INSERT INTO bookings (user_id, dormitory_id, room_type_id, check_in_date, check_out_date, total_price) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$user_id, $dormitory_id, $room_type_id, $check_in, $check_out, $total_price]);
```

## การบำรุงรักษา

### การสำรองข้อมูล
```sql
mysqldump -u root -p dormitory_booking > backup.sql
```

### การกู้คืนข้อมูล
```sql
mysql -u root -p dormitory_booking < backup.sql
```

### การลบข้อมูลเก่า
```sql
-- ลบการจองที่ยกเลิกแล้วเกิน 1 ปี
DELETE FROM bookings WHERE status = 'cancelled' AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ลบผู้ใช้ที่ไม่ได้ใช้งานเกิน 2 ปี
UPDATE users SET is_active = FALSE WHERE last_login < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

## หมายเหตุ
- ฐานข้อมูลใช้ UTF-8 เพื่อรองรับภาษาไทย
- มีการสร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
- มี Views สำหรับดึงข้อมูลที่ใช้บ่อย
- รองรับการทำงานแบบ Multi-user
- มีระบบ Log สำหรับติดตามการใช้งาน 