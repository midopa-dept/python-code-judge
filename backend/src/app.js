import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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

// Health check endpoint (인증 불필요)
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

// Debug: 프론트엔드 파일 확인 (인증 불필요)
app.get('/api/debug/frontend-files', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend-dist');
  
  try {
    const exists = fs.existsSync(frontendPath);
    let files = [];
    let indexHtmlExists = false;
    
    if (exists) {
      files = fs.readdirSync(frontendPath, { withFileTypes: true });
      indexHtmlExists = fs.existsSync(path.join(frontendPath, 'index.html'));
      
      // assets 폴더도 확인
      const assetsPath = path.join(frontendPath, 'assets');
      const assetsExists = fs.existsSync(assetsPath);
      let assetsFiles = [];
      
      if (assetsExists) {
        assetsFiles = fs.readdirSync(assetsPath);
      }
      
      res.json({
        frontendPath,
        exists,
        indexHtmlExists,
        files: files.map(f => ({
          name: f.name,
          isDirectory: f.isDirectory()
        })),
        assetsExists,
        assetsFiles: assetsFiles.slice(0, 10) // 처음 10개만
      });
    } else {
      res.json({
        frontendPath,
        exists: false,
        error: 'frontend-dist directory does not exist'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// API 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', problemRoutes);
app.use('/api', categoryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', submissionRoutes);

// 프로덕션 환경: Frontend는 Vercel에서 별도 제공
// Backend는 API만 제공
console.log('Backend API server mode (Frontend served separately via Vercel)');

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
