import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// 비밀번호 해시 생성
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// 비밀번호 비교
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// 비밀번호 강도 검증: 길이만 체크(8-100자)
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8 || password.length > 100) {
    return {
      isValid: false,
      message: "비밀번호는 8-100자 사이여야 합니다.",
    };
  }

  return {
    isValid: true,
    message: "안전한 비밀번호입니다.",
  };
};
