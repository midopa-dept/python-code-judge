import express from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../../../middleware/authMiddleware.js';
import {
  validateGetStudents,
  validateStudentId,
  validateUpdateStudent,
} from '../validators/userValidator.js';

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// GET /api/users/students - 학생 목록 조회 (관리자 전용)
router.get(
  '/students',
  requireAdmin,
  validateGetStudents,
  userController.getStudents
);

// GET /api/users/students/:id - 학생 상세 조회 (본인 또는 관리자)
router.get('/students/:id', validateStudentId, userController.getStudent);

// PATCH /api/users/students/:id - 학생 정보 수정 (관리자 전용)
router.patch(
  '/students/:id',
  requireAdmin,
  validateUpdateStudent,
  userController.updateStudent
);

// DELETE /api/users/students/:id - 학생 삭제 (관리자 전용)
router.delete(
  '/students/:id',
  requireAdmin,
  validateStudentId,
  userController.deleteStudent
);

export default router;
