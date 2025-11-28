import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '../../config/env.js';

/**
 * CORS 설정 - 모든 origin 허용 (개발용)
 */
export const corsOptions = {
  origin: true, // 모든 origin 허용
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Helmet 보안 헤더 설정
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://python-judge.render.com', 'https://*.supabase.co'], // API 호출 및 Supabase 연결 허용
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Rate Limiting 설정
 * 일반 API 요청 제한
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    status: 'error',
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 인증 API Rate Limiting
 * 로그인/회원가입 등 인증 관련 요청 제한 (더 엄격)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5 요청
  message: {
    status: 'error',
    message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * 비밀번호 재설정 Rate Limiting
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3 요청
  message: {
    status: 'error',
    message: '비밀번호 재설정 요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
