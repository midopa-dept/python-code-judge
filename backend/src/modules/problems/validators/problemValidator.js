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
 * 문제 목록 조회 검증
 */
export const validateGetProblems = [
  query('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('카테고리는 비어 있을 수 없습니다.')
    .isIn(['입출력', '조건문', '반복문', '리스트', '문자열', '함수', '재귀', '정렬', '탐색', '동적계획법', '기타'])
    .withMessage('유효한 카테고리를 선택해주세요.'),

  query('difficulty')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('난이도는 1-5 사이여야 합니다.'),

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
    .isLength({ max: 200 })
    .withMessage('검색어는 최대 200자까지 입력할 수 있습니다.'),

  handleValidationErrors,
];

/**
 * 문제 ID 파라미터 검증
 */
export const validateProblemId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 문제 생성 검증
 */
export const validateCreateProblem = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('제목은 5-200자이어야 합니다.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('문제 설명을 입력해주세요.')
    .isLength({ max: 10000 })
    .withMessage('문제 설명은 최대 10000자까지 입력할 수 있습니다.'),

  body('category')
    .isIn(['입출력', '조건문', '반복문', '리스트', '문자열', '함수', '재귀', '정렬', '탐색', '동적계획법', '기타'])
    .withMessage('유효한 카테고리를 선택해주세요.'),

  body('difficulty')
    .isInt({ min: 1, max: 5 })
    .withMessage('난이도는 1-5 사이여야 합니다.'),

  body('timeLimit')
    .isInt({ min: 1, max: 10 })
    .withMessage('시간 제한은 1-10초 사이여야 합니다.'),

  body('memoryLimit')
    .optional()
    .isInt({ min: 1, max: 1024 })
    .withMessage('메모리 제한은 1-1024MB 사이여야 합니다.'),

  body('visibility')
    .optional()
    .isIn(['public', 'private', 'draft'])
    .withMessage('공개 상태는 public, private, draft 중 하나여야 합니다.'),

  body('judgeConfig')
    .optional()
    .isObject()
    .withMessage('채점 설정은 객체 형식이어야 합니다.'),

  handleValidationErrors,
];

/**
 * 문제 수정 검증
 */
export const validateUpdateProblem = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('제목은 5-200자이어야 합니다.'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('문제 설명은 비어 있을 수 없습니다.')
    .isLength({ max: 10000 })
    .withMessage('문제 설명은 최대 10000자까지 입력할 수 있습니다.'),

  body('category')
    .optional()
    .isIn(['입출력', '조건문', '반복문', '리스트', '문자열', '함수', '재귀', '정렬', '탐색', '동적계획법', '기타'])
    .withMessage('유효한 카테고리를 선택해주세요.'),

  body('difficulty')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('난이도는 1-5 사이여야 합니다.'),

  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('시간 제한은 1-10초 사이여야 합니다.'),

  body('memoryLimit')
    .optional()
    .isInt({ min: 1, max: 1024 })
    .withMessage('메모리 제한은 1-1024MB 사이여야 합니다.'),

  body('visibility')
    .optional()
    .isIn(['public', 'private', 'draft'])
    .withMessage('공개 상태는 public, private, draft 중 하나여야 합니다.'),

  body('judgeConfig')
    .optional()
    .isObject()
    .withMessage('채점 설정은 객체 형식이어야 합니다.'),

  handleValidationErrors,
];

/**
 * 테스트 케이스 생성 검증
 */
export const validateCreateTestCase = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  body('inputData')
    .isString()
    .withMessage('입력 데이터는 문자열이어야 합니다.')
    .isLength({ max: 10000 })
    .withMessage('입력 데이터는 최대 10000자까지 입력할 수 있습니다.'),

  body('expectedOutput')
    .isString()
    .withMessage('예상 출력은 문자열이어야 합니다.')
    .isLength({ max: 10000 })
    .withMessage('예상 출력은 최대 10000자까지 입력할 수 있습니다.'),

  body('isPublic')
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다.'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('순서는 0 이상의 정수여야 합니다.'),

  handleValidationErrors,
];

/**
 * 테스트 케이스 수정 검증
 */
export const validateUpdateTestCase = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  param('testCaseId')
    .isInt({ min: 1 })
    .withMessage('유효한 테스트 케이스 ID를 입력해주세요.'),

  body('inputData')
    .optional()
    .isString()
    .withMessage('입력 데이터는 문자열이어야 합니다.')
    .isLength({ max: 10000 })
    .withMessage('입력 데이터는 최대 10000자까지 입력할 수 있습니다.'),

  body('expectedOutput')
    .optional()
    .isString()
    .withMessage('예상 출력은 문자열이어야 합니다.')
    .isLength({ max: 10000 })
    .withMessage('예상 출력은 최대 10000자까지 입력할 수 있습니다.'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('공개 여부는 true 또는 false여야 합니다.'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('순서는 0 이상의 정수여야 합니다.'),

  handleValidationErrors,
];

/**
 * 테스트 케이스 ID 파라미터 검증
 */
export const validateTestCaseId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('유효한 문제 ID를 입력해주세요.'),

  param('testCaseId')
    .isInt({ min: 1 })
    .withMessage('유효한 테스트 케이스 ID를 입력해주세요.'),

  handleValidationErrors,
];
