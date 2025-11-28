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

// 프로덕션 환경에서 정적 파일 제공 (API 라우트보다 먼저!)
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '../frontend-dist');
  console.log('📦 Serving static files from:', frontendPath);
  
  // 정적 파일 제공 (assets 폴더 등)
  app.use(express.static(frontendPath, {
    maxAge: '1d',
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filepath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filepath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filepath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
  }));
}

// API 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', problemRoutes);
app.use('/api', categoryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', submissionRoutes);

// 프로덕션 환경에서 SPA fallback (모든 non-API, non-static 요청을 index.html로)
if (config.nodeEnv === 'production') {
  app.get('*', (req, res, next) => {
    // API 요청과 정적 파일 요청은 건너뜀
    if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
      return next();
    }
    
    const indexPath = path.join(__dirname, '../frontend-dist/index.html');
    console.log(`📄 Serving index.html for: ${req.path}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('❌ Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
} else {
  console.log('Development mode: Frontend static files are not served');
}

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
