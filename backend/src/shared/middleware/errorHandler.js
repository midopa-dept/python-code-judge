import { config } from '../../config/env.js';
import logger from '../utils/logger.js';
import AppError from '../errors/AppError.js';

/**
 * 에러 핸들링 미들웨어
 * 모든 에러를 통합적으로 처리하고 일관된 형식으로 응답합니다.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // AppError가 아닌 경우 변환
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || '서버 오류가 발생했습니다';
    error = new AppError(message, statusCode);
  }

  // 에러 로깅
  if (error.statusCode >= 500) {
    logger.error('서버 에러:', {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    logger.warn('클라이언트 에러:', {
      error: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  }

  // 응답 전송
  const response = {
    status: error.status,
    message: error.message,
  };

  if (error.errorCode) {
    response.errorCode = error.errorCode;
  }

  if (error.errors) {
    response.errors = error.errors;
  }

  // 개발 환경에서만 스택 트레이스 포함
  if (config.nodeEnv === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 404 Not Found 핸들러
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `요청하신 경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};
