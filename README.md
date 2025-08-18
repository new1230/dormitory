# ระบบจองหอพักนักศึกษา (Dormitory Booking System)

ระบบจองหอพักนักศึกษาที่พัฒนาด้วย React และ Node.js

## โครงสร้างโปรเจกต์

```
dormitory-booking-system/
├── backend/          # Node.js + Express + MongoDB
├── frontend/         # React + TypeScript
├── package.json
└── README.md
```

## การติดตั้ง

1. ติดตั้ง dependencies ทั้งหมด:
```bash
npm run install-all
```

2. ตั้งค่าฐานข้อมูล MongoDB:
   - สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`
   - กำหนดค่า `MONGODB_URI` และ `JWT_SECRET`

3. รันโปรเจกต์:
```bash
npm run dev
```

## ฟีเจอร์หลัก

- ระบบลงทะเบียนและเข้าสู่ระบบ
- ดูรายการหอพัก
- จองห้องพัก
- จัดการการจอง
- ระบบแจ้งเตือน
- หน้าจัดการสำหรับผู้ดูแลระบบ

## เทคโนโลยีที่ใช้

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- bcryptjs
- cors

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Hook Form 