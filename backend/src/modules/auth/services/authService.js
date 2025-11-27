import { query } from '../../../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import AppError, { UnauthorizedError, ValidationError, ConflictError } from '../../../shared/errors/AppError.js';

export const authService = {
  // 학생 회원가입
  async signup(username, password, military_number, name, rank) {
    const duplicateLoginQuery = `
      SELECT id FROM users WHERE login_id = $1
    `;
    const duplicateLoginResult = await query(duplicateLoginQuery, [username]);
    if (duplicateLoginResult.rows.length > 0) {
      throw new ConflictError('이미 사용 중인 아이디입니다.');
    }

    const duplicateMilitaryQuery = `
      SELECT id FROM users WHERE military_id = $1
    `;
    const duplicateMilitaryResult = await query(duplicateMilitaryQuery, [military_number]);
    if (duplicateMilitaryResult.rows.length > 0) {
      throw new ConflictError('이미 등록된 군번입니다.');
    }

    const passwordHash = await hashPassword(password);

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
      rank || null,
    ]);

    const newUser = result.rows[0];

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

  // 로그인(학생/관리자 공용)
  async login(loginId, password) {
    const userQuery = `
      SELECT id, login_id, name, password_hash, role, account_status, military_id
      FROM users
      WHERE login_id = $1
    `;

    const result = await query(userQuery, [loginId]);
    if (result.rows.length === 0) {
      throw new UnauthorizedError('로그인ID 또는 비밀번호가 틀렸습니다.');
    }

    const user = result.rows[0];
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('휴면이거나 정지된 계정입니다.');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('로그인ID 또는 비밀번호가 틀렸습니다.');
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

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

  // 비밀번호 찾기(재설정)
  async resetPassword(military_number, username, new_password) {
    const userQuery = `
      SELECT id, login_id, name, account_status
      FROM users
      WHERE military_id = $1 AND login_id = $2
    `;

    const result = await query(userQuery, [military_number, username]);
    if (result.rows.length === 0) {
      throw new ValidationError('군번 또는 아이디가 올바르지 않습니다.');
    }

    const user = result.rows[0];
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('휴면이거나 정지된 계정입니다.');
    }

    const passwordHash = await hashPassword(new_password);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, user.id]);

    return {
      message: '비밀번호가 재설정되었습니다.',
      user: {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
      },
    };
  },

  // 비밀번호 변경(로그인 상태)
  async changePassword(userId, current_password, new_password) {
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
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('휴면이거나 정지된 계정입니다.');
    }

    const isPasswordValid = await comparePassword(current_password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
    }

    const passwordHash = await hashPassword(new_password);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, user.id]);

    return { message: '비밀번호가 변경되었습니다.' };
  },
};
