import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

dotenv.config();

/**
 * 환경 변수 검증 함수
 * 필수 환경 변수와 타입, 유효성을 검증합니다.
 */
function validateEnv() {
  const errors = [];

  // 1. 필수 환경 변수 검증
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`필수 환경 변수 ${varName}이(가) 설정되지 않았습니다.`);
    }
  }

  // 2. NODE_ENV 검증
  const validNodeEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validNodeEnvs.includes(nodeEnv)) {
    errors.push(
      `NODE_ENV는 ${validNodeEnvs.join(', ')} 중 하나여야 합니다. 현재 값: ${nodeEnv}`
    );
  }

  // 3. PORT 검증 (숫자형 및 범위)
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port)) {
      errors.push(`PORT는 숫자여야 합니다. 현재 값: ${process.env.PORT}`);
    } else if (port < 1 || port > 65535) {
      errors.push(`PORT는 1-65535 범위여야 합니다. 현재 값: ${port}`);
    }
  }

  // 4. MAX_MEMORY_MB 검증 (숫자형 및 범위)
  if (process.env.MAX_MEMORY_MB) {
    const maxMemory = parseInt(process.env.MAX_MEMORY_MB, 10);
    if (isNaN(maxMemory)) {
      errors.push(`MAX_MEMORY_MB는 숫자여야 합니다. 현재 값: ${process.env.MAX_MEMORY_MB}`);
    } else if (maxMemory < 64 || maxMemory > 2048) {
      errors.push(`MAX_MEMORY_MB는 64-2048 범위여야 합니다. 현재 값: ${maxMemory}`);
    }
  }

  // 5. DEFAULT_TIMEOUT_SECONDS 검증 (숫자형 및 범위)
  if (process.env.DEFAULT_TIMEOUT_SECONDS) {
    const timeout = parseInt(process.env.DEFAULT_TIMEOUT_SECONDS, 10);
    if (isNaN(timeout)) {
      errors.push(
        `DEFAULT_TIMEOUT_SECONDS는 숫자여야 합니다. 현재 값: ${process.env.DEFAULT_TIMEOUT_SECONDS}`
      );
    } else if (timeout < 1 || timeout > 10) {
      errors.push(`DEFAULT_TIMEOUT_SECONDS는 1-10 범위여야 합니다. 현재 값: ${timeout}`);
    }
  }

  // 검증 실패 시 프로세스 종료
  if (errors.length > 0) {
    console.error('\n========== 환경 변수 검증 실패 ==========');
    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });
    console.error('=========================================\n');
    console.error('.env 파일을 확인하고 필수 환경 변수를 설정해주세요.');
    process.exit(1);
  }
}

// 환경 변수 검증 실행
validateEnv();

const defaultTempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), 'judging-temp');
const defaultLogDir = process.env.LOG_DIR || path.join(os.tmpdir(), 'logs');

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
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
    pythonExecutable: process.env.PYTHON_EXECUTABLE || 'python',
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '256', 10),
    defaultTimeoutSeconds: parseInt(process.env.DEFAULT_TIMEOUT_SECONDS || '5', 10),
    maxCodeBytes: parseInt(process.env.MAX_CODE_BYTES || String(64 * 1024), 10),
    minTimeoutSeconds: parseInt(process.env.MIN_TIMEOUT_SECONDS || '1', 10),
    maxTimeoutSeconds: parseInt(process.env.MAX_TIMEOUT_SECONDS || '10', 10),
    tempDir: defaultTempDir,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: defaultLogDir,
  },
};
