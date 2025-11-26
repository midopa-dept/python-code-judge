import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { query } from '../../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.',
        errorCode: 'NO_TOKEN',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      // 사용자 정보 조회
      const userQuery = `
        SELECT id, login_id, name, role, account_status
        FROM users
        WHERE id = $1
      `;
      const result = await query(userQuery, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 사용자입니다.',
          errorCode: 'INVALID_USER',
        });
      }

      const user = result.rows[0];

      if (user.account_status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '정지되었거나 삭제된 계정입니다.',
          errorCode: 'ACCOUNT_DISABLED',
        });
      }

      // 요청 객체에 사용자 정보 추가
      req.user = {
        id: parseInt(user.id, 10), // 숫자로 변환
        loginId: user.login_id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '토큰이 만료되었습니다.',
          errorCode: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        errorCode: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.',
      errorCode: 'AUTH_ERROR',
    });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
        errorCode: 'AUTHENTICATION_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '이 작업을 수행할 권한이 없습니다.',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};
