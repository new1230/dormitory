-- ตารางสมาชิก (Member)
CREATE TABLE member (
    mem_id INT(12) PRIMARY KEY AUTO_INCREMENT,
    mem_password VARCHAR(30) NOT NULL,
    mem_name VARCHAR(30) NOT NULL,
    mem_card_id VARCHAR(13) NOT NULL,
    mem_addr VARCHAR(255) NOT NULL,
    mem_email VARCHAR(50) NOT NULL,
    mem_tel VARCHAR(20) NOT NULL,
    mem_img VARCHAR(50),
    mem_status VARCHAR(1) NOT NULL DEFAULT '1',
    role ENUM('Student', 'Admin') NOT NULL
);

-- ตารางประเภทห้องพัก (RoomType)
CREATE TABLE room_type (
    room_type_id INT(10) PRIMARY KEY AUTO_INCREMENT,
    room_type_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    capacity INT(4) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    is_active VARCHAR(1) NOT NULL DEFAULT '1'
);

-- ตารางห้องพัก (Room)
CREATE TABLE room (
    room_id INT(11) PRIMARY KEY AUTO_INCREMENT,
    room_type_id INT(10) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    status VARCHAR(1) NOT NULL DEFAULT '1',
    description VARCHAR(255),
    room_img VARCHAR(50),
    FOREIGN KEY (room_type_id) REFERENCES room_type(room_type_id)
);

-- ตารางจองห้องพัก (Booking)
CREATE TABLE booking (
    booking_id INT(10) PRIMARY KEY AUTO_INCREMENT,
    room_id INT(10) NOT NULL,
    member_id INT(12) NOT NULL,
    check_in_date DATETIME NOT NULL,
    check_out_date DATETIME NOT NULL,
    booking_date DATETIME NOT NULL,
    booking_status VARCHAR(1) NOT NULL DEFAULT '1',
    remarks VARCHAR(255),
    FOREIGN KEY (room_id) REFERENCES room(room_id),
    FOREIGN KEY (member_id) REFERENCES member(mem_id)
);

-- ตารางเข้าพัก (Stay)
CREATE TABLE stay (
    stay_id INT(10) PRIMARY KEY AUTO_INCREMENT,
    booking_id INT(10) NOT NULL,
    actual_check_in DATETIME NOT NULL,
    actual_check_out DATETIME NOT NULL,
    total_guests INT(4) NOT NULL,
    stay_status VARCHAR(1) NOT NULL DEFAULT '1',
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
);

-- ตารางชำระเงิน (Payment)
CREATE TABLE payment (
    payment_id INT(10) PRIMARY KEY AUTO_INCREMENT,
    stay_id INT(10) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    utility_fee DECIMAL(10,2) NOT NULL DEFAULT 1,
    receipt_no VARCHAR(20),
    FOREIGN KEY (stay_id) REFERENCES stay(stay_id)
);