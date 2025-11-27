import { authService } from '../services/authService.js';

export const authController = {
  // POST /api/auth/signup - 학생 회원가입
  async signup(req, res, next) {
    try {
      const { username, password, military_number, name, rank } = req.body;

      const result = await authService.signup(
        username,
        password,
        military_number,
        name,
        rank
      );

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/login - 로그인 (학생/관리자 통합)
  async login(req, res, next) {
    try {
      const { loginId, password } = req.body;

      const result = await authService.login(loginId, password);

      res.status(200).json({
        success: true,
        message: '로그인에 성공했습니다.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/reset-password - 비밀번호 찾기
  async resetPassword(req, res, next) {
    try {
      const { username, new_password, military_number } = req.body;

      const result = await authService.resetPassword(
        username,
        new_password,
        military_number
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/change-password - 비밀번호 변경 (로그인 필요)
  async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id; // authenticate 미들웨어에서 설정

      const result = await authService.changePassword(
        userId,
        current_password,
        new_password
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/me - 현재 로그인한 사용자 정보 조회
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id; // authenticate 미들웨어에서 설정

      const user = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
