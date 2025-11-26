import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

dotenv.config();

const defaultTempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), 'judging-temp');
const defaultLogDir = process.env.LOG_DIR || path.join(os.tmpdir(), 'logs');

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  judging: {
    pythonExecutable: process.env.PYTHON_EXECUTABLE || 'python3',
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '256', 10),
    defaultTimeoutSeconds: parseInt(process.env.DEFAULT_TIMEOUT_SECONDS || '5', 10),
    tempDir: defaultTempDir,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: defaultLogDir,
  },
};
