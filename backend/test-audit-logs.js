/**
 * 감사 로그 모듈 테스트
 */

const BASE_URL = 'http://localhost:3000/api';

let superAdminToken = '';

/**
 * 1. 슈퍼 관리자 로그인
 */
async function loginAsSuperAdmin() {
  console.log('\n[1] 슈퍼 관리자 로그인...');

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginId: 'super_admin',
      password: 'admin123',
      loginType: 'admin',
    }),
  });

  const data = await response.json();

  if (response.ok) {
    superAdminToken = data.data.token;
    console.log('✓ 로그인 성공');
    console.log('  토큰:', superAdminToken.substring(0, 30) + '...');
  } else {
    console.log('✗ 로그인 실패:', data);
    throw new Error('로그인 실패');
  }
}

/**
 * 2. 감사 로그 조회 (전체)
 */
async function getAuditLogs() {
  console.log('\n[2] 감사 로그 조회 (전체)...');

  const response = await fetch(`${BASE_URL}/audit-logs?limit=5`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
    },
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✓ 조회 성공');
    console.log('  총 개수:', data.pagination.total);
    console.log('  현재 페이지:', data.pagination.page);
    console.log('  반환된 로그 수:', data.data.length);

    if (data.data.length > 0) {
      console.log('\n  최근 로그:');
      data.data.slice(0, 3).forEach((log, idx) => {
        console.log(`    ${idx + 1}. ${log.action_type} - ${log.target_resource}`);
        console.log(`       사용자: ${log.user_name || '알 수 없음'} (${log.user_role})`);
        console.log(`       결과: ${log.result}, 시간: ${log.performed_at}`);
      });
    }
  } else {
    console.log('✗ 조회 실패:', data);
  }
}

/**
 * 3. 감사 로그 필터링 조회 (로그인만)
 */
async function getLoginAuditLogs() {
  console.log('\n[3] 감사 로그 조회 (로그인만)...');

  const response = await fetch(`${BASE_URL}/audit-logs?actionType=login&limit=5`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
    },
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✓ 조회 성공');
    console.log('  로그인 로그 수:', data.data.length);

    if (data.data.length > 0) {
      console.log('\n  최근 로그인 기록:');
      data.data.forEach((log, idx) => {
        console.log(`    ${idx + 1}. ${log.user_name || '알 수 없음'} (${log.user_role})`);
        console.log(`       IP: ${log.ip_address}, 시간: ${log.performed_at}`);
      });
    }
  } else {
    console.log('✗ 조회 실패:', data);
  }
}

/**
 * 4. 페이지네이션 테스트
 */
async function testPagination() {
  console.log('\n[4] 페이지네이션 테스트...');

  // 첫 번째 페이지
  const response1 = await fetch(`${BASE_URL}/audit-logs?page=1&pageSize=2`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
    },
  });

  const data1 = await response1.json();

  if (response1.ok) {
    console.log('✓ 페이지 1 조회 성공');
    console.log('  페이지:', data1.pagination.page);
    console.log('  페이지 크기:', data1.pagination.limit);
    console.log('  총 페이지:', data1.pagination.totalPages);
    console.log('  반환된 로그:', data1.data.length);
  } else {
    console.log('✗ 페이지 1 조회 실패:', data1);
  }

  // 두 번째 페이지
  const response2 = await fetch(`${BASE_URL}/audit-logs?page=2&pageSize=2`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
    },
  });

  const data2 = await response2.json();

  if (response2.ok) {
    console.log('✓ 페이지 2 조회 성공');
    console.log('  반환된 로그:', data2.data.length);
  } else {
    console.log('✗ 페이지 2 조회 실패:', data2);
  }
}

/**
 * 5. 권한 검증 (학생으로 시도)
 */
async function testUnauthorizedAccess() {
  console.log('\n[5] 권한 검증 테스트...');

  // 학생 로그인
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginId: 'student01',
      password: 'student123',
      loginType: 'student',
    }),
  });

  const loginData = await loginResponse.json();

  if (loginResponse.ok) {
    const studentToken = loginData.data.token;
    console.log('✓ 학생 로그인 성공');

    // 감사 로그 조회 시도
    const auditResponse = await fetch(`${BASE_URL}/audit-logs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
      },
    });

    const auditData = await auditResponse.json();

    if (auditResponse.status === 403) {
      console.log('✓ 권한 검증 성공 (학생은 접근 불가)');
      console.log('  에러 메시지:', auditData.message);
    } else {
      console.log('✗ 권한 검증 실패 (학생이 접근 가능함)');
    }
  } else {
    console.log('✗ 학생 로그인 실패:', loginData);
  }
}

/**
 * 6. 새로운 작업 수행 후 로그 확인
 */
async function testAuditLogging() {
  console.log('\n[6] 감사 로그 자동 기록 테스트...');

  // 현재 로그 개수 확인
  const before = await fetch(`${BASE_URL}/audit-logs?limit=1`, {
    headers: { 'Authorization': `Bearer ${superAdminToken}` },
  });
  const beforeData = await before.json();
  const beforeCount = beforeData.pagination.total;

  console.log('  작업 전 로그 개수:', beforeCount);

  // 새로운 로그인 수행 (새로운 로그 생성)
  await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'super_admin',
      password: 'admin123',
      loginType: 'admin',
    }),
  });

  // 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 500));

  // 로그 개수 재확인
  const after = await fetch(`${BASE_URL}/audit-logs?limit=1`, {
    headers: { 'Authorization': `Bearer ${superAdminToken}` },
  });
  const afterData = await after.json();
  const afterCount = afterData.pagination.total;

  console.log('  작업 후 로그 개수:', afterCount);

  if (afterCount > beforeCount) {
    console.log('✓ 감사 로그 자동 기록 확인');
    console.log('  증가된 로그 수:', afterCount - beforeCount);
  } else {
    console.log('✗ 감사 로그 기록 안됨');
  }
}

/**
 * 전체 테스트 실행
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('감사 로그 모듈 테스트 시작');
  console.log('='.repeat(60));

  try {
    await loginAsSuperAdmin();
    await getAuditLogs();
    await getLoginAuditLogs();
    await testPagination();
    await testUnauthorizedAccess();
    await testAuditLogging();

    console.log('\n' + '='.repeat(60));
    console.log('모든 테스트 완료');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n테스트 실행 중 오류:', error.message);
  }
}

// 실행
runTests();
