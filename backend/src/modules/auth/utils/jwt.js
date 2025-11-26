import jwt from 'jsonwebtoken';
import { config } from '../../../config/env.js';
import AppError from '../../../shared/errors/AppError.js';

/**
 * JWT 토큰 생성
 * @param {Object} user - 사용자 정보
 * @param {string} role - 사용자 역할 (student, admin, super_admin)
 * @returns {string} JWT 토큰
 */
export const generateToken = (user, role) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: role,
    military_number: user.military_number,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'python-judge',
  });
};

/**
 * JWT 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {Object} 디코딩된 토큰 페이로드
 * @throws {AppError} 토큰이 유효하지 않은 경우
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'python-judge',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('토큰이 만료되었습니다. 다시 로그인해주세요.', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('유효하지 않은 토큰입니다.', 401, 'INVALID_TOKEN');
    }
    throw new AppError('토큰 검증에 실패했습니다.', 401, 'TOKEN_VERIFICATION_FAILED');
  }
};

/**
 * JWT 토큰 갱신
 * @param {string} token - 기존 JWT 토큰
 * @returns {string} 새로운 JWT 토큰
 * @throws {AppError} 토큰 갱신 실패 시
 */
export const refreshToken = (token) => {
  try {
    // 만료된 토큰도 디코딩할 수 있도록 ignoreExpiration 옵션 사용
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'python-judge',
      ignoreExpiration: true,
    });

    // 토큰이 너무 오래된 경우 (7일 이상) 갱신 불가
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = 7 * 24 * 60 * 60; // 7일
    if (tokenAge > maxTokenAge) {
      throw new AppError('토큰이 너무 오래되었습니다. 다시 로그인해주세요.', 401, 'TOKEN_TOO_OLD');
    }

    // 새 토큰 생성
    const payload = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      military_number: decoded.military_number,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'python-judge',
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('토큰 갱신에 실패했습니다.', 401, 'TOKEN_REFRESH_FAILED');
  }
};
