import { body, validationResult } from 'express-validator';
import { ValidationError } from '../../../shared/errors/AppError.js';
import { validatePasswordStrength } from '../utils/password.js';

// 필드 검증 실패 시 공통 처리
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

// 회원가입 유효성 검증
export const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('아이디는 4-20자 이어야 합니다.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다.'),

  body('password')
    .isLength({ min: 8, max: 50 })
    .withMessage('비밀번호는 8-50자이어야 합니다.')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('military_number')
    .trim()
    .matches(/^[A-Za-z0-9-]{5,20}$/)
    .withMessage('군번은 5-20자의 영문/숫자/하이픈 조합이어야 합니다.'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('이름은 2-20자이어야 합니다.'),

  body('rank')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('계급은 50자 이하로 입력해주세요.'),

  handleValidationErrors,
];

// 로그인 유효성 검증
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

// 비밀번호 찾기(재설정) 유효성 검증
export const validatePasswordReset = [
  body('military_number')
    .trim()
    .matches(/^[A-Za-z0-9-]{5,20}$/)
    .withMessage('군번은 5-20자의 영문/숫자/하이픈 조합이어야 합니다.'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해주세요.'),

  body('new_password')
    .isLength({ min: 8, max: 50 })
    .withMessage('비밀번호는 8-50자이어야 합니다.')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  handleValidationErrors,
];

// 비밀번호 변경 유효성 검증
export const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('현재 비밀번호를 입력해주세요.'),

  body('new_password')
    .isLength({ min: 8, max: 50 })
    .withMessage('새 비밀번호는 8-50자이어야 합니다.')
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
