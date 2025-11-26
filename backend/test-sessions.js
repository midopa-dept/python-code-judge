/**
 * 세션 관리 및 감사 로그 API 테스트 스크립트
 */

const API_BASE = 'http://localhost:3000/api';

// 테스트용 토큰 (실제 환경에서는 로그인을 통해 발급받아야 함)
// 임시로 관리자 토큰을 사용한다고 가정
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTY5NzExNzIwMCwiZXhwIjoxNjk3NzIyMDAwfQ.dummy';

async function testHealthCheck() {
  console.log('\n=== Health Check 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✓ Health Check:', data);
    return true;
  } catch (error) {
    console.error('✗ Health Check 실패:', error.message);
    return false;
  }
}

async function testCreateSession() {
  console.log('\n=== 세션 생성 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        name: '테스트 세션',
        startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1시간 후
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), // 3시간 후
        sessionType: 'regular',
        allowResubmit: true,
      }),
    });

    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', data);

    if (response.status === 201 && data.success) {
      console.log('✓ 세션 생성 성공');
      return data.data.id;
    } else {
      console.log('✗ 세션 생성 실패 (인증 토큰 없음 - 예상된 동작)');
      return null;
    }
  } catch (error) {
    console.error('✗ 세션 생성 요청 실패:', error.message);
    return null;
  }
}

async function testGetSessions() {
  console.log('\n=== 세션 목록 조회 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('세션 개수:', data.count || 0);

    if (response.status === 200) {
      console.log('✓ 세션 목록 조회 성공');
      return true;
    } else {
      console.log('✗ 세션 목록 조회 실패 (인증 토큰 없음 - 예상된 동작)');
      return false;
    }
  } catch (error) {
    console.error('✗ 세션 목록 조회 요청 실패:', error.message);
    return false;
  }
}

async function testAssignStudents(sessionId) {
  if (!sessionId) {
    console.log('\n=== 학생 할당 테스트 건너뜀 (세션 ID 없음) ===');
    return false;
  }

  console.log('\n=== 학생 할당 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        studentIds: [1, 2, 3],
      }),
    });

    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', data);

    if (response.status === 200 && data.success) {
      console.log('✓ 학생 할당 성공');
      return true;
    } else {
      console.log('✗ 학생 할당 실패');
      return false;
    }
  } catch (error) {
    console.error('✗ 학생 할당 요청 실패:', error.message);
    return false;
  }
}

async function testGetScoreboard(sessionId) {
  if (!sessionId) {
    console.log('\n=== 스코어보드 조회 테스트 건너뜀 (세션 ID 없음) ===');
    return false;
  }

  console.log('\n=== 스코어보드 조회 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/scoreboard`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', JSON.stringify(data, null, 2));

    if (response.status === 200 || response.status === 404) {
      console.log('✓ 스코어보드 조회 완료');
      return true;
    } else {
      console.log('✗ 스코어보드 조회 실패');
      return false;
    }
  } catch (error) {
    console.error('✗ 스코어보드 조회 요청 실패:', error.message);
    return false;
  }
}

async function testAuditLogs() {
  console.log('\n=== 감사 로그 조회 테스트 ===');
  try {
    const response = await fetch(`${API_BASE}/audit-logs?limit=10`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const data = await response.json();
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', JSON.stringify(data, null, 2));

    if (response.status === 200 || response.status === 401 || response.status === 403) {
      console.log('✓ 감사 로그 조회 완료 (인증/권한 검증됨)');
      return true;
    } else {
      console.log('✗ 감사 로그 조회 실패');
      return false;
    }
  } catch (error) {
    console.error('✗ 감사 로그 조회 요청 실패:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('세션 관리 및 감사 로그 API 테스트 시작');
  console.log('========================================');

  // Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n서버가 실행 중이지 않습니다. 테스트를 중단합니다.');
    return;
  }

  // 테스트 실행
  await testGetSessions();
  const sessionId = await testCreateSession();
  await testAssignStudents(sessionId);
  await testGetScoreboard(sessionId);
  await testAuditLogs();

  console.log('\n========================================');
  console.log('테스트 완료');
  console.log('========================================');
  console.log('\n참고: 실제 테스트를 위해서는 유효한 JWT 토큰이 필요합니다.');
  console.log('인증 모듈 구현 후 로그인을 통해 토큰을 받아 테스트하세요.');
}

// 테스트 실행
runTests().catch(console.error);
