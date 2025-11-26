import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../config/database.js';

/**
 * JWT 토큰 검증 미들웨어
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '인증 토큰이 필요합니다',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      // 통합 users 테이블에서 사용자 정보 조회
      const result = await query(
        'SELECT id, login_id, name, email, role, account_status FROM users WHERE id = $1',
        [decoded.id]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: '사용자를 찾을 수 없습니다',
        });
      }

      if (user.account_status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '계정이 비활성화되었습니다',
        });
      }

      // 요청 객체에 사용자 정보 추가
      req.user = {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '유효하지 않은 토큰입니다',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * @param {Array<string>} allowedRoles - 허용된 역할 목록
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '인증이 필요합니다',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '접근 권한이 없습니다',
      });
    }

    next();
  };
};

/**
 * 관리자 전용 미들웨어 (admin, super_admin)
 */
export const adminOnly = authorize('admin', 'super_admin');

/**
 * 최고관리자 전용 미들웨어 (super_admin)
 */
export const superAdminOnly = authorize('super_admin');
