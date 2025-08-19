# AGENT.md - ระบบจองหอพักนักศึกษา

## ข้อมูลโครงการ
- **ชื่อ**: ระบบจองหอพักนักศึกษา (Dormitory Booking System)
- **เทคโนโลยี**: React + TypeScript (Frontend), Node.js + Express + MongoDB (Backend)
- **Repository**: https://github.com/new1230/dormitory

## โครงสร้างโปรเจค
```
dormitory/
├── backend/          # Node.js + Express + MongoDB
│   ├── config/       # การตั้งค่าฐานข้อมูล
│   ├── middleware/   # JWT Authentication, CORS
│   ├── models/       # Mongoose Models
│   ├── routes/       # API Routes
│   ├── server.js     # Entry point
│   └── package.json
├── frontend/         # React + TypeScript
│   ├── src/          # Source code
│   ├── public/       # Static files
│   └── package.json
├── database.sql      # Database schema
├── package.json      # Root package.json
└── README.md
```

## คำสั่งสำคัญ

### Development
```bash
# ติดตั้ง dependencies ทั้งหมด
npm run install-all

# รันโปรเจกต์ทั้งหมด (concurrent)
npm run dev

# รัน backend เท่านั้น
cd backend && node server.js

# รัน frontend เท่านั้น  
cd frontend && npm start
```

### Build & Test
```bash
# Build frontend
cd frontend && npm run build

# Test frontend
cd frontend && npm test

# Type check frontend
cd frontend && npx tsc --noEmit
```

## ฟีเจอร์หลัก (จากการวิเคราะห์)
1. **ระบบสมาชิก**
   - ลงทะเบียนและเข้าสู่ระบบ
   - JWT Authentication
   - บทบาทผู้ใช้ (นักศึกษา/ผู้ดูแล)

2. **ระบบหอพัก**
   - ดูรายการหอพัก
   - ข้อมูลห้องพัก
   - สถานะห้อง (ว่าง/ไม่ว่าง)

3. **ระบบจองห้องพัก**
   - จองห้องพัก
   - ยกเลิกการจอง
   - ประวัติการจอง

4. **ระบบจัดการ**
   - หน้าจัดการสำหรับผู้ดูแลระบบ
   - ระบบแจ้งเตือน
   - รายงานต่างๆ

## เทคโนโลยีที่ใช้

### Backend
- **Node.js** + **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database และ ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **express-validator** - Input validation
- **multer** - File upload
- **mysql2** - MySQL connector (สำรอง)

### Frontend  
- **React 18** + **TypeScript** - UI framework
- **Tailwind CSS** - CSS framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling

## การตั้งค่าสิ่งแวดล้อม

### Backend Environment Variables (.env)
```env
MONGODB_URI=mongodb://localhost:27017/dormitory
PORT=5000
```

### Database
- หลัก: **MongoDB** (ใช้ Mongoose ODM)
- สำรอง: **MySQL** (มี mysql2 driver)
- Schema: ดูใน `database.sql`

## Code Style & Conventions
- ใช้ **TypeScript** strict mode
- Component names: PascalCase
- File names: camelCase
- API routes: kebab-case
- Database models: PascalCase
- **Responsive Design**: ใช้ Tailwind CSS responsive classes (sm:, md:, lg:, xl:) ทุกหน้า
- **Mobile First**: ออกแบบให้รองรับมือถือก่อน แล้วค่อยปรับสำหรับหน้าจอใหญ่

### สำหรับการสร้างหน้าใหม่
- **ต้องเพิ่ม `import Navbar from '../components/Navbar';`** และใส่ `<Navbar />` ก่อน content หลัก
- **ใช้ PageTransition component** สำหรับ content area เท่านั้น (ไม่รวม Navbar):
  ```jsx
  import PageTransition from '../components/PageTransition';
  
  return (
    <div>
      <Navbar />
      <PageTransition>
        {/* Content area ของหน้านี้ */}
        <div className="your-content-here">
          {/* หน้าของคุณ */}
        </div>
      </PageTransition>
    </div>
  );
  ```
- รองรับ **4 บทบาทผู้ใช้**: Guest, Student, Manager, Admin
- **Navbar** จะแสดงเมนูและชื่อผู้ใช้ตามบทบาทโดยอัตโนมัติ

### การใช้งาน Notifications และ Loading Effects
- **Notification/Toast Messages** - ใช้สำหรับแจ้งเตือนสถานะต่างๆ:
  ```jsx
  import useNotification from '../hooks/useNotification';
  import { ToastContainer } from '../components/Notification';
  
  const MyComponent = () => {
    const { notifications, showSuccess, showError, showWarning, showInfo } = useNotification();
    
    const handleAction = () => {
      showSuccess('บันทึกข้อมูลสำเร็จ');
      showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      showWarning('คำเตือน: ข้อมูลอาจไม่ครบถ้วน');
      showInfo('ข้อมูลเพิ่มเติม');
    };
    
    return (
      <div>
        {/* Content ของคุณ */}
        <ToastContainer notifications={notifications} />
      </div>
    );
  };
  ```

- **Loading Effects และ Shimmer** - ใช้ขณะโหลดข้อมูล:
  ```jsx
  import { 
    LoadingSpinner, 
    LoadingOverlay, 
    LoadingButton,
    CardSkeleton,
    FormSkeleton,
    ShimmerEffect,
    PageLoading
  } from '../components/LoadingEffect';
  
  const MyComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
      <div>
        {/* Loading Spinner */}
        <LoadingSpinner size="medium" color="blue" />
        
        {/* Loading Button */}
        <LoadingButton loading={loading} onClick={handleSubmit}>
          บันทึกข้อมูล
        </LoadingButton>
        
        {/* Card Skeleton */}
        {loading ? <CardSkeleton rows={3} /> : <RealCard />}
        
        {/* Form Skeleton */}
        {loading ? <FormSkeleton fields={4} /> : <RealForm />}
        
        {/* Loading Overlay */}
        <LoadingOverlay isVisible={loading} message="กำลังบันทึกข้อมูล..." />
      </div>
    );
  };
  ```

- **Types ของ Notifications**:
  - `success` (เขียว) - สำเร็จ
  - `error` (แดง) - ผิดพลาด  
  - `warning` (เหลือง) - คำเตือน
  - `info` (น้ำเงิน) - ข้อมูล

- **Loading Effect Types**:
  - `LoadingSpinner` - Spinner หมุน
  - `ShimmerEffect` - เอฟเฟคกระพิบ
  - `CardSkeleton` - Skeleton สำหรับ Card
  - `FormSkeleton` - Skeleton สำหรับ Form
  - `TableRowSkeleton` - Skeleton สำหรับ Table
  - `LoadingOverlay` - Overlay ครอบทั้งหน้า
  - `LoadingButton` - ปุ่มที่มี loading state
  - `PageLoading` - Loading สำหรับทั้งหน้า

## การพัฒนา
1. ใช้ `npm run dev` สำหรับ development
2. Frontend รันที่ port 3000
3. Backend รันที่ port 5000  
4. ใช้ CORS เพื่อเชื่อมต่อ frontend กับ backend

## การจัดการสถานะงาน
- **สำคัญ**: เมื่อทำงานใดเสร็จสิ้น ให้อัปเดตสถานะเป็น "🔍 รอตรวจ" ในไฟล์ tasks.md
- งานจะถูกเปลี่ยนเป็น "✅ ผ่าน" หลังจากมีการตรวจสอบแล้ว
- อย่าเปลี่ยนสถานะเป็น "ผ่าน" โดยตรง ต้องผ่าน "รอตรวจ" เสมอ

## ข้อห้าม
- **ห้าม** รัน test หรือ npm run dev เพื่อทดสอบระบบ เพียงแค่ช่วยพัฒนาโค้ดให้เสร็จสมบูรณ์
- **ห้าม** ใช้คำสั่ง Bash เพื่อรันเซิร์ฟเวอร์ หรือทดสอบการทำงาน
- เน้นเขียนโค้ดให้เสร็จแล้วอัปเดตสถานะเป็น "รอตรวจ"

## หมายเหตุ
- ไฟล์ word บท1-3 เป็นเอกสารข้อมูลโครงการ (binary files)
- มี mock data และ seed data สำหรับ testing
- รองรับการ upload ไฟล์ด้วย multer
