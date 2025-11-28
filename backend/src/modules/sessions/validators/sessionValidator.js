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
 * 세션 목록 조회 검증
 */
export const validateGetSessions = [
  query('status')
    .optional()
    .isIn(['scheduled', 'active', 'ended', 'cancelled'])
    .withMessage('유효한 세션 상태를 입력해주세요.'),

  query('type')
    .optional()
    .isIn(['regular', 'exam', 'practice'])
    .withMessage('유효한 세션 타입을 입력해주세요.'),

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
 * 세션 ID 파라미터 검증
 */
export const validateSessionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 세션 생성 검증
 */
export const validateCreateSession = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('세션 이름은 2-100자이어야 합니다.'),

  body('startTime')
    .isISO8601()
    .withMessage('유효한 시작 시각을 입력해주세요. (ISO 8601 형식)'),

  body('endTime')
    .isISO8601()
    .withMessage('유효한 종료 시각을 입력해주세요. (ISO 8601 형식)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('종료 시각은 시작 시각보다 늦어야 합니다.');
      }
      return true;
    }),

  body('sessionType')
    .isIn(['regular', 'exam', 'practice'])
    .withMessage('세션 타입은 regular, exam, practice 중 하나여야 합니다.'),

  body('allowResubmit')
    .optional()
    .isBoolean()
    .withMessage('재제출 허용 여부는 true 또는 false여야 합니다.'),

  handleValidationErrors,
];

/**
 * 세션 수정 검증
 */
export const validateUpdateSession = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('세션 이름은 2-100자이어야 합니다.'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('유효한 시작 시각을 입력해주세요. (ISO 8601 형식)'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('유효한 종료 시각을 입력해주세요. (ISO 8601 형식)'),

  body('sessionType')
    .optional()
    .isIn(['regular', 'exam', 'practice'])
    .withMessage('세션 타입은 regular, exam, practice 중 하나여야 합니다.'),

  body('allowResubmit')
    .optional()
    .isBoolean()
    .withMessage('재제출 허용 여부는 true 또는 false여야 합니다.'),

  handleValidationErrors,
];

/**
 * 세션 상태 변경 검증
 */
export const validateUpdateSessionStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  body('status')
    .isIn(['scheduled', 'active', 'ended', 'cancelled'])
    .withMessage('세션 상태는 scheduled, active, ended, cancelled 중 하나여야 합니다.'),

  handleValidationErrors,
];

/**
 * 학생 할당 검증
 */
export const validateAssignStudents = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  body('studentIds')
    .isArray({ min: 1 })
    .withMessage('학생 ID 배열을 입력해주세요. (최소 1개)')
    .custom((value) => {
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error('모든 학생 ID는 양의 정수여야 합니다.');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * 학생 제거 검증
 */
export const validateRemoveStudent = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  param('studentId')
    .isInt({ min: 1 })
    .withMessage('유효한 학생 ID를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 문제 할당 검증
 */
export const validateAssignProblems = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  body('problems')
    .isArray({ min: 1 })
    .withMessage('문제 배열을 입력해주세요. (최소 1개)')
    .custom((value) => {
      if (!value.every((problem) => {
        return problem &&
               typeof problem === 'object' &&
               Number.isInteger(problem.problemId) &&
               problem.problemId > 0 &&
               problem.order !== undefined &&
               Number.isInteger(problem.order) &&
               problem.order >= 0;
      })) {
        throw new Error('각 문제는 { problemId: number, order: number } 형식이어야 합니다.');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * 문제 제거 검증
 */
export const validateRemoveProblem = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 세션 ID를 입력해주세요.'),

  param('problemId')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  handleValidationErrors,
];
