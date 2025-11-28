import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { testDatabaseConnection } from './config/database.js';

// 공통 미들웨어
import logger, { requestLogger } from './shared/utils/logger.js';
import { helmetConfig, corsOptions, apiLimiter } from './shared/middleware/security.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';

// 라우터
import authRoutes from './modules/auth/routes/authRoutes.js';
import userRoutes from './modules/users/routes/userRoutes.js';
import problemRoutes from './modules/problems/routes/problemRoutes.js';
import categoryRoutes from './modules/problems/routes/categoryRoutes.js';
import sessionRoutes from './modules/sessions/routes/sessionRoutes.js';
import auditRoutes from './modules/audit/routes/auditRoutes.js';
import submissionRoutes from './modules/submissions/routes/submissionRoutes.js';

// 현재 파일의 디렉토리 경로를 구함
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 보안 미들웨어
app.use(helmetConfig);
app.use(cors(corsOptions));

// Body 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use(requestLogger);

// 프론트엔드 빌드 파일 제공 (정적 파일)
// 프로덕션 환경에서만 제공
if (config.nodeEnv === 'production') {
  // static 미들웨어를 API 라우트보다 먼저 등록하여 파일 요청을 우선 처리
  app.use('/assets', express.static(path.join(__dirname, '../frontend-dist/assets')));
  app.use('/favicon.ico', express.static(path.join(__dirname, '../frontend-dist/favicon.ico')));
  app.use('/logo192.png', express.static(path.join(__dirname, '../frontend-dist/logo192.png'))); // React 기본 이미지
  app.use('/logo512.png', express.static(path.join(__dirname, '../frontend-dist/logo512.png'))); // React 기본 이미지
  app.use('/manifest.json', express.static(path.join(__dirname, '../frontend-dist/manifest.json')));

  // React Router를 위한 처리 - API 경로가 아닌 경우 index.html 제공
  app.get('*', (req, res) => {
    // API 요청은 처리하지 않고 다음 미들웨어(404 핸들러)로 전달
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(__dirname, '../frontend-dist/index.html'));
  });
} else {
  // 개발 환경에서는 기존 API 엔드포인트만 작동
  console.log('Development mode: Frontend static files are not served');
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testDatabaseConnection();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', problemRoutes);
app.use('/api', categoryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', submissionRoutes);

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
