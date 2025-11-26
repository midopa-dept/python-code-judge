// Phase 2: 문제 관리 모듈 테스트
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let adminToken = null;
let studentToken = null;
let testProblemId = null;
let testCaseId = null;

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'yellow');
  log(message, 'yellow');
  log('='.repeat(60), 'yellow');
}

// 1. 로그인 (관리자 & 학생)
async function testLogin() {
  logSection('1. 로그인 테스트');

  try {
    // 관리자 로그인
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      loginId: 'admin',
      password: 'admin123!',
    });
    adminToken = adminRes.data.data.token;
    logSuccess('관리자 로그인 성공');

    // 학생 로그인
    const studentRes = await axios.post(`${BASE_URL}/auth/login`, {
      loginId: 'student',
      password: 'student123!',
    });
    studentToken = studentRes.data.data.token;
    logSuccess('학생 로그인 성공');
  } catch (error) {
    logError(`로그인 실패: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// 2. 카테고리 목록 조회
async function testGetCategories() {
  logSection('2. 카테고리 목록 조회 (GET /api/categories)');

  try {
    const response = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('카테고리 목록 조회 성공');
    logInfo(`카테고리 개수: ${response.data.data.length}`);
    logInfo(`카테고리: ${response.data.data.join(', ')}`);
  } catch (error) {
    logError(`카테고리 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 3. 문제 등록 (관리자 전용)
async function testCreateProblem() {
  logSection('3. 문제 등록 (POST /api/problems - 관리자 전용)');

  try {
    const timestamp = Date.now();
    const problemData = {
      title: `테스트 문제 ${timestamp}`,
      description: '두 정수 A와 B를 입력받아 A+B를 출력하는 프로그램을 작성하시오.',
      category: '입출력',
      difficulty: 1,
      timeLimit: 2,
      memoryLimit: 256,
      visibility: 'public',
      judgeConfig: {
        language: 'python',
        compareMode: 'exact',
      },
    };

    const response = await axios.post(`${BASE_URL}/problems`, problemData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    testProblemId = response.data.data.problemId;
    logSuccess('문제 등록 성공');
    logInfo(`문제 ID: ${testProblemId}`);

    // 학생이 등록 시도 (실패해야 함)
    try {
      await axios.post(`${BASE_URL}/problems`, problemData, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      logError('학생이 문제 등록 성공 (실패해야 함)');
    } catch (error) {
      if (error.response?.status === 403) {
        logSuccess('학생 권한 검증 성공 (403 Forbidden)');
      } else {
        logError(`예상치 못한 에러: ${error.response?.status}`);
      }
    }
  } catch (error) {
    logError(`문제 등록 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 4. 테스트 케이스 추가
async function testCreateTestCases() {
  logSection('4. 테스트 케이스 추가 (POST /api/problems/:id/test-cases)');

  if (!testProblemId) {
    logError('테스트 문제 ID가 없습니다.');
    return;
  }

  try {
    // 공개 테스트 케이스 추가
    const publicTestCase = {
      inputData: '1 2',
      expectedOutput: '3',
      isPublic: true,
      order: 1,
    };

    const response1 = await axios.post(
      `${BASE_URL}/problems/${testProblemId}/test-cases`,
      publicTestCase,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    testCaseId = response1.data.data.testCaseId;
    logSuccess(`공개 테스트 케이스 추가 성공 (ID: ${testCaseId})`);

    // 비공개 테스트 케이스 추가
    const privateTestCase = {
      inputData: '100 200',
      expectedOutput: '300',
      isPublic: false,
      order: 2,
    };

    const response2 = await axios.post(
      `${BASE_URL}/problems/${testProblemId}/test-cases`,
      privateTestCase,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`비공개 테스트 케이스 추가 성공 (ID: ${response2.data.data.testCaseId})`);
  } catch (error) {
    logError(`테스트 케이스 추가 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 5. 문제 목록 조회
async function testGetProblems() {
  logSection('5. 문제 목록 조회 (GET /api/problems)');

  try {
    // 전체 목록 조회
    const response1 = await axios.get(`${BASE_URL}/problems`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`전체 문제 목록 조회 성공 (총 ${response1.data.data.problems.length}개)`);

    // 카테고리 필터링
    const response2 = await axios.get(`${BASE_URL}/problems?category=입출력`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`카테고리 필터링 성공 (입출력: ${response2.data.data.problems.length}개)`);

    // 난이도 필터링
    const response3 = await axios.get(`${BASE_URL}/problems?difficulty=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`난이도 필터링 성공 (난이도 1: ${response3.data.data.problems.length}개)`);

    // 페이지네이션
    const response4 = await axios.get(`${BASE_URL}/problems?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('페이지네이션 성공');
    logInfo(`페이지: ${response4.data.data.pagination.currentPage}/${response4.data.data.pagination.totalPages}`);
  } catch (error) {
    logError(`문제 목록 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 6. 문제 상세 조회
async function testGetProblem() {
  logSection('6. 문제 상세 조회 (GET /api/problems/:id)');

  if (!testProblemId) {
    logError('테스트 문제 ID가 없습니다.');
    return;
  }

  try {
    // 관리자 조회 (모든 테스트 케이스)
    const adminResponse = await axios.get(`${BASE_URL}/problems/${testProblemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('관리자 문제 상세 조회 성공');
    logInfo(`제목: ${adminResponse.data.data.title}`);
    logInfo(`테스트 케이스 개수: ${adminResponse.data.data.publicTestCases.length}`);

    // 학생 조회 (공개 테스트 케이스만)
    const studentResponse = await axios.get(`${BASE_URL}/problems/${testProblemId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    logSuccess('학생 문제 상세 조회 성공');
    const publicTestCases = studentResponse.data.data.publicTestCases.filter((tc) => tc.isPublic);
    logInfo(`공개 테스트 케이스: ${publicTestCases.length}개`);
  } catch (error) {
    logError(`문제 상세 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 7. 문제 수정
async function testUpdateProblem() {
  logSection('7. 문제 수정 (PUT /api/problems/:id)');

  if (!testProblemId) {
    logError('테스트 문제 ID가 없습니다.');
    return;
  }

  try {
    const updateData = {
      title: '두 수의 합 (수정됨)',
      difficulty: 2,
      visibility: 'public',
    };

    await axios.put(`${BASE_URL}/problems/${testProblemId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('문제 수정 성공');

    // 수정 확인
    const response = await axios.get(`${BASE_URL}/problems/${testProblemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logInfo(`수정된 제목: ${response.data.data.title}`);
    logInfo(`수정된 난이도: ${response.data.data.difficulty}`);
  } catch (error) {
    logError(`문제 수정 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 8. 테스트 케이스 수정
async function testUpdateTestCase() {
  logSection('8. 테스트 케이스 수정 (PUT /api/problems/:id/test-cases/:caseId)');

  if (!testProblemId || !testCaseId) {
    logError('테스트 문제 ID 또는 테스트 케이스 ID가 없습니다.');
    return;
  }

  try {
    const updateData = {
      inputData: '10 20',
      expectedOutput: '30',
      isPublic: true,
    };

    await axios.put(
      `${BASE_URL}/problems/${testProblemId}/test-cases/${testCaseId}`,
      updateData,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('테스트 케이스 수정 성공');
  } catch (error) {
    logError(`테스트 케이스 수정 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 9. 테스트 케이스 조회
async function testGetTestCases() {
  logSection('9. 테스트 케이스 조회 (GET /api/problems/:id/test-cases)');

  if (!testProblemId) {
    logError('테스트 문제 ID가 없습니다.');
    return;
  }

  try {
    // 관리자 조회 (모든 테스트 케이스)
    const adminResponse = await axios.get(`${BASE_URL}/problems/${testProblemId}/test-cases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`관리자 테스트 케이스 조회 성공 (총 ${adminResponse.data.data.testCases.length}개)`);

    // 학생 조회 (공개 테스트 케이스만)
    const studentResponse = await axios.get(`${BASE_URL}/problems/${testProblemId}/test-cases`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    logSuccess(`학생 테스트 케이스 조회 성공 (공개: ${studentResponse.data.data.testCases.length}개)`);
  } catch (error) {
    logError(`테스트 케이스 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 10. 테스트 케이스 삭제
async function testDeleteTestCase() {
  logSection('10. 테스트 케이스 삭제 (DELETE /api/problems/:id/test-cases/:caseId)');

  if (!testProblemId || !testCaseId) {
    logError('테스트 문제 ID 또는 테스트 케이스 ID가 없습니다.');
    return;
  }

  try {
    await axios.delete(`${BASE_URL}/problems/${testProblemId}/test-cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('테스트 케이스 삭제 성공');
  } catch (error) {
    logError(`테스트 케이스 삭제 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 11. 문제 삭제
async function testDeleteProblem() {
  logSection('11. 문제 삭제 (DELETE /api/problems/:id)');

  if (!testProblemId) {
    logError('테스트 문제 ID가 없습니다.');
    return;
  }

  try {
    await axios.delete(`${BASE_URL}/problems/${testProblemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('문제 삭제 성공');
  } catch (error) {
    logError(`문제 삭제 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 12. 유효성 검증 테스트
async function testValidation() {
  logSection('12. 유효성 검증 테스트');

  try {
    // 잘못된 카테고리
    try {
      await axios.post(
        `${BASE_URL}/problems`,
        {
          title: '테스트',
          description: '테스트',
          category: '잘못된카테고리',
          difficulty: 1,
          timeLimit: 2,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logError('잘못된 카테고리 통과 (실패해야 함)');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('카테고리 유효성 검증 성공');
      }
    }

    // 잘못된 난이도
    try {
      await axios.post(
        `${BASE_URL}/problems`,
        {
          title: '테스트',
          description: '테스트',
          category: '입출력',
          difficulty: 10,
          timeLimit: 2,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logError('잘못된 난이도 통과 (실패해야 함)');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('난이도 유효성 검증 성공');
      }
    }

    // 필수 필드 누락
    try {
      await axios.post(
        `${BASE_URL}/problems`,
        {
          title: '테스트',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logError('필수 필드 누락 통과 (실패해야 함)');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('필수 필드 검증 성공');
      }
    }
  } catch (error) {
    logError(`유효성 검증 테스트 실패: ${error.message}`);
  }
}

// 메인 실행
async function runTests() {
  logSection('Phase 2: 문제 관리 모듈 테스트 시작');

  try {
    await testLogin();
    await testGetCategories();
    await testCreateProblem();
    await testCreateTestCases();
    await testGetProblems();
    await testGetProblem();
    await testUpdateProblem();
    await testUpdateTestCase();
    await testGetTestCases();
    await testValidation();
    await testDeleteTestCase();
    await testDeleteProblem();

    logSection('테스트 완료');
    logSuccess('모든 테스트가 완료되었습니다!');
  } catch (error) {
    logSection('테스트 실패');
    logError(`치명적 오류: ${error.message}`);
    process.exit(1);
  }
}

runTests();
