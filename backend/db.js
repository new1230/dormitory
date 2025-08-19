import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log(`🔗 Connecting to MySQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
console.log(`📊 Database: ${process.env.DB_NAME || 'dorm'}`);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dorm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
