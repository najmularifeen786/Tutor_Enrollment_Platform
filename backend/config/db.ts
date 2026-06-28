import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

const pool = new Pool(poolConfig);
export default pool;
