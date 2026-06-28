import pool from '../config/db.js';

export { pool };

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL connections.');
  }

  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Database Connection Failed!', err);
    throw err;
  }
}

export async function connectDatabase() {
  return initializeDatabase();
}
