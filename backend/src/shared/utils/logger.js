import winston from 'winston';
import { config } from '../../config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로그 디렉토리 생성
const logDir = path.resolve(process.cwd(), config.logging.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 콘솔 출력 포맷 (개발 환경)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = timestamp + ' [' + level + ']: ' + message;
    if (Object.keys(meta).length > 0) {
      msg += ' ' + JSON.stringify(meta, null, 2);
    }
    return msg;
  })
);

// Winston 로거 생성
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // 전체 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// 개발 환경에서는 콘솔 출력 추가
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 요청 로깅 미들웨어
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: duration + 'ms',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error('요청 처리 실패', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('클라이언트 에러', logData);
    } else {
      logger.info('요청 처리 완료', logData);
    }
  });

  next();
};

export default logger;
