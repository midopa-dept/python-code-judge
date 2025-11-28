const { chromium } = require('playwright');

// 테스트 대상 URL
const TARGET_URL = 'http://localhost:5174';
const ADMIN_USERNAME = 'teacher';
const ADMIN_PASSWORD = 'malware2025';

// 테스트 결과 저장
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function addResult(type, test, details) {
  testResults[type].push({ test, details, timestamp: new Date().toISOString() });
  const emoji = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${emoji} ${test}: ${details}`);
}

(async () => {
  console.log('='.repeat(80));
  console.log('Python Judge 관리자 페이지 기능 테스트');
  console.log('='.repeat(80));
  console.log(`테스트 URL: ${TARGET_URL}`);
  console.log(`관리자 계정: ${ADMIN_USERNAME}`);
  console.log('='.repeat(80));
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300 // 액션을 천천히 실행하여 시각적으로 확인
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 1. 메인 페이지 접속 테스트
    console.log('\n📌 테스트 1: 메인 페이지 접속');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: 'admin-01-main-page.png', fullPage: true });

    const title = await page.title();
    addResult('passed', '메인 페이지 로드', `페이지 제목: ${title}`);

    // 2. 로그인 페이지 이동
    console.log('\n📌 테스트 2: 로그인 페이지 접근');
    const loginButton = await page.locator('a[href="/login"], button:has-text("로그인")').first();
    if (await loginButton.count() > 0) {
      await loginButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });
      await page.screenshot({ path: 'admin-02-login-page.png', fullPage: true });
      addResult('passed', '로그인 페이지 이동', 'URL 변경 확인됨');
    } else {
      // 이미 로그인 페이지에 있을 수 있음
      if (page.url().includes('/login')) {
        addResult('passed', '로그인 페이지', '이미 로그인 페이지에 위치');
      } else {
        await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle' });
        addResult('warnings', '로그인 버튼 없음', '직접 URL로 이동');
      }
    }

    // 3. 관리자 로그인 테스트
    console.log('\n📌 테스트 3: 관리자 로그인');

    // 로그인 폼 요소 찾기
    const usernameInput = await page.locator('input[name="username"], input[name="loginId"], input[type="text"]').first();
    const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();

    if (await usernameInput.count() === 0) {
      addResult('failed', '로그인 폼', '아이디 입력 필드를 찾을 수 없음');
    } else if (await passwordInput.count() === 0) {
      addResult('failed', '로그인 폼', '비밀번호 입력 필드를 찾을 수 없음');
    } else {
      await usernameInput.fill(ADMIN_USERNAME);
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.screenshot({ path: 'admin-03-before-login.png', fullPage: true });

      await submitButton.click();

      // 로그인 후 리다이렉트 대기
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'admin-04-after-login.png', fullPage: true });

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        addResult('failed', '관리자 로그인', '로그인 후에도 로그인 페이지에 머물러 있음');
      } else {
        addResult('passed', '관리자 로그인', `로그인 성공, 현재 URL: ${currentUrl}`);
      }
    }

    // 4. 관리자 대시보드/네비게이션 확인
    console.log('\n📌 테스트 4: 관리자 대시보드');
    await page.waitForTimeout(1000);

    // 관리자 메뉴 확인
    const adminMenus = [
      { text: '문제', selector: 'a:has-text("문제")' },
      { text: '세션', selector: 'a:has-text("세션")' },
      { text: '학생', selector: 'a:has-text("학생")' },
      { text: '관리', selector: 'a:has-text("관리")' }
    ];

    for (const menu of adminMenus) {
      const menuItem = await page.locator(menu.selector).first();
      if (await menuItem.count() > 0) {
        addResult('passed', `관리자 메뉴: ${menu.text}`, '메뉴 항목 발견됨');
      } else {
        addResult('warnings', `관리자 메뉴: ${menu.text}`, '메뉴 항목을 찾을 수 없음');
      }
    }

    // 5. 문제 관리 페이지 테스트
    console.log('\n📌 테스트 5: 문제 관리 페이지');
    const problemMenu = await page.locator('a[href*="/admin/problem"], a:has-text("문제 관리")').first();
    if (await problemMenu.count() > 0) {
      await problemMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'admin-05-problem-management.png', fullPage: true });
      addResult('passed', '문제 관리 페이지', '페이지 로드 성공');

      // 문제 목록 확인
      const problemList = await page.locator('table, .problem-list, [class*="problem"]').first();
      if (await problemList.count() > 0) {
        addResult('passed', '문제 목록', '문제 목록 UI 발견됨');
      } else {
        addResult('warnings', '문제 목록', '문제 목록 UI를 찾을 수 없음');
      }

      // 문제 등록 버튼 확인
      const createButton = await page.locator('button:has-text("등록"), button:has-text("추가"), a:has-text("등록")').first();
      if (await createButton.count() > 0) {
        addResult('passed', '문제 등록 버튼', '문제 등록 버튼 발견됨');

        // 문제 등록 페이지로 이동
        await createButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'admin-06-problem-create.png', fullPage: true });

        // 문제 등록 폼 요소 확인
        const formElements = {
          '제목': 'input[name="title"], input[placeholder*="제목"]',
          '설명': 'textarea[name="description"], textarea[placeholder*="설명"]',
          '카테고리': 'select[name="category"], input[name="category"]',
          '난이도': 'select[name="difficulty"], input[name="difficulty"]'
        };

        for (const [field, selector] of Object.entries(formElements)) {
          const element = await page.locator(selector).first();
          if (await element.count() > 0) {
            addResult('passed', `문제 등록 폼: ${field}`, '필드 발견됨');
          } else {
            addResult('warnings', `문제 등록 폼: ${field}`, '필드를 찾을 수 없음');
          }
        }

        // 뒤로 가기
        await page.goBack();
        await page.waitForTimeout(1000);
      } else {
        addResult('warnings', '문제 등록 버튼', '문제 등록 버튼을 찾을 수 없음');
      }
    } else {
      addResult('failed', '문제 관리 페이지', '문제 관리 메뉴를 찾을 수 없음');
    }

    // 6. 세션 관리 페이지 테스트
    console.log('\n📌 테스트 6: 세션 관리 페이지');
    const sessionMenu = await page.locator('a[href*="/admin/session"], a:has-text("세션")').first();
    if (await sessionMenu.count() > 0) {
      await sessionMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'admin-07-session-management.png', fullPage: true });
      addResult('passed', '세션 관리 페이지', '페이지 로드 성공');

      // 세션 목록 확인
      const sessionList = await page.locator('table, .session-list, [class*="session"]').first();
      if (await sessionList.count() > 0) {
        addResult('passed', '세션 목록', '세션 목록 UI 발견됨');
      } else {
        addResult('warnings', '세션 목록', '세션 목록 UI를 찾을 수 없음');
      }

      // 세션 생성 버튼 확인
      const createSessionButton = await page.locator('button:has-text("생성"), button:has-text("추가"), a:has-text("세션")').first();
      if (await createSessionButton.count() > 0) {
        addResult('passed', '세션 생성 버튼', '세션 생성 버튼 발견됨');
      } else {
        addResult('warnings', '세션 생성 버튼', '세션 생성 버튼을 찾을 수 없음');
      }
    } else {
      addResult('warnings', '세션 관리 페이지', '세션 관리 메뉴를 찾을 수 없음');
    }

    // 7. 학생 관리 페이지 테스트
    console.log('\n📌 테스트 7: 학생 관리 페이지');
    const studentMenu = await page.locator('a[href*="/admin/student"], a:has-text("학생")').first();
    if (await studentMenu.count() > 0) {
      await studentMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'admin-08-student-management.png', fullPage: true });
      addResult('passed', '학생 관리 페이지', '페이지 로드 성공');

      // 학생 목록 확인
      const studentList = await page.locator('table, .student-list, [class*="student"]').first();
      if (await studentList.count() > 0) {
        addResult('passed', '학생 목록', '학생 목록 UI 발견됨');
      } else {
        addResult('warnings', '학생 목록', '학생 목록 UI를 찾을 수 없음');
      }
    } else {
      addResult('warnings', '학생 관리 페이지', '학생 관리 메뉴를 찾을 수 없음');
    }

    // 8. 로그아웃 테스트
    console.log('\n📌 테스트 8: 로그아웃');
    const logoutButton = await page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'admin-09-after-logout.png', fullPage: true });

      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl === TARGET_URL + '/') {
        addResult('passed', '로그아웃', '로그아웃 성공');
      } else {
        addResult('warnings', '로그아웃', `로그아웃 후 예상치 못한 URL: ${currentUrl}`);
      }
    } else {
      addResult('warnings', '로그아웃 버튼', '로그아웃 버튼을 찾을 수 없음');
    }

  } catch (error) {
    addResult('failed', '예외 발생', error.message);
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'admin-error.png', fullPage: true });
  } finally {
    await context.close();
    await browser.close();
  }

  // 테스트 결과 요약
  console.log('\n');
  console.log('='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));
  console.log(`✅ 통과: ${testResults.passed.length}개`);
  console.log(`❌ 실패: ${testResults.failed.length}개`);
  console.log(`⚠️  경고: ${testResults.warnings.length}개`);
  console.log('='.repeat(80));

  if (testResults.failed.length > 0) {
    console.log('\n실패한 테스트:');
    testResults.failed.forEach(result => {
      console.log(`  ❌ ${result.test}: ${result.details}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n경고:');
    testResults.warnings.forEach(result => {
      console.log(`  ⚠️  ${result.test}: ${result.details}`);
    });
  }

  console.log('\n📸 스크린샷은 프로젝트 루트 디렉토리에 저장되었습니다.');
})();
