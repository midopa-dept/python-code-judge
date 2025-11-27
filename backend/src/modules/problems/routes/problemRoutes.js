import express from 'express';
import { problemController } from '../controllers/problemController.js';
import { testCaseController } from '../controllers/testCaseController.js';
import { authenticate, requireAdmin } from '../../../middleware/authMiddleware.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 문제 관리
router.get('/problems', problemController.getProblems);
router.get('/problems/:id', problemController.getProblem);

router.post(
  '/problems',
  requireAdmin,
  logAction('create'),
  problemController.createProblem
);

router.put(
  '/problems/:id',
  requireAdmin,
  logAction('update'),
  problemController.updateProblem
);

router.delete(
  '/problems/:id',
  requireAdmin,
  logAction('delete'),
  problemController.deleteProblem
);

// 테스트 케이스 관리
router.get('/problems/:id/test-cases', testCaseController.getTestCases);

router.post(
  '/problems/:id/test-cases',
  requireAdmin,
  logAction('create'),
  testCaseController.createTestCase
);

router.put(
  '/problems/:id/test-cases/:testCaseId',
  requireAdmin,
  logAction('update'),
  testCaseController.updateTestCase
);

router.delete(
  '/problems/:id/test-cases/:testCaseId',
  requireAdmin,
  logAction('delete'),
  testCaseController.deleteTestCase
);

export default router;
