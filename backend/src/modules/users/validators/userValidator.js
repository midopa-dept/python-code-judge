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
 * 학생 목록 조회 검증
 */
export const validateGetStudents = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상이어야 합니다.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1-100 사이여야 합니다.'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('검색어는 최대 50자까지 입력할 수 있습니다.'),

  query('group')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('그룹 필터는 비어 있을 수 없습니다.'),

  handleValidationErrors,
];

/**
 * 학생 ID 파라미터 검증
 */
export const validateStudentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 학생 ID를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 학생 정보 수정 검증
 */
export const validateUpdateStudent = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 학생 ID를 입력해주세요.'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2-50자이어야 합니다.'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
    .isLength({ max: 100 })
    .withMessage('이메일은 최대 100자까지 입력할 수 있습니다.'),

  body('groupInfo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('그룹 정보는 최대 50자까지 입력할 수 있습니다.'),

  body('accountStatus')
    .optional()
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('계정 상태는 active, suspended, deleted 중 하나여야 합니다.'),

  handleValidationErrors,
];
