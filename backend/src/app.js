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

// API 라우트를 먼저 등록 (정적 파일보다 우선)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', problemRoutes);
app.use('/api', categoryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', submissionRoutes);

// 프론트엔드 빌드 파일 제공 (정적 파일)
// 프로덕션 환경에서만 제공
if (config.nodeEnv === 'production') {
  // CSS 및 JS 파일을 위한 MIME 타입 설정 미들웨어를 먼저 추가
  app.use((req, res, next) => {
    if (req.url.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (req.url.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (req.url.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    next();
  });

  // 정적 파일 제공 미들웨어를 API 라우트 후에 등록
  app.use(express.static(path.join(__dirname, '../frontend-dist')));

  // 정적 파일이 존재하지 않을 때의 처리를 위해 별도의 미들웨어 추가
  app.use((req, res, next) => {
    console.log(`Static file not found, checking for API route: ${req.path}`);
    if (req.path.startsWith('/api/')) {
      // API 요청은 다음 미들웨어로 전달
      next();
    } else {
      // React Router를 위한 처리 - API 경로가 아닌 경우 index.html 제공
      console.log(`Serving index.html for route: ${req.path}`);
      const indexPath = path.join(__dirname, '../frontend-dist/index.html');

      // index.html 파일이 존재하는지 확인 후 제공
      import('fs').then(fs => {
        fs.access(indexPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.error(`index.html not found at path: ${indexPath}`);
            res.status(500).json({ error: 'Frontend build files not found' });
          } else {
            res.sendFile(indexPath);
          }
        });
      }).catch(err => {
        console.error('Failed to import fs module:', err);
        res.status(500).json({ error: 'Server configuration error' });
      });
    }
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

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
