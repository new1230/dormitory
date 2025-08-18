import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Booking API');
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Database connection test
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to the database successfully');
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.sqlMessage || error.message);
    console.error('SQL State:', error.sqlState || 'N/A');
    process.exit(1); // Exit the app if the database connection fails
  }
})();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log('Using mock data - no database required!');
  console.log('\nTest credentials:');
  console.log('Admin - Email: admin@example.com, Password: admin123');
  console.log('User - Email: user@example.com, Password: user123');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await pool.end();
  process.exit(0);
});