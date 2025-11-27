import express from 'express';
import { authenticate, adminOnly } from '../../../middleware/authMiddleware.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';
import * as sessionController from '../controllers/sessionController.js';
import * as sessionAssignController from '../controllers/sessionAssignController.js';
import * as scoreboardController from '../controllers/scoreboardController.js';
import {
  validateGetSessions,
  validateSessionId,
  validateCreateSession,
  validateUpdateSession,
  validateUpdateSessionStatus,
  validateAssignStudents,
  validateRemoveStudent,
  validateAssignProblems,
  validateRemoveProblem,
} from '../validators/sessionValidator.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 세션 기본 CRUD
router.get('/', validateGetSessions, sessionController.getSessions);
router.get('/:id', validateSessionId, sessionController.getSession);
router.post('/', adminOnly, validateCreateSession, logAction('create'), sessionController.createSession);
router.put('/:id', adminOnly, validateUpdateSession, logAction('update'), sessionController.updateSession);
router.delete('/:id', adminOnly, validateSessionId, logAction('delete'), sessionController.deleteSession);

// 세션 상태 관리
router.put('/:id/status', adminOnly, validateUpdateSessionStatus, logAction('update'), sessionController.updateSessionStatus);
router.delete('/:id/reset', adminOnly, validateSessionId, logAction('delete'), sessionController.resetSession);

// 학생 관리
router.get('/:id/students', validateSessionId, sessionAssignController.getSessionStudents);
router.post('/:id/students', adminOnly, validateAssignStudents, logAction('update'), sessionAssignController.assignStudents);
router.delete('/:id/students/:studentId', adminOnly, validateRemoveStudent, logAction('delete'), sessionAssignController.removeStudent);

// 문제 관리
router.get('/:id/problems', validateSessionId, sessionAssignController.getSessionProblems);
router.post('/:id/problems', adminOnly, validateAssignProblems, logAction('update'), sessionAssignController.assignProblems);
router.delete('/:id/problems/:problemId', adminOnly, validateRemoveProblem, logAction('delete'), sessionAssignController.removeProblem);

// 스코어보드
router.get('/:id/scoreboard', validateSessionId, scoreboardController.getScoreboard);
router.put('/:id/scoreboard', adminOnly, validateSessionId, scoreboardController.updateScoreboard);

export default router;
