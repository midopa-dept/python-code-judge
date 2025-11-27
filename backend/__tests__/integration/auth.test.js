import request from 'supertest';
import app from '../../src/app.js';
import { getPool, closePool } from '../../src/config/database.js';

describe('인증 API 통합 테스트', () => {
  let pool;
  let testUserIds = [];

  beforeAll(async () => {
    pool = getPool();
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    for (const userId of testUserIds) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await closePool();
  });

  describe('POST /api/auth/signup - 학생 회원가입', () => {
    test('유효한 정보로 회원가입 성공 (201)', async () => {
      const timestamp = Date.now();
      const uniqueUsername = `test${timestamp.toString().slice(-10)}`;
      const uniqueMilNum = `24-${timestamp.toString().slice(-8)}`;

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: uniqueUsername,
          password: 'Test1234!@',
          military_number: uniqueMilNum,
          name: '테스트학생',
          rank: '병장',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('회원가입');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('loginId', uniqueUsername);

      testUserIds.push(parseInt(response.body.data.user.id));
    });

    test('필수 필드 누락 시 실패 (400)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'incomplete_user',
          password: 'Test1234!',
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });

    test('중복된 아이디로 회원가입 실패 (400 or 409)', async () => {
      const timestamp = Date.now();
      const existingUsername = `exist${timestamp.toString().slice(-10)}`;
      const militaryNum1 = `24-${Date.now().toString().slice(-8)}`;
      const militaryNum2 = `24-${(Date.now() + 1).toString().slice(-8)}`;

      // 첫 번째 사용자 생성
      const firstResponse = await request(app).post('/api/auth/signup').send({
        username: existingUsername,
        password: 'Test1234!@',
        military_number: militaryNum1,
        name: '테스트1',
        rank: '병장',
      });

      testUserIds.push(parseInt(firstResponse.body.data.user.id));

      // 같은 username으로 재가입 시도
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: existingUsername,
          password: 'Test5678!@',
          military_number: militaryNum2,
          name: '테스트2',
          rank: '병장',
        });

      expect([400, 409]).toContain(response.status);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });

    test('중복된 군번으로 회원가입 실패 (409)', async () => {
      const timestamp = Date.now();
      const username1 = `user1${timestamp.toString().slice(-11)}`;
      const username2 = `user2${timestamp.toString().slice(-11)}`;
      const sameMilNum = `24-${Date.now().toString().slice(-8)}`;

      // 첫 번째 사용자 생성
      const firstResponse = await request(app).post('/api/auth/signup').send({
        username: username1,
        password: 'Test1234!@',
        military_number: sameMilNum,
        name: '테스트1',
        rank: '병장',
      });

      testUserIds.push(parseInt(firstResponse.body.data.user.id));

      // 같은 군번으로 재가입 시도
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: username2,
          password: 'Test5678!@',
          military_number: sameMilNum,
          name: '테스트2',
          rank: '병장',
        })
        .expect(409);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login - 로그인', () => {
    const timestamp = Date.now();
    const loginUsername = `login${timestamp.toString().slice(-11)}`;
    const loginPassword = 'Login1234!@';
    const loginMilNum = `24-${timestamp.toString().slice(-8)}`;
    let authToken;

    beforeAll(async () => {
      // 테스트용 사용자 생성
      const response = await request(app).post('/api/auth/signup').send({
        username: loginUsername,
        password: loginPassword,
        military_number: loginMilNum,
        name: '로그인테스트',
        rank: '병장',
      });
      testUserIds.push(parseInt(response.body.data.user.id));
    });

    test('유효한 자격증명으로 로그인 성공 (200)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: loginUsername,
          password: loginPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.username).toBe(loginUsername);

      authToken = response.body.data.token;
    });

    test('잘못된 비밀번호로 로그인 실패 (401)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: loginUsername,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('존재하지 않는 사용자로 로그인 실패 (401)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: 'nonexistent_user',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('필수 필드 누락 시 실패 (400)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: loginUsername,
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/reset-password - 비밀번호 찾기', () => {
    const timestamp2 = Date.now() + 1000;
    const resetUsername = `reset${timestamp2.toString().slice(-11)}`;
    const resetPassword = 'Reset1234!@';
    const resetMilNum = `24-${timestamp2.toString().slice(-8)}`;

    beforeAll(async () => {
      // 테스트용 사용자 생성
      const response = await request(app).post('/api/auth/signup').send({
        username: resetUsername,
        password: resetPassword,
        military_number: resetMilNum,
        name: '리셋테스트',
        rank: '병장',
      });
      testUserIds.push(parseInt(response.body.data.user.id));
    });

    test('유효한 정보로 비밀번호 재설정 성공 (200)', async () => {
      const newPassword = 'NewPassword123!@';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          military_number: resetMilNum,
          username: resetUsername,
          new_password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('비밀번호');

      // 새 비밀번호로 로그인 확인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: resetUsername,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('일치하지 않는 군번으로 비밀번호 재설정 실패 (400 or 404)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          military_number: '99-99999999',
          username: resetUsername,
          new_password: 'NewPassword123!',
        });

      expect([400, 404]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    test('필수 필드 누락 시 실패 (400)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          military_number: resetMilNum,
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/auth/change-password - 비밀번호 변경', () => {
    const timestamp3 = Date.now() + 2000;
    const changeUsername = `change${timestamp3.toString().slice(-10)}`;
    const changePassword = 'Change1234!@';
    const changeMilNum = `24-${timestamp3.toString().slice(-8)}`;
    let changeToken;

    beforeAll(async () => {
      // 테스트용 사용자 생성 및 로그인
      const signupResponse = await request(app).post('/api/auth/signup').send({
        username: changeUsername,
        password: changePassword,
        military_number: changeMilNum,
        name: '변경테스트',
        rank: '병장',
      });
      testUserIds.push(parseInt(signupResponse.body.data.user.id));

      const loginResponse = await request(app).post('/api/auth/login').send({
        loginId: changeUsername,
        password: changePassword,
      });

      changeToken = loginResponse.body.data.token;
    });

    test('인증된 사용자의 비밀번호 변경 성공 (200)', async () => {
      const newPassword = 'ChangedPassword123!@';

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${changeToken}`)
        .send({
          current_password: changePassword,
          new_password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('비밀번호');

      // 새 비밀번호로 로그인 확인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          loginId: changeUsername,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('인증 토큰 없이 요청 시 실패 (401)', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          current_password: changePassword,
          new_password: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('잘못된 현재 비밀번호로 변경 실패 (401)', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${changeToken}`)
        .send({
          current_password: 'WrongPassword123!',
          new_password: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('필수 필드 누락 시 실패 (400)', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${changeToken}`)
        .send({
          current_password: changePassword,
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});
