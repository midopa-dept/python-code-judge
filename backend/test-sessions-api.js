import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// 전역 변수
let adminToken = '';
let sessionId = null;
let studentIds = [];
let problemIds = [];

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
};

// 관리자 로그인
async function loginAsAdmin() {
  log.section('관리자 로그인');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      loginId: 'admin',
      password: 'admin123',
    });

    adminToken = response.data.data.token;
    log.success(`로그인 성공: ${response.data.data.user.name}`);
    return true;
  } catch (error) {
    log.error(`로그인 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 학생 및 문제 ID 조회
async function fetchTestData() {
  log.section('테스트 데이터 조회');

  try {
    // 학생 목록 조회
    const studentsRes = await axios.get(`${BASE_URL}/users/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    studentIds = studentsRes.data.data.slice(0, 3).map((s) => s.id);
    log.success(`학생 ${studentIds.length}명 조회 완료: ${studentIds.join(', ')}`);

    // 문제 목록 조회
    const problemsRes = await axios.get(`${BASE_URL}/problems`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    problemIds = problemsRes.data.data.slice(0, 3).map((p) => p.id);
    log.success(`문제 ${problemIds.length}개 조회 완료: ${problemIds.join(', ')}`);

    return true;
  } catch (error) {
    log.error(`테스트 데이터 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 1. 세션 생성
async function testCreateSession() {
  log.section('1. POST /api/sessions - 세션 생성');

  try {
    const response = await axios.post(
      `${BASE_URL}/sessions`,
      {
        name: 'Phase 2 테스트 세션',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
        sessionType: 'practice',
        allowResubmit: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    sessionId = response.data.data.id;
    log.success(`세션 생성 성공 (ID: ${sessionId})`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 생성 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 2. 세션 목록 조회
async function testGetSessions() {
  log.section('2. GET /api/sessions - 세션 목록 조회');

  try {
    const response = await axios.get(`${BASE_URL}/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`세션 ${response.data.count}개 조회 완료`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 목록 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 3. 세션 상세 조회
async function testGetSession() {
  log.section('3. GET /api/sessions/:id - 세션 상세 조회');

  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`세션 상세 조회 성공`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 상세 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 4. 학생 할당
async function testAssignStudents() {
  log.section('4. POST /api/sessions/:id/students - 학생 할당');

  try {
    const response = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/students`,
      {
        studentIds,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`학생 ${response.data.data.length}명 할당 성공`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error(`학생 할당 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 5. 할당된 학생 목록 조회
async function testGetSessionStudents() {
  log.section('5. GET /api/sessions/:id/students - 할당된 학생 목록');

  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`학생 ${response.data.count}명 조회 완료`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`학생 목록 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 6. 문제 할당
async function testAssignProblems() {
  log.section('6. POST /api/sessions/:id/problems - 문제 할당');

  try {
    const problems = problemIds.map((id, index) => ({
      problemId: id,
      order: index + 1,
    }));

    const response = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/problems`,
      {
        problems,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`문제 ${response.data.data.length}개 할당 성공`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error(`문제 할당 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 7. 할당된 문제 목록 조회
async function testGetSessionProblems() {
  log.section('7. GET /api/sessions/:id/problems - 할당된 문제 목록');

  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/problems`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`문제 ${response.data.count}개 조회 완료`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`문제 목록 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 8. 세션 상태 변경 (시작)
async function testStartSession() {
  log.section('8. PUT /api/sessions/:id/status - 세션 시작');

  try {
    const response = await axios.put(
      `${BASE_URL}/sessions/${sessionId}/status`,
      {
        status: 'active',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`세션 시작 성공 (상태: ${response.data.data.status})`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 시작 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 9. 스코어보드 조회
async function testGetScoreboard() {
  log.section('9. GET /api/sessions/:id/scoreboard - 스코어보드 조회');

  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/scoreboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`스코어보드 조회 성공 (${response.data.count}명)`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`스코어보드 조회 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 10. 세션 상태 변경 (종료)
async function testEndSession() {
  log.section('10. PUT /api/sessions/:id/status - 세션 종료');

  try {
    const response = await axios.put(
      `${BASE_URL}/sessions/${sessionId}/status`,
      {
        status: 'ended',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`세션 종료 성공 (상태: ${response.data.data.status})`);
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 종료 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 11. 세션 초기화
async function testResetSession() {
  log.section('11. DELETE /api/sessions/:id/reset - 세션 초기화');

  try {
    const response = await axios.delete(`${BASE_URL}/sessions/${sessionId}/reset`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    log.success(`세션 초기화 성공`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error(`세션 초기화 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 12. 학생 제거
async function testRemoveStudent() {
  log.section('12. DELETE /api/sessions/:id/students/:studentId - 학생 제거');

  if (studentIds.length === 0) {
    log.error('제거할 학생이 없습니다');
    return false;
  }

  try {
    const studentToRemove = studentIds[0];
    const response = await axios.delete(
      `${BASE_URL}/sessions/${sessionId}/students/${studentToRemove}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`학생 제거 성공 (ID: ${studentToRemove})`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error(`학생 제거 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 13. 문제 제거
async function testRemoveProblem() {
  log.section('13. DELETE /api/sessions/:id/problems/:problemId - 문제 제거');

  if (problemIds.length === 0) {
    log.error('제거할 문제가 없습니다');
    return false;
  }

  try {
    const problemToRemove = problemIds[0];
    const response = await axios.delete(
      `${BASE_URL}/sessions/${sessionId}/problems/${problemToRemove}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    log.success(`문제 제거 성공 (ID: ${problemToRemove})`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log.error(`문제 제거 실패: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 메인 실행
async function main() {
  console.log('\n');
  log.info('Phase 2 세션 관리 모듈 API 테스트 시작');
  console.log('\n');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
  };

  const tests = [
    { name: '관리자 로그인', fn: loginAsAdmin },
    { name: '테스트 데이터 조회', fn: fetchTestData },
    { name: '세션 생성', fn: testCreateSession },
    { name: '세션 목록 조회', fn: testGetSessions },
    { name: '세션 상세 조회', fn: testGetSession },
    { name: '학생 할당', fn: testAssignStudents },
    { name: '할당된 학생 목록 조회', fn: testGetSessionStudents },
    { name: '문제 할당', fn: testAssignProblems },
    { name: '할당된 문제 목록 조회', fn: testGetSessionProblems },
    { name: '세션 시작', fn: testStartSession },
    { name: '스코어보드 조회', fn: testGetScoreboard },
    { name: '세션 종료', fn: testEndSession },
    { name: '세션 초기화', fn: testResetSession },
    { name: '학생 제거', fn: testRemoveStudent },
    { name: '문제 제거', fn: testRemoveProblem },
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.success++;
    } else {
      results.failed++;
      // 로그인 실패하면 중단
      if (test.name === '관리자 로그인') {
        break;
      }
    }
  }

  // 최종 결과
  log.section('테스트 결과 요약');
  console.log(`전체 테스트: ${results.total}개`);
  console.log(`${colors.green}성공: ${results.success}개${colors.reset}`);
  console.log(`${colors.red}실패: ${results.failed}개${colors.reset}`);
  console.log('');

  if (results.failed === 0) {
    log.success('모든 테스트 통과!');
  } else {
    log.error(`${results.failed}개의 테스트 실패`);
  }
}

main().catch((error) => {
  console.error('테스트 실행 중 오류 발생:', error);
  process.exit(1);
});
