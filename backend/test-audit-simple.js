/**
 * 간단한 감사 로그 테스트
 */

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('=== 감사 로그 테스트 시작 ===\n');

  // 1. 슈퍼 관리자 로그인
  console.log('[1] 슈퍼 관리자 로그인...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'super_admin',
      password: 'admin123',
      loginType: 'admin',
    }),
  });

  const loginData = await loginRes.json();
  console.log('상태 코드:', loginRes.status);
  console.log('응답:', JSON.stringify(loginData, null, 2));

  if (!loginRes.ok) {
    console.error('\n로그인 실패!');
    return;
  }

  const token = loginData.data.token;
  console.log('\n✓ 로그인 성공\n');

  // 2. 감사 로그 조회
  console.log('[2] 감사 로그 조회...');
  const logsRes = await fetch(`${BASE_URL}/audit-logs?limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const logsData = await logsRes.json();
  console.log('상태 코드:', logsRes.status);
  console.log('응답:', JSON.stringify(logsData, null, 2));

  if (logsRes.ok && logsData.data) {
    console.log(`\n✓ 총 ${logsData.pagination.total}개의 로그 발견`);
    console.log(`  최근 로그 ${logsData.data.length}개 반환됨\n`);
  }

  console.log('\n=== 테스트 완료 ===');
}

test().catch(console.error);
