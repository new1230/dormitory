import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import models (เพื่อให้ Sequelize รู้จัก)
import User from './models/User.js';
import LoginHistory from './models/LoginHistory.js';
import RoomType from './models/RoomType.js';
import RoomTypeImage from './models/RoomTypeImage.js';
import RoomImage from './models/RoomImage.js';
import Room from './models/Room.js';
import Booking from './models/Booking.js';
import MeterReading from './models/MeterReading.js';
import MonthlyBill from './models/MonthlyBill.js';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import usersRoutes from './routes/users.js';
import roomTypesRoutes from './routes/roomTypes.js';
import roomsRoutes from './routes/rooms.js';
import bookingsRoutes from './routes/bookings.js';
import meterReadingsRoutes from './routes/meterReadings.js';
import billsRoutes from './routes/bills.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Booking API');
});

// Setup model associations
const models = { User, LoginHistory, RoomType, RoomTypeImage, RoomImage, Room, Booking, MeterReading, MonthlyBill };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/room-types', roomTypesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/meter-readings', meterReadingsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('🔍 Error Stack:', err.stack);
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'ไฟล์มีขนาดใหญ่เกินไป' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'ประเภทไฟล์ไม่ถูกต้อง' });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Global variable to track database status
let isDatabaseConnected = false;

// Database connection test with Sequelize
(async () => {
  try {
    await sequelize.authenticate();
    isDatabaseConnected = true;
    console.log('✅ Connected to MySQL database successfully via Sequelize!');
    
    // Test if tables exist
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log(`✅ Database connected: ${tables.length} tables found`);
      
      // Sync models (silent)
      await sequelize.sync({ logging: false });
      console.log('✅ Models synchronized');
      
    } catch (dbError) {
      console.log(`⚠️  Database sync error:`, dbError.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to database via Sequelize:');
    console.error('Error:', error.message);
    console.log('📝 Continuing without database connection...');
  }
})();

// Start server with nodemon support
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  
  if (isDatabaseConnected) {
    console.log('💾 Using MySQL Database');
  } else {
    console.log('📋 Using Mock Data');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await sequelize.close();
  process.exit(0);
});