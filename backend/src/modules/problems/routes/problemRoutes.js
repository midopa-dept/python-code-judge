import express from 'express';
import { problemController } from '../controllers/problemController.js';
import { testCaseController } from '../controllers/testCaseController.js';
import { authenticate, requireAdmin } from '../../../middleware/authMiddleware.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';
import {
  validateGetProblems,
  validateProblemId,
  validateCreateProblem,
  validateUpdateProblem,
  validateCreateTestCase,
  validateUpdateTestCase,
  validateTestCaseId,
} from '../validators/problemValidator.js';

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 문제 관리
router.get('/problems', validateGetProblems, problemController.getProblems);
router.get('/problems/:id', validateProblemId, problemController.getProblem);

router.post(
  '/problems',
  requireAdmin,
  validateCreateProblem,
  logAction('create'),
  problemController.createProblem
);

router.put(
  '/problems/:id',
  requireAdmin,
  validateUpdateProblem,
  logAction('update'),
  problemController.updateProblem
);

router.delete(
  '/problems/:id',
  requireAdmin,
  validateProblemId,
  logAction('delete'),
  problemController.deleteProblem
);

// 테스트 케이스 관리
router.get('/problems/:id/test-cases', validateProblemId, testCaseController.getTestCases);

router.post(
  '/problems/:id/test-cases',
  requireAdmin,
  validateCreateTestCase,
  logAction('create'),
  testCaseController.createTestCase
);

router.put(
  '/problems/:id/test-cases/:testCaseId',
  requireAdmin,
  validateUpdateTestCase,
  logAction('update'),
  testCaseController.updateTestCase
);

router.delete(
  '/problems/:id/test-cases/:testCaseId',
  requireAdmin,
  validateTestCaseId,
  logAction('delete'),
  testCaseController.deleteTestCase
);

export default router;
