import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../../../shared/errors/AppError.js';

/**
 * 검증 에러 공통 처리
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    throw new ValidationError('입력값 검증에 실패했습니다.', formattedErrors);
  }
  next();
};

/**
 * 제출 목록 조회 검증
 */
export const validateGetSubmissions = [
  query('studentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 학생 ID를 입력해주세요.'),

  query('problemId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  query('sessionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  query('status')
    .optional()
    .isIn(['pending', 'judging', 'AC', 'WA', 'TLE', 'RE', 'SE', 'MLE', 'cancelled'])
    .withMessage('유효한 제출 상태를 입력해주세요.'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상이어야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1-100 사이여야 합니다.'),

  handleValidationErrors,
];

/**
 * 제출 ID 파라미터 검증
 */
export const validateSubmissionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 제출 ID를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 코드 제출 검증
 */
export const validateCreateSubmission = [
  body('problemId')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  body('code')
    .optional()
    .isString()
    .withMessage('코드는 문자열이어야 합니다.')
    .isLength({ min: 1, max: 65536 })
    .withMessage('코드는 1-65536자 사이여야 합니다.'),

  body('pythonVersion')
    .optional()
    .isIn(['3.8', '3.9', '3.10', '3.11', '3.12'])
    .withMessage('Python 버전은 3.8, 3.9, 3.10, 3.11, 3.12 중 하나여야 합니다.'),

  body('sessionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  // file은 multer에서 처리하므로 여기서는 검증하지 않음

  handleValidationErrors,
];
