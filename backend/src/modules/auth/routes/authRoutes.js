import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  validateSignup,
  validateLogin,
  validatePasswordReset,
  validatePasswordChange,
} from '../validators/authValidator.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';

const router = express.Router();

// POST /api/auth/signup - 학생 회원가입
router.post('/signup', validateSignup, logAction('signup'), authController.signup);

// POST /api/auth/login - 로그인 (학생/관리자)
router.post('/login', validateLogin, logAction('login'), authController.login);

// POST /api/auth/reset-password - 비밀번호 찾기
router.post('/reset-password', validatePasswordReset, logAction('reset_password'), authController.resetPassword);

// PUT /api/auth/change-password - 비밀번호 변경 (인증 필요)
router.put('/change-password', authenticate, validatePasswordChange, logAction('change_password'), authController.changePassword);

export default router;
