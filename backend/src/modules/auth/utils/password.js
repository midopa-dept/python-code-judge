import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} 해시된 비밀번호
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 비밀번호 검증
 * @param {string} password - 입력된 평문 비밀번호
 * @param {string} hashedPassword - 저장된 해시 비밀번호
 * @returns {Promise<boolean>} 비밀번호 일치 여부
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 비밀번호 강도 검증
 * - 최소 8자 이상
 * - 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: '비밀번호는 최소 8자 이상이어야 합니다.',
    };
  }

  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (passedChecks < 3) {
    return {
      isValid: false,
      message: '비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합해야 합니다.',
    };
  }

  return {
    isValid: true,
    message: '안전한 비밀번호입니다.',
  };
};
