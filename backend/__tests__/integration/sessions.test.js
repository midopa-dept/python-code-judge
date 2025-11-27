import request from 'supertest';
import app from '../../src/app.js';
import { getPool, closePool } from '../../src/config/database.js';

describe('세션 관리 API 통합 테스트', () => {
  let pool;
  let adminToken;
  let studentToken;
  let testSessionId;
  let testUserIds = [];

  beforeAll(async () => {
    pool = getPool();

    const timestamp = Date.now();

    // 관리자 생성
    const adminUsername = `sadm${timestamp.toString().slice(-12)}`;
    const adminSignup = await request(app).post('/api/auth/signup').send({
      username: adminUsername,
      password: 'Admin1234!@',
      military_number: `96-${timestamp.toString().slice(-8)}`,
      name: '세션관리자',
      rank: '중령',
    });
    testUserIds.push(parseInt(adminSignup.body.data.user.id));

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [
      'admin',
      adminSignup.body.data.user.id,
    ]);

    const adminLogin = await request(app).post('/api/auth/login').send({
      loginId: adminUsername,
      password: 'Admin1234!@',
    });
    adminToken = adminLogin.body.data.token;

    // 학생 생성
    const studentUsername = `sstu${timestamp.toString().slice(-12)}`;
    const studentSignup = await request(app).post('/api/auth/signup').send({
      username: studentUsername,
      password: 'Student1234!@',
      military_number: `95-${timestamp.toString().slice(-8)}`,
      name: '세션학생',
      rank: '병장',
    });
    testUserIds.push(parseInt(studentSignup.body.data.user.id));

    const studentLogin = await request(app).post('/api/auth/login').send({
      loginId: studentUsername,
      password: 'Student1234!@',
    });
    studentToken = studentLogin.body.data.token;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testSessionId) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [testSessionId]);
    }
    for (const userId of testUserIds) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await closePool();
  });

  describe('GET /api/sessions - 세션 목록 조회', () => {
    test('인증된 사용자가 세션 목록 조회 성공 (200)', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
    });

    test('인증 없이 조회 시 실패 (401)', async () => {
      const response = await request(app).get('/api/sessions').expect(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/sessions - 세션 생성 (관리자)', () => {
    test('관리자가 세션 생성 성공 (201)', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60000).toISOString();
      const endTime = new Date(now.getTime() + 3600000).toISOString();

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '통합 테스트 세션',
          description: '세션 테스트용',
          startTime: startTime,
          endTime: endTime,
          allowLateSubmission: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      testSessionId = response.body.data.sessionId;
    });

    test('학생이 세션 생성 시도 시 실패 (403)', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60000).toISOString();
      const endTime = new Date(now.getTime() + 3600000).toISOString();

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '학생 세션',
          startTime: startTime,
          endTime: endTime,
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/sessions/:id/students - 학생 할당', () => {
    test('관리자가 학생 할당 성공 (200)', async () => {
      if (!testSessionId) return;

      const response = await request(app)
        .post(`/api/sessions/${testSessionId}/students`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentIds: [testUserIds[1]],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('학생이 할당 시도 시 실패 (403)', async () => {
      if (!testSessionId) return;

      const response = await request(app)
        .post(`/api/sessions/${testSessionId}/students`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentIds: [testUserIds[1]],
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/sessions/:id/scoreboard - 스코어보드 조회', () => {
    test('인증된 사용자가 스코어보드 조회 성공 (200)', async () => {
      if (!testSessionId) return;

      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/scoreboard`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scoreboard');
    });

    test('인증 없이 조회 시 실패 (401)', async () => {
      if (!testSessionId) return;

      const response = await request(app)
        .get(`/api/sessions/${testSessionId}/scoreboard`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
