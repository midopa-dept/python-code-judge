import express from 'express';
import multer from 'multer';
import { submissionController } from '../controllers/submissionController.js';
import { authenticate, requireRole } from '../../../shared/middleware/auth.js';
import { logAction } from '../../audit/middleware/auditMiddleware.js';
import AppError from '../../../shared/errors/AppError.js';
import { MAX_CODE_BYTES } from '../services/submissionService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CODE_BYTES },
});

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('파일 크기가 64KB를 초과했습니다.', 413, 'CODE_SIZE_EXCEEDED'));
    }

    if (err instanceof multer.MulterError) {
      return next(new AppError('파일 업로드 처리 중 오류가 발생했습니다.', 400, 'UPLOAD_ERROR'));
    }

    return next(err);
  });
};

// 모든 요청에 인증 적용
router.use(authenticate);

// 학생만 제출 가능
router.post(
  '/submissions',
  requireRole('student'),
  handleUpload,
  logAction('submit'),
  submissionController.createSubmission
);

export default router;
