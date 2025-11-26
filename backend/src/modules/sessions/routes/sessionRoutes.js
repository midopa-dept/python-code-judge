import express from 'express';
import { authenticate, adminOnly } from '../../../middleware/authMiddleware.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';
import * as sessionController from '../controllers/sessionController.js';
import * as sessionAssignController from '../controllers/sessionAssignController.js';
import * as scoreboardController from '../controllers/scoreboardController.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 세션 기본 CRUD
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSession);
router.post('/', adminOnly, logAction('create'), sessionController.createSession);
router.put('/:id', adminOnly, logAction('update'), sessionController.updateSession);
router.delete('/:id', adminOnly, logAction('delete'), sessionController.deleteSession);

// 세션 상태 관리
router.put('/:id/status', adminOnly, logAction('update'), sessionController.updateSessionStatus);
router.delete('/:id/reset', adminOnly, logAction('delete'), sessionController.resetSession);

// 학생 관리
router.get('/:id/students', sessionAssignController.getSessionStudents);
router.post('/:id/students', adminOnly, logAction('update'), sessionAssignController.assignStudents);
router.delete('/:id/students/:studentId', adminOnly, logAction('delete'), sessionAssignController.removeStudent);

// 문제 관리
router.get('/:id/problems', sessionAssignController.getSessionProblems);
router.post('/:id/problems', adminOnly, logAction('update'), sessionAssignController.assignProblems);
router.delete('/:id/problems/:problemId', adminOnly, logAction('delete'), sessionAssignController.removeProblem);

// 스코어보드
router.get('/:id/scoreboard', scoreboardController.getScoreboard);
router.put('/:id/scoreboard', adminOnly, scoreboardController.updateScoreboard);

export default router;
