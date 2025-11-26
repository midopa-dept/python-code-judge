import express from 'express';
import cors from 'cors';
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

const app = express();

// 보안 미들웨어
app.use(helmetConfig);
app.use(cors(corsOptions));

// Body 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use(requestLogger);

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

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

export default app;
