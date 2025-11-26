import { body, validationResult } from 'express-validator';
import { ValidationError } from '../../../shared/errors/AppError.js';
import { validatePasswordStrength } from '../utils/password.js';

/**
 * 유효성 검사 결과 처리 미들웨어
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    throw new ValidationError('입력값 유효성 검사 실패', formattedErrors);
  }
  next();
};

/**
 * 회원가입 유효성 검사
 */
export const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('아이디는 4-20자 사이여야 합니다.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('아이디는 영문, 숫자, 언더스코어만 사용 가능합니다.'),

  body('password')
    .isLength({ min: 8, max: 50 })
    .withMessage('비밀번호는 8-50자 사이여야 합니다.')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('military_number')
    .trim()
    .matches(/^\d{2}-\d{8}$/)
    .withMessage('군번 형식이 올바르지 않습니다. (예: 24-12345678)'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('이름은 2-20자 사이여야 합니다.'),

  body('rank')
    .trim()
    .notEmpty()
    .withMessage('계급을 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 로그인 유효성 검사
 */
export const validateLogin = [
  body('loginId')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해주세요.'),

  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.'),

  handleValidationErrors,
];

/**
 * 비밀번호 재설정 유효성 검사
 */
export const validatePasswordReset = [
  body('military_number')
    .trim()
    .matches(/^\d{2}-\d{8}$/)
    .withMessage('군번 형식이 올바르지 않습니다.'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해주세요.'),

  body('new_password')
    .isLength({ min: 8, max: 50 })
    .withMessage('비밀번호는 8-50자 사이여야 합니다.')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * 비밀번호 변경 유효성 검사
 */
export const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('현재 비밀번호를 입력해주세요.'),

  body('new_password')
    .isLength({ min: 8, max: 50 })
    .withMessage('새 비밀번호는 8-50자 사이여야 합니다.')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      }
      return true;
    }),

  handleValidationErrors,
];
