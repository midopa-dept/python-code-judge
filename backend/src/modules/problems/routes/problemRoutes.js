import express from 'express';
import { problemController } from '../controllers/problemController.js';
import { testCaseController } from '../controllers/testCaseController.js';
import { authenticate, requireRole } from '../../../shared/middleware/auth.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 문제 관리
router.get('/problems', problemController.getProblems);
router.get('/problems/:id', problemController.getProblem);

router.post(
  '/problems',
  requireRole('admin', 'super_admin'),
  logAction('create'),
  problemController.createProblem
);

router.put(
  '/problems/:id',
  requireRole('admin', 'super_admin'),
  logAction('update'),
  problemController.updateProblem
);

router.delete(
  '/problems/:id',
  requireRole('admin', 'super_admin'),
  logAction('delete'),
  problemController.deleteProblem
);

// 테스트 케이스 관리
router.get('/problems/:id/test-cases', testCaseController.getTestCases);

router.post(
  '/problems/:id/test-cases',
  requireRole('admin', 'super_admin'),
  logAction('create'),
  testCaseController.createTestCase
);

router.put(
  '/problems/:id/test-cases/:testCaseId',
  requireRole('admin', 'super_admin'),
  logAction('update'),
  testCaseController.updateTestCase
);

router.delete(
  '/problems/:id/test-cases/:testCaseId',
  requireRole('admin', 'super_admin'),
  logAction('delete'),
  testCaseController.deleteTestCase
);

export default router;
