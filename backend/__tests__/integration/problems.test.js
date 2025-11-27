import request from 'supertest';
import app from '../../src/app.js';
import { getPool, closePool } from '../../src/config/database.js';
import { PROBLEM_CATEGORIES } from '../../src/shared/utils/validators.js';

describe('문제 관리 API 통합 테스트', () => {
  let pool;
  let adminToken;
  let studentToken;
  let testProblemId;
  let categoryName;
  let testUserIds = [];

  beforeAll(async () => {
    pool = getPool();

    const timestamp = Date.now();

    // 관리자 사용자 생성
    const adminUsername = `padm${timestamp.toString().slice(-12)}`;
    const adminSignup = await request(app).post('/api/auth/signup').send({
      username: adminUsername,
      password: 'Admin1234!@',
      military_number: `98-${timestamp.toString().slice(-8)}`,
      name: '문제관리자',
      rank: '중령',
    });
    testUserIds.push(parseInt(adminSignup.body.data.user.id));

    // 관리자 권한 부여
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [
      'admin',
      adminSignup.body.data.user.id,
    ]);

    const adminLogin = await request(app).post('/api/auth/login').send({
      loginId: adminUsername,
      password: 'Admin1234!@',
    });
    adminToken = adminLogin.body.data.token;

    // 일반 학생 생성
    const studentUsername = `pstu${timestamp.toString().slice(-12)}`;
    const studentSignup = await request(app).post('/api/auth/signup').send({
      username: studentUsername,
      password: 'Student1234!@',
      military_number: `97-${timestamp.toString().slice(-8)}`,
      name: '문제학생',
      rank: '병장',
    });
    testUserIds.push(parseInt(studentSignup.body.data.user.id));

    const studentLogin = await request(app).post('/api/auth/login').send({
      loginId: studentUsername,
      password: 'Student1234!@',
    });
    studentToken = studentLogin.body.data.token;

    // 문제 카테고리(문자열) 선택
    categoryName = PROBLEM_CATEGORIES[0];
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testProblemId) {
      await pool.query('DELETE FROM problems WHERE id = $1', [testProblemId]);
    }
    for (const userId of testUserIds) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await closePool();
  });

  describe('GET /api/problems - 문제 목록 조회', () => {
    test('인증된 사용자가 문제 목록 조회 성공 (200)', async () => {
      const response = await request(app)
        .get('/api/problems')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('problems');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('인증 없이 조회 시 실패 (401)', async () => {
      const response = await request(app).get('/api/problems').expect(401);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/problems - 문제 생성 (관리자)', () => {
    test('관리자가 문제 생성 성공 (201)', async () => {
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '테스트 문제',
          description: '문제 설명',
          category: categoryName,
          difficulty: 3,
          timeLimit: 5,
          memoryLimit: 256,
          visibility: 'public',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('problemId');
      testProblemId = response.body.data.problemId;
    });

    test('학생이 문제 생성 시도 시 실패 (403)', async () => {
      const response = await request(app)
        .post('/api/problems')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '학생 문제',
          description: '권한 없음',
          category: categoryName,
          difficulty: 3,
          timeLimit: 5,
        })
        .expect(403);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/problems/:id - 문제 상세 조회', () => {
    test('존재하는 문제 상세 조회 성공 (200)', async () => {
      if (!testProblemId) {
        const result = await pool.query(
          `INSERT INTO problems (title, description, category, difficulty, time_limit, memory_limit, visibility, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          ['상세조회 테스트', '설명', categoryName, 3, 5, 256, 'public', testUserIds[0]]
        );
        testProblemId = result.rows[0].id;
      }

      const response = await request(app)
        .get(`/api/problems/${testProblemId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    test('존재하지 않는 문제 조회 시 실패 (404)', async () => {
      const response = await request(app)
        .get('/api/problems/999999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/problems/:id - 문제 수정 (관리자)', () => {
    test('관리자가 문제 수정 성공 (200)', async () => {
      if (!testProblemId) return;

      const response = await request(app)
        .put(`/api/problems/${testProblemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '수정된 제목',
          difficulty: 4,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('학생이 문제 수정 시도 시 실패 (403)', async () => {
      if (!testProblemId) return;

      const response = await request(app)
        .put(`/api/problems/${testProblemId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: '학생의 수정',
        })
        .expect(403);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/problems/:id/test-cases - 테스트 케이스 추가', () => {
    test('관리자가 테스트 케이스 추가 성공 (201)', async () => {
      if (!testProblemId) return;

      const response = await request(app)
        .post(`/api/problems/${testProblemId}/test-cases`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inputData: '1 2',
          expectedOutput: '3',
          isPublic: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('학생이 테스트 케이스 추가 시도 시 실패 (403)', async () => {
      if (!testProblemId) return;

      const response = await request(app)
        .post(`/api/problems/${testProblemId}/test-cases`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          inputData: '1 2',
          expectedOutput: '3',
        })
        .expect(403);

      expect(response.body.message).toBeDefined();
    });
  });
});
