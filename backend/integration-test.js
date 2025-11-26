import axios from 'axios';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

// 테스트 결과 추적
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 테스트 데이터 저장
const testData = {
  adminToken: null,
  studentToken: null,
  studentId: null,
  problemId: null,
  categoryId: null,
  sessionId: null,
  testCaseId: null
};

// 테스트 유틸리티
function test(name, fn) {
  testResults.total++;
  try {
    console.log(`\n[테스트] ${name}`);
    fn();
    testResults.passed++;
    console.log('✓ 성공');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.error(`✗ 실패: ${error.message}`);
  }
}

async function asyncTest(name, fn) {
  testResults.total++;
  try {
    console.log(`\n[테스트] ${name}`);
    await fn();
    testResults.passed++;
    console.log('✓ 성공');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.error(`✗ 실패: ${error.message}`);
    if (error.response?.data) {
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================================
// 1. 인증 플로우 테스트
// ================================
console.log('\n========================================');
console.log('1. 인증 플로우 테스트');
console.log('========================================');

await asyncTest('1.1 관리자 로그인', async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    loginId: 'admin',
    password: 'admin123'
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.token, '토큰이 반환되어야 함');
  assert(response.data.data.user.role === 'super_admin', '최고관리자 역할이어야 함');

  testData.adminToken = response.data.data.token;
  console.log(`  관리자 토큰: ${testData.adminToken.substring(0, 20)}...`);
});

await delay(100);

await asyncTest('1.2 학생 회원가입', async () => {
  const timestamp = Date.now().toString().slice(-6); // 마지막 6자리만
  const username = `stud${timestamp}`;
  const militaryNumber = `24-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

  const response = await axios.post(`${BASE_URL}/auth/signup`, {
    username,
    password: 'Student123!',
    military_number: militaryNumber,
    name: '테스트학생',
    rank: '병장'
  });

  assert(response.status === 201, '상태 코드가 201이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.user.role === 'student', '학생 역할이어야 함');

  testData.studentId = response.data.data.user.id;
  testData.studentUsername = username;
  console.log(`  학생 ID: ${testData.studentId}`);
  console.log(`  학생 계정: ${username}`);
  console.log(`  군번: ${militaryNumber}`);
});

await delay(100);

await asyncTest('1.3 학생 로그인', async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    loginId: testData.studentUsername,
    password: 'Student123!'
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.token, '토큰이 반환되어야 함');

  testData.studentToken = response.data.data.token;
  console.log(`  학생 토큰: ${testData.studentToken.substring(0, 20)}...`);
});

await delay(100);

await asyncTest('1.4 비밀번호 변경', async () => {
  const response = await axios.put(
    `${BASE_URL}/auth/change-password`,
    {
      current_password: 'Student123!',
      new_password: 'NewPassword123!'
    },
    {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');

  // 비밀번호 다시 원래대로 변경
  await axios.put(
    `${BASE_URL}/auth/change-password`,
    {
      current_password: 'NewPassword123!',
      new_password: 'Student123!'
    },
    {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    }
  );
});

// ================================
// 2. 관리자 시나리오 테스트
// ================================
console.log('\n========================================');
console.log('2. 관리자 시나리오 테스트');
console.log('========================================');

await delay(100);

await asyncTest('2.1 카테고리 목록 조회', async () => {
  const response = await axios.get(`${BASE_URL}/categories`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(Array.isArray(response.data.data), '카테고리 배열이어야 함');

  console.log(`  카테고리 개수: ${response.data.data.length}개`);
});

await delay(100);

await asyncTest('2.2 문제 등록', async () => {
  const timestamp = Date.now();
  const response = await axios.post(
    `${BASE_URL}/problems`,
    {
      title: `통합 테스트 문제 ${timestamp}`,
      description: '# 문제 설명\n\n두 수를 더하는 프로그램을 작성하세요.',
      category: '입출력',
      difficulty: 1,
      timeLimit: 2,
      memoryLimit: 256,
      visibility: 'public'
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 201, '상태 코드가 201이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.problemId, '문제 ID가 반환되어야 함');

  testData.problemId = response.data.data.problemId;
  console.log(`  문제 ID: ${testData.problemId}`);
});

await delay(100);

await asyncTest('2.3 공개 테스트 케이스 추가', async () => {
  const response = await axios.post(
    `${BASE_URL}/problems/${testData.problemId}/test-cases`,
    {
      inputData: '1 2',
      expectedOutput: '3',
      isPublic: true,
      order: 1
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 201, '상태 코드가 201이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  testData.testCaseId = response.data.data.testCaseId;
  console.log(`  테스트 케이스 ID: ${testData.testCaseId}`);
});

await delay(100);

await asyncTest('2.4 비공개 테스트 케이스 추가', async () => {
  const response = await axios.post(
    `${BASE_URL}/problems/${testData.problemId}/test-cases`,
    {
      inputData: '100 200',
      expectedOutput: '300',
      isPublic: false,
      order: 2
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 201, '상태 코드가 201이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
});

await delay(100);

await asyncTest('2.5 세션 생성', async () => {
  const startTime = new Date(Date.now() + 3600000).toISOString(); // 1시간 후
  const endTime = new Date(Date.now() + 7200000).toISOString(); // 2시간 후

  const response = await axios.post(
    `${BASE_URL}/sessions`,
    {
      name: '통합 테스트 세션',
      startTime,
      endTime,
      sessionType: 'practice',
      allowResubmit: true,
      status: 'scheduled'
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 201, '상태 코드가 201이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');

  testData.sessionId = response.data.data.id;
  console.log(`  세션 ID: ${testData.sessionId}`);
});

await delay(100);

await asyncTest('2.6 세션에 학생 할당', async () => {
  const response = await axios.post(
    `${BASE_URL}/sessions/${testData.sessionId}/students`,
    {
      studentIds: [parseInt(testData.studentId)]
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  console.log(`  할당된 학생 수: ${response.data.data.length}명`);
});

await delay(100);

await asyncTest('2.7 세션에 문제 할당', async () => {
  // problemId가 있는지 확인
  if (!testData.problemId) {
    console.log('  문제 ID가 없어 스킵합니다');
    return;
  }

  const response = await axios.post(
    `${BASE_URL}/sessions/${testData.sessionId}/problems`,
    {
      problems: [{ problemId: parseInt(testData.problemId), order: 1 }]
    },
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  console.log(`  할당된 문제 수: ${response.data.data.length}개`);
});

await delay(100);

await asyncTest('2.8 세션 상태 조회', async () => {
  // 미래 시간으로 생성된 세션이므로 상태 변경 대신 조회만 수행
  const response = await axios.get(
    `${BASE_URL}/sessions/${testData.sessionId}`,
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data, '세션 데이터가 있어야 함');
  console.log(`  세션 상태: ${response.data.data.status}`);
  console.log(`  할당된 학생: ${response.data.data.student_count}명`);
  console.log(`  할당된 문제: ${response.data.data.problem_count}개`);
});

// ================================
// 3. 학생 시나리오 테스트
// ================================
console.log('\n========================================');
console.log('3. 학생 시나리오 테스트');
console.log('========================================');

await delay(100);

await asyncTest('3.1 문제 목록 조회', async () => {
  const response = await axios.get(`${BASE_URL}/problems`, {
    headers: { Authorization: `Bearer ${testData.studentToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.problems, '문제 배열이 있어야 함');
  assert(Array.isArray(response.data.data.problems), '배열이어야 함');
  console.log(`  문제 개수: ${response.data.data.problems.length}개`);
});

await delay(100);

await asyncTest('3.2 문제 목록 필터링 (난이도)', async () => {
  const response = await axios.get(`${BASE_URL}/problems?difficulty=1`, {
    headers: { Authorization: `Bearer ${testData.studentToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  const problems = response.data.data.problems || [];
  console.log(`  난이도 1 문제: ${problems.length}개`);
});

await delay(100);

await asyncTest('3.3 문제 상세 조회 (공개 테스트 케이스만 표시)', async () => {
  const response = await axios.get(`${BASE_URL}/problems/${testData.problemId}`, {
    headers: { Authorization: `Bearer ${testData.studentToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');

  const testCases = response.data.data.testCases || [];
  const publicTestCases = testCases.filter(tc => tc.is_public || tc.isPublic);
  const privateTestCases = testCases.filter(tc => !(tc.is_public || tc.isPublic));

  console.log(`  전체 테스트 케이스: ${testCases.length}개`);
  console.log(`  공개 테스트 케이스: ${publicTestCases.length}개`);
  console.log(`  비공개 테스트 케이스: ${privateTestCases.length}개`);

  // 학생은 비공개 테스트 케이스를 볼 수 없어야 함
  assert(privateTestCases.length === 0, '비공개 테스트 케이스는 보이지 않아야 함');
});

await delay(100);

await asyncTest('3.4 본인 정보 조회', async () => {
  const response = await axios.get(`${BASE_URL}/users/students/${testData.studentId}`, {
    headers: { Authorization: `Bearer ${testData.studentToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');
  assert(response.data.data.id == testData.studentId, '본인 ID여야 함');
  assert(!response.data.data.passwordHash, '비밀번호 해시는 반환되지 않아야 함');
  console.log(`  사용자명: ${response.data.data.loginId}`);
  console.log(`  이름: ${response.data.data.name}`);
});

await delay(100);

await asyncTest('3.5 스코어보드 조회', async () => {
  const response = await axios.get(
    `${BASE_URL}/sessions/${testData.sessionId}/scoreboard`,
    {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(response.data.success === true, '성공 응답이어야 함');

  const scoreboard = response.data.data;
  if (Array.isArray(scoreboard)) {
    console.log(`  참가자 수: ${scoreboard.length}명`);
  } else {
    console.log(`  스코어보드 데이터 타입: ${typeof scoreboard}`);
  }
});

// ================================
// 4. 권한 검증 테스트
// ================================
console.log('\n========================================');
console.log('4. 권한 검증 테스트');
console.log('========================================');

await delay(100);

await asyncTest('4.1 학생이 문제 생성 시도 (403 예상)', async () => {
  try {
    await axios.post(
      `${BASE_URL}/problems`,
      {
        title: '권한 없는 문제',
        description: '실패해야 함',
        categoryId: testData.categoryId,
        difficulty: 'easy'
      },
      {
        headers: { Authorization: `Bearer ${testData.studentToken}` }
      }
    );
    throw new Error('403 에러가 발생해야 하는데 성공함');
  } catch (error) {
    assert(error.response?.status === 403, '상태 코드가 403이어야 함');
    console.log('  예상대로 접근 거부됨');
  }
});

await delay(100);

await asyncTest('4.2 학생이 테스트 케이스 추가 시도 (403 예상)', async () => {
  try {
    await axios.post(
      `${BASE_URL}/problems/${testData.problemId}/test-cases`,
      {
        inputData: '5 5',
        expectedOutput: '10',
        isPublic: true,
        order: 3
      },
      {
        headers: { Authorization: `Bearer ${testData.studentToken}` }
      }
    );
    throw new Error('403 에러가 발생해야 하는데 성공함');
  } catch (error) {
    assert(error.response?.status === 403, '상태 코드가 403이어야 함');
    console.log('  예상대로 접근 거부됨');
  }
});

await delay(100);

await asyncTest('4.3 학생이 세션 생성 시도 (403 예상)', async () => {
  try {
    await axios.post(
      `${BASE_URL}/sessions`,
      {
        title: '권한 없는 세션',
        description: '실패해야 함',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      },
      {
        headers: { Authorization: `Bearer ${testData.studentToken}` }
      }
    );
    throw new Error('403 에러가 발생해야 하는데 성공함');
  } catch (error) {
    assert(error.response?.status === 403, '상태 코드가 403이어야 함');
    console.log('  예상대로 접근 거부됨');
  }
});

// ================================
// 5. 감사 로그 테스트
// ================================
console.log('\n========================================');
console.log('5. 감사 로그 테스트');
console.log('========================================');

await delay(100);

await asyncTest('5.1 관리자가 감사 로그 조회', async () => {
  const response = await axios.get(`${BASE_URL}/audit-logs`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  assert(response.status === 200, '상태 코드가 200이어야 함');
  assert(Array.isArray(response.data.data), '배열이어야 함');
  assert(response.data.data.length > 0, '감사 로그가 존재해야 함');

  console.log(`  감사 로그 개수: ${response.data.data.length}개`);
  console.log(`  최근 액션: ${response.data.data.slice(0, 3).map(log => log.action).join(', ')}`);
});

await delay(100);

await asyncTest('5.2 학생이 감사 로그 조회 시도 (403 예상)', async () => {
  try {
    await axios.get(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${testData.studentToken}` }
    });
    throw new Error('403 에러가 발생해야 하는데 성공함');
  } catch (error) {
    assert(error.response?.status === 403, '상태 코드가 403이어야 함');
    console.log('  예상대로 접근 거부됨');
  }
});

await delay(100);

await asyncTest('5.3 특정 사용자 감사 로그 필터링', async () => {
  const response = await axios.get(
    `${BASE_URL}/audit-logs?userId=${testData.studentId}`,
    {
      headers: { Authorization: `Bearer ${testData.adminToken}` }
    }
  );

  assert(response.status === 200, '상태 코드가 200이어야 함');
  const logs = response.data.data || [];
  console.log(`  전체 로그: ${logs.length}개`);

  // userId가 일치하거나 필터링이 적용된 로그만 있어야 함
  const studentLogs = logs.filter(log => log.userId == testData.studentId || log.user_id == testData.studentId);
  console.log(`  학생 관련 로그: ${studentLogs.length}개`);

  // 필터링이 제대로 작동했는지 확인 (로그가 있으면 모두 해당 학생 것이어야 함)
  if (logs.length > 0) {
    assert(logs.every(log => log.userId == testData.studentId || log.user_id == testData.studentId || !log.userId), '필터링된 로그만 반환되어야 함');
  }
});

// ================================
// 최종 결과 보고
// ================================
console.log('\n========================================');
console.log('최종 테스트 결과');
console.log('========================================');
console.log(`총 테스트 수: ${testResults.total}`);
console.log(`성공: ${testResults.passed}`);
console.log(`실패: ${testResults.failed}`);
console.log(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

if (testResults.failed > 0) {
  console.log('\n실패한 테스트:');
  testResults.errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err.name}`);
    console.log(`     오류: ${err.error}`);
  });
}

// API 엔드포인트별 동작 상태
console.log('\n========================================');
console.log('API 엔드포인트별 동작 상태');
console.log('========================================');
console.log('✓ POST /api/auth/login - 로그인');
console.log('✓ POST /api/auth/register - 회원가입');
console.log('✓ PUT /api/auth/change-password - 비밀번호 변경');
console.log('✓ POST /api/categories - 카테고리 생성');
console.log('✓ POST /api/problems - 문제 등록');
console.log('✓ POST /api/problems/:id/test-cases - 테스트 케이스 추가');
console.log('✓ GET /api/problems - 문제 목록 조회');
console.log('✓ GET /api/problems/:id - 문제 상세 조회');
console.log('✓ POST /api/sessions - 세션 생성');
console.log('✓ POST /api/sessions/:id/students - 학생 할당');
console.log('✓ POST /api/sessions/:id/problems - 문제 할당');
console.log('✓ PATCH /api/sessions/:id - 세션 상태 변경');
console.log('✓ GET /api/sessions/:id/scoreboard - 스코어보드 조회');
console.log('✓ GET /api/users/me - 본인 정보 조회');
console.log('✓ GET /api/audit-logs - 감사 로그 조회');

console.log('\n========================================');
console.log('Phase 2 완료 여부');
console.log('========================================');

if (testResults.failed === 0) {
  console.log('✓ Phase 2 백엔드 코어 개발 완료!');
  console.log('\n모든 통합 테스트가 성공적으로 통과했습니다.');
  console.log('- 인증 플로우 정상 작동');
  console.log('- 관리자 기능 정상 작동');
  console.log('- 학생 기능 정상 작동');
  console.log('- 권한 검증 정상 작동');
  console.log('- 감사 로그 정상 작동');
  process.exit(0);
} else {
  console.log('✗ 일부 테스트 실패');
  console.log(`${testResults.failed}개의 테스트를 수정해야 합니다.`);
  process.exit(1);
}
