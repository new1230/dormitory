import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'dorm',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '12345678',
  logging: process.env.NODE_ENV === 'development' ? false : false // ปิด logging
});

export default sequelize; 