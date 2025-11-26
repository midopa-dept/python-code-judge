import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

let pool = null;

export const getPool = () => {
  if (!pool) {
    const connectionString = config.database.url || 'postgresql://postgres:claude0729@localhost:5432/postgres';

    pool = new Pool({
      connectionString,
      max: 20, // 최대 연결 수
      idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
      connectionTimeoutMillis: 5000, // 연결 타임아웃
    });

    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });

    console.log('PostgreSQL connection pool created');
  }

  return pool;
};

export const query = async (text, params) => {
  const client = getPool();
  return client.query(text, params);
};

export const getClient = async () => {
  const pool = getPool();
  return pool.connect();
};

export const testDatabaseConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection test successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
};
