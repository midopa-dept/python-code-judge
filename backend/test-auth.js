/**
 * 인증 API 테스트 스크립트
 * Phase 2: 인증 모듈 통합 테스트
 */

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;

// 색상 출력 헬퍼
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 요청 헬퍼
async function request(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data: result,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// 테스트 케이스
const tests = {
  createdUsername: null,
  createdMilitaryNumber: null,

  // 1. 학생 회원가입 테스트
  async testSignup() {
    log('\n=== 1. 학생 회원가입 테스트 ===', 'cyan');

    // 고유한 사용자명 생성 (짧은 timestamp 사용)
    const timestamp = Date.now().toString().slice(-6); // 마지막 6자리만 사용
    const uniqueUsername = `test_${timestamp}`;
    const uniqueMilitaryNumber = `24-123456${timestamp.slice(-2)}`;

    // 생성된 사용자 정보 저장
    this.createdUsername = uniqueUsername;
    this.createdMilitaryNumber = uniqueMilitaryNumber;

    // 성공 케이스
    log('1-1. 정상 회원가입', 'yellow');
    const signupData = {
      username: uniqueUsername,
      password: 'Test1234!',
      military_number: uniqueMilitaryNumber,
      name: '테스트병',
      rank: '이병',
    };

    const signupRes = await request('POST', '/auth/signup', signupData);
    if (signupRes.ok && signupRes.data.success) {
      log('✓ 회원가입 성공', 'green');
      log(`  - 사용자 ID: ${signupRes.data.data.user.id}`);
      log(`  - 사용자명: ${uniqueUsername}`);
      log(`  - 토큰: ${signupRes.data.data.token.substring(0, 20)}...`);
      testUserId = signupRes.data.data.user.id;
      authToken = signupRes.data.data.token;
    } else {
      log('✗ 회원가입 실패', 'red');
      log(`  - 에러: ${JSON.stringify(signupRes.data)}`);
      return false;
    }

    // 실패 케이스: 중복 아이디
    log('1-2. 중복 아이디 회원가입 (실패 예상)', 'yellow');
    const duplicateRes = await request('POST', '/auth/signup', signupData);
    if (!duplicateRes.ok) {
      log('✓ 중복 검증 정상 작동', 'green');
      log(`  - 에러 메시지: ${duplicateRes.data.message}`);
    } else {
      log('✗ 중복 검증 실패', 'red');
      return false;
    }

    // 실패 케이스: 약한 비밀번호
    log('1-3. 약한 비밀번호 (실패 예상)', 'yellow');
    const weakPwdData = { ...signupData, username: 'testuser02', password: '1234' };
    const weakPwdRes = await request('POST', '/auth/signup', weakPwdData);
    if (!weakPwdRes.ok) {
      log('✓ 비밀번호 검증 정상 작동', 'green');
    } else {
      log('✗ 비밀번호 검증 실패', 'red');
      return false;
    }

    // 실패 케이스: 잘못된 군번 형식
    log('1-4. 잘못된 군번 형식 (실패 예상)', 'yellow');
    const badMilitaryData = {
      ...signupData,
      username: 'testuser03',
      military_number: '2412345678', // 하이픈 없음
    };
    const badMilitaryRes = await request('POST', '/auth/signup', badMilitaryData);
    if (!badMilitaryRes.ok) {
      log('✓ 군번 형식 검증 정상 작동', 'green');
    } else {
      log('✗ 군번 형식 검증 실패', 'red');
      return false;
    }

    return true;
  },

  // 2. 로그인 테스트
  async testLogin() {
    log('\n=== 2. 로그인 테스트 ===', 'cyan');

    // 성공 케이스: 학생 로그인 (방금 생성한 계정 사용)
    log('2-1. 학생 로그인 (신규 생성 계정)', 'yellow');
    const loginData = {
      loginId: this.createdUsername,
      password: 'Test1234!',
    };

    const loginRes = await request('POST', '/auth/login', loginData);
    if (loginRes.ok && loginRes.data.success) {
      log('✓ 로그인 성공', 'green');
      log(`  - 역할: ${loginRes.data.data.user.role}`);
      log(`  - 토큰: ${loginRes.data.data.token.substring(0, 20)}...`);
      authToken = loginRes.data.data.token;
    } else {
      log('✗ 로그인 실패', 'red');
      log(`  - 에러: ${JSON.stringify(loginRes.data)}`);
      return false;
    }

    // 성공 케이스: 관리자 로그인 (시드 데이터)
    log('2-2. 관리자 로그인 (시드 데이터)', 'yellow');
    const adminLoginData = {
      loginId: 'superadmin',
      password: 'admin123',
    };

    const adminLoginRes = await request('POST', '/auth/login', adminLoginData);
    if (adminLoginRes.ok && adminLoginRes.data.success) {
      log('✓ 관리자 로그인 성공', 'green');
      log(`  - 역할: ${adminLoginRes.data.data.user.role}`);
    } else {
      log('⚠️  관리자 로그인 실패 (시드 데이터 미등록 가능)', 'yellow');
      log(`  - 시드 데이터를 확인하세요`);
      // 관리자 로그인 실패는 전체 테스트 실패로 처리하지 않음
    }

    // 실패 케이스: 잘못된 비밀번호
    log('2-3. 잘못된 비밀번호 (실패 예상)', 'yellow');
    const wrongPwdData = { loginId: 'testuser01', password: 'wrongpassword' };
    const wrongPwdRes = await request('POST', '/auth/login', wrongPwdData);
    if (!wrongPwdRes.ok) {
      log('✓ 비밀번호 검증 정상 작동', 'green');
    } else {
      log('✗ 비밀번호 검증 실패', 'red');
      return false;
    }

    // 실패 케이스: 존재하지 않는 사용자
    log('2-4. 존재하지 않는 사용자 (실패 예상)', 'yellow');
    const noUserData = { loginId: 'nonexistent', password: 'password' };
    const noUserRes = await request('POST', '/auth/login', noUserData);
    if (!noUserRes.ok) {
      log('✓ 사용자 존재 검증 정상 작동', 'green');
    } else {
      log('✗ 사용자 존재 검증 실패', 'red');
      return false;
    }

    return true;
  },

  // 3. 비밀번호 찾기 (재설정) 테스트
  async testPasswordReset() {
    log('\n=== 3. 비밀번호 찾기 테스트 ===', 'cyan');

    // 성공 케이스
    log('3-1. 정상 비밀번호 재설정', 'yellow');
    const resetData = {
      military_number: this.createdMilitaryNumber,
      username: this.createdUsername,
      new_password: 'NewPass1234!',
    };

    const resetRes = await request('POST', '/auth/reset-password', resetData);
    if (resetRes.ok && resetRes.data.success) {
      log('✓ 비밀번호 재설정 성공', 'green');
      log(`  - 메시지: ${resetRes.data.message}`);
    } else {
      log('✗ 비밀번호 재설정 실패', 'red');
      log(`  - 에러: ${JSON.stringify(resetRes.data)}`);
      return false;
    }

    // 새 비밀번호로 로그인 확인
    log('3-2. 재설정된 비밀번호로 로그인', 'yellow');
    const newLoginData = {
      loginId: this.createdUsername,
      password: 'NewPass1234!',
    };

    const newLoginRes = await request('POST', '/auth/login', newLoginData);
    if (newLoginRes.ok && newLoginRes.data.success) {
      log('✓ 새 비밀번호로 로그인 성공', 'green');
      authToken = newLoginRes.data.data.token;
    } else {
      log('✗ 새 비밀번호 로그인 실패', 'red');
      return false;
    }

    // 실패 케이스: 군번과 아이디 불일치
    log('3-3. 군번과 아이디 불일치 (실패 예상)', 'yellow');
    const mismatchData = {
      military_number: this.createdMilitaryNumber,
      username: 'wronguser',
      new_password: 'Test1234!',
    };

    const mismatchRes = await request('POST', '/auth/reset-password', mismatchData);
    if (!mismatchRes.ok) {
      log('✓ 본인 확인 검증 정상 작동', 'green');
    } else {
      log('✗ 본인 확인 검증 실패', 'red');
      return false;
    }

    return true;
  },

  // 4. 비밀번호 변경 테스트 (로그인 필요)
  async testPasswordChange() {
    log('\n=== 4. 비밀번호 변경 테스트 ===', 'cyan');

    // 성공 케이스
    log('4-1. 정상 비밀번호 변경', 'yellow');
    const changeData = {
      current_password: 'NewPass1234!',
      new_password: 'FinalPass1234!',
    };

    const changeRes = await request('PUT', '/auth/change-password', changeData, authToken);
    if (changeRes.ok && changeRes.data.success) {
      log('✓ 비밀번호 변경 성공', 'green');
      log(`  - 메시지: ${changeRes.data.message}`);
    } else {
      log('✗ 비밀번호 변경 실패', 'red');
      log(`  - 에러: ${JSON.stringify(changeRes.data)}`);
      return false;
    }

    // 변경된 비밀번호로 로그인 확인
    log('4-2. 변경된 비밀번호로 로그인', 'yellow');
    const finalLoginData = {
      loginId: 'testuser01',
      password: 'FinalPass1234!',
    };

    const finalLoginRes = await request('POST', '/auth/login', finalLoginData);
    if (finalLoginRes.ok && finalLoginRes.data.success) {
      log('✓ 변경된 비밀번호로 로그인 성공', 'green');
    } else {
      log('✗ 변경된 비밀번호 로그인 실패', 'red');
      return false;
    }

    // 실패 케이스: 현재 비밀번호 불일치
    log('4-3. 현재 비밀번호 불일치 (실패 예상)', 'yellow');
    const wrongCurrentData = {
      current_password: 'WrongPassword!',
      new_password: 'AnotherPass1234!',
    };

    const wrongCurrentRes = await request('PUT', '/auth/change-password', wrongCurrentData, authToken);
    if (!wrongCurrentRes.ok) {
      log('✓ 현재 비밀번호 검증 정상 작동', 'green');
    } else {
      log('✗ 현재 비밀번호 검증 실패', 'red');
      return false;
    }

    // 실패 케이스: 인증 토큰 없음
    log('4-4. 인증 토큰 없음 (실패 예상)', 'yellow');
    const noTokenRes = await request('PUT', '/auth/change-password', changeData);
    if (!noTokenRes.ok) {
      log('✓ 인증 검증 정상 작동', 'green');
    } else {
      log('✗ 인증 검증 실패', 'red');
      return false;
    }

    return true;
  },
};

// 메인 테스트 실행
async function runTests() {
  log('\n########################################', 'cyan');
  log('# Phase 2: 인증 모듈 통합 테스트', 'cyan');
  log('########################################\n', 'cyan');

  const results = {
    signup: await tests.testSignup(),
    login: await tests.testLogin(),
    resetPassword: await tests.testPasswordReset(),
    changePassword: await tests.testPasswordChange(),
  };

  // 결과 요약
  log('\n========================================', 'cyan');
  log('테스트 결과 요약', 'cyan');
  log('========================================', 'cyan');

  const testNames = {
    signup: '1. 회원가입',
    login: '2. 로그인',
    resetPassword: '3. 비밀번호 찾기',
    changePassword: '4. 비밀번호 변경',
  };

  let passCount = 0;
  let totalCount = 0;

  for (const [key, result] of Object.entries(results)) {
    totalCount++;
    if (result) {
      passCount++;
      log(`✓ ${testNames[key]}: 통과`, 'green');
    } else {
      log(`✗ ${testNames[key]}: 실패`, 'red');
    }
  }

  log('========================================', 'cyan');
  log(`전체: ${passCount}/${totalCount} 통과`, passCount === totalCount ? 'green' : 'yellow');
  log('========================================\n', 'cyan');

  if (passCount === totalCount) {
    log('🎉 모든 테스트를 통과했습니다!', 'green');
    process.exit(0);
  } else {
    log('⚠️  일부 테스트가 실패했습니다.', 'red');
    process.exit(1);
  }
}

// 실행
runTests().catch((error) => {
  log(`\n치명적 오류: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
