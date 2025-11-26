import { verifyToken } from '../utils/jwt.js';
import AppError from '../../../shared/errors/AppError.js';

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 토큰을 추출하고 검증합니다.
 */
export const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('인증 토큰이 필요합니다.', 401, 'TOKEN_REQUIRED');
    }

    // 토큰 추출
    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = verifyToken(token);

    // 요청 객체에 사용자 정보 추가
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      military_number: decoded.military_number,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('인증에 실패했습니다.', 401, 'AUTHENTICATION_FAILED'));
    }
  }
};

/**
 * 역할 기반 접근 제어 (RBAC) 미들웨어
 * @param {Array<string>} allowedRoles - 허용된 역할 목록
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('인증이 필요합니다.', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          '이 작업을 수행할 권한이 없습니다.',
          403,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
};

/**
 * 학생 전용 접근 제어
 */
export const requireStudent = (req, res, next) => {
  return requireRole(['student', 'admin', 'super_admin'])(req, res, next);
};

/**
 * 관리자 전용 접근 제어
 */
export const requireAdmin = (req, res, next) => {
  return requireRole(['admin', 'super_admin'])(req, res, next);
};

/**
 * 최고관리자 전용 접근 제어
 */
export const requireSuperAdmin = (req, res, next) => {
  return requireRole(['super_admin'])(req, res, next);
};
