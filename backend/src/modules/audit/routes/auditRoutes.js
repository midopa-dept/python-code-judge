import express from 'express';
import { authenticate, superAdminOnly } from '../../../middleware/authMiddleware.js';
import * as auditController from '../controllers/auditController.js';

const router = express.Router();

// 감사 로그 조회는 최고관리자만 가능
router.get('/', authenticate, superAdminOnly, auditController.getAuditLogs);

export default router;
