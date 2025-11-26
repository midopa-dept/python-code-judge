import { query } from '../../../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import AppError, { UnauthorizedError, ValidationError, ConflictError } from '../../../shared/errors/AppError.js';

export const authService = {
  // 회원가입 (학생 전용)
  async signup(username, password, military_number, name, rank) {
    // 중복 검사 - login_id
    const duplicateLoginQuery = `
      SELECT id FROM users WHERE login_id = $1
    `;
    const duplicateLoginResult = await query(duplicateLoginQuery, [username]);

    if (duplicateLoginResult.rows.length > 0) {
      throw new ConflictError('이미 사용 중인 아이디입니다.');
    }

    // 중복 검사 - military_id
    const duplicateMilitaryQuery = `
      SELECT id FROM users WHERE military_id = $1
    `;
    const duplicateMilitaryResult = await query(duplicateMilitaryQuery, [military_number]);

    if (duplicateMilitaryResult.rows.length > 0) {
      throw new ConflictError('이미 등록된 군번입니다.');
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    // 학생 계정 생성
    const insertQuery = `
      INSERT INTO users (military_id, login_id, name, password_hash, group_info, role, account_status)
      VALUES ($1, $2, $3, $4, $5, 'student', 'active')
      RETURNING id, login_id, name, military_id, role, created_at
    `;

    const result = await query(insertQuery, [
      military_number,
      username,
      name,
      passwordHash,
      rank, // group_info에 계급 저장
    ]);

    const newUser = result.rows[0];

    // JWT 토큰 생성
    const token = generateToken(
      {
        id: newUser.id,
        username: newUser.login_id,
        military_number: newUser.military_id,
      },
      'student'
    );

    return {
      token,
      user: {
        id: newUser.id,
        loginId: newUser.login_id,
        name: newUser.name,
        militaryNumber: newUser.military_id,
        role: newUser.role,
      },
    };
  },

  // 로그인 (학생/관리자 통합)
  async login(loginId, password) {
    // 사용자 조회
    const userQuery = `
      SELECT id, login_id, name, password_hash, role, account_status, military_id
      FROM users
      WHERE login_id = $1
    `;

    const result = await query(userQuery, [loginId]);

    if (result.rows.length === 0) {
      throw new UnauthorizedError('로그인 ID 또는 비밀번호가 잘못되었습니다.');
    }

    const user = result.rows[0];

    // 계정 상태 확인
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('정지되었거나 삭제된 계정입니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('로그인 ID 또는 비밀번호가 잘못되었습니다.');
    }

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // JWT 토큰 생성
    const token = generateToken(
      {
        id: user.id,
        username: user.login_id,
        military_number: user.military_id,
      },
      user.role
    );

    return {
      token,
      user: {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
        role: user.role,
        militaryNumber: user.military_id,
      },
    };
  },

  // 비밀번호 찾기 (재설정)
  async resetPassword(military_number, username, new_password) {
    // 사용자 조회 (군번 + 아이디로 본인 확인)
    const userQuery = `
      SELECT id, login_id, name, account_status
      FROM users
      WHERE military_id = $1 AND login_id = $2
    `;

    const result = await query(userQuery, [military_number, username]);

    if (result.rows.length === 0) {
      throw new ValidationError('군번 또는 아이디가 일치하지 않습니다.');
    }

    const user = result.rows[0];

    // 계정 상태 확인
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('정지되었거나 삭제된 계정입니다.');
    }

    // 새 비밀번호 해싱
    const passwordHash = await hashPassword(new_password);

    // 비밀번호 업데이트
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, user.id]
    );

    return {
      message: '비밀번호가 성공적으로 재설정되었습니다.',
      user: {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
      },
    };
  },

  // 비밀번호 변경 (로그인 상태)
  async changePassword(userId, current_password, new_password) {
    // 사용자 조회
    const userQuery = `
      SELECT id, login_id, password_hash, account_status
      FROM users
      WHERE id = $1
    `;

    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    // 계정 상태 확인
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('정지되었거나 삭제된 계정입니다.');
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await comparePassword(current_password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
    }

    // 새 비밀번호 해싱
    const passwordHash = await hashPassword(new_password);

    // 비밀번호 업데이트
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, user.id]
    );

    return {
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  },
};
