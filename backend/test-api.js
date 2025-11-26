import { query } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function setupTestData() {
  console.log('테스트 데이터 설정 시작...\n');

  try {
    // 1. 테스트 관리자 생성
    const hashedPassword = await bcrypt.hash('admin1234', 10);

    const adminQuery = `
      INSERT INTO users (military_id, login_id, name, password_hash, role, account_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (login_id) DO NOTHING
      RETURNING id
    `;

    const adminResult = await query(adminQuery, [
      'ADMIN001',
      'admin',
      '관리자',
      hashedPassword,
      'admin',
      'active'
    ]);

    if (adminResult.rows.length > 0) {
      console.log('✓ 테스트 관리자 생성 완료 (ID:', adminResult.rows[0].id, ')');
    } else {
      console.log('✓ 테스트 관리자 이미 존재');
    }

    // 2. 테스트 학생 생성
    const studentPassword = await bcrypt.hash('student1234', 10);

    const studentQuery = `
      INSERT INTO users (military_id, login_id, name, password_hash, role, group_info, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (login_id) DO NOTHING
      RETURNING id
    `;

    const studentResult = await query(studentQuery, [
      '24-12345',
      'student1',
      '테스트학생',
      studentPassword,
      'student',
      '1소대',
      'active'
    ]);

    if (studentResult.rows.length > 0) {
      console.log('✓ 테스트 학생 생성 완료 (ID:', studentResult.rows[0].id, ')');
    } else {
      console.log('✓ 테스트 학생 이미 존재');
    }

    // 3. 기존 관리자 ID 조회
    const adminIdResult = await query(
      'SELECT id FROM users WHERE login_id = $1',
      ['admin']
    );
    const adminId = adminIdResult.rows[0]?.id;

    if (!adminId) {
      console.log('✗ 관리자를 찾을 수 없습니다.');
      return;
    }

    // 4. 테스트 문제 생성
    const problemQuery = `
      INSERT INTO problems (
        title, description, category, difficulty,
        time_limit, memory_limit, visibility, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (title) DO NOTHING
      RETURNING id
    `;

    const problemResult = await query(problemQuery, [
      'Hello World 출력하기',
      '"Hello World"를 출력하는 프로그램을 작성하세요.',
      '입출력',
      1,
      1,
      256,
      'public',
      adminId
    ]);

    let problemId;
    if (problemResult.rows.length > 0) {
      problemId = problemResult.rows[0].id;
      console.log('✓ 테스트 문제 생성 완료 (ID:', problemId, ')');

      // 5. 테스트 케이스 생성
      const testCaseQuery = `
        INSERT INTO test_cases (problem_id, input_data, expected_output, is_public, test_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const tc1 = await query(testCaseQuery, [
        problemId,
        '',
        'Hello World',
        true,
        1
      ]);

      console.log('✓ 공개 테스트 케이스 생성 완료 (ID:', tc1.rows[0].id, ')');

      const tc2 = await query(testCaseQuery, [
        problemId,
        '',
        'Hello World',
        false,
        2
      ]);

      console.log('✓ 비공개 테스트 케이스 생성 완료 (ID:', tc2.rows[0].id, ')');
    } else {
      console.log('✓ 테스트 문제 이미 존재');
    }

    console.log('\n테스트 데이터 설정 완료!');
    console.log('\n=== 테스트 계정 정보 ===');
    console.log('관리자: login_id=admin, password=admin1234');
    console.log('학생: login_id=student1, password=student1234');
    console.log('\n=== API 테스트 시나리오 ===');
    console.log('1. POST /api/auth/login - 관리자 로그인');
    console.log('2. GET /api/users/students - 학생 목록 조회 (관리자)');
    console.log('3. GET /api/problems - 문제 목록 조회');
    console.log('4. POST /api/problems - 문제 등록 (관리자)');
    console.log('5. GET /api/problems/:id - 문제 상세 조회');
    console.log('6. GET /api/problems/:id/test-cases - 테스트 케이스 조회');
    console.log('7. POST /api/problems/:id/test-cases - 테스트 케이스 추가 (관리자)');

  } catch (error) {
    console.error('테스트 데이터 설정 중 오류:', error);
  }
}

// 실행
setupTestData().then(() => {
  console.log('\n스크립트 실행 완료');
  process.exit(0);
}).catch(error => {
  console.error('실행 중 오류:', error);
  process.exit(1);
});
