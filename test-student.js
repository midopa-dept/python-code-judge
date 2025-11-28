const { chromium } = require('playwright');

// 테스트 대상 URL
const TARGET_URL = 'http://localhost:5174';
const STUDENT_USERNAME = 'teststudent2025';
const STUDENT_PASSWORD = 'TestPass123!';
const STUDENT_NAME = '테스트학생';

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
  console.log('Python Judge 학생 기능 테스트');
  console.log('='.repeat(80));
  console.log(`테스트 URL: ${TARGET_URL}`);
  console.log(`학생 계정: ${STUDENT_USERNAME}`);
  console.log('='.repeat(80));
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 1. 메인 페이지 접속
    console.log('\n📌 테스트 1: 메인 페이지 접속');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: 'student-01-main-page.png', fullPage: true });
    addResult('passed', '메인 페이지 로드', `페이지 제목: ${await page.title()}`);

    // 2. 회원가입 페이지 이동
    console.log('\n📌 테스트 2: 회원가입 페이지 접근');
    const signupLink = await page.locator('a[href="/signup"], a:has-text("회원가입")').first();
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-02-signup-page.png', fullPage: true });
      addResult('passed', '회원가입 페이지 이동', '페이지 로드 성공');
    } else {
      await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'student-02-signup-page.png', fullPage: true });
      addResult('warnings', '회원가입 링크 없음', '직접 URL로 이동');
    }

    // 3. 회원가입 폼 확인 및 작성
    console.log('\n📌 테스트 3: 회원가입 폼 작성');

    // 학생/관리자 탭 확인
    const studentTab = await page.locator('button:has-text("학생"), [role="tab"]:has-text("학생")').first();
    if (await studentTab.count() > 0) {
      await studentTab.click();
      await page.waitForTimeout(500);
      addResult('passed', '학생 탭 선택', '학생 회원가입 탭 클릭됨');
    }

    // 회원가입 폼 요소 찾기
    const formFields = [
      { name: '아이디', selector: 'input[name="loginId"], input[name="username"], input[placeholder*="아이디"]' },
      { name: '이름', selector: 'input[name="name"], input[placeholder*="이름"]' },
      { name: '비밀번호', selector: 'input[name="password"], input[type="password"]' },
      { name: '비밀번호 확인', selector: 'input[name="passwordConfirm"], input[name="confirmPassword"]' }
    ];

    const fieldValues = {
      '아이디': STUDENT_USERNAME,
      '이름': STUDENT_NAME,
      '비밀번호': STUDENT_PASSWORD,
      '비밀번호 확인': STUDENT_PASSWORD
    };

    for (const field of formFields) {
      const element = await page.locator(field.selector).first();
      if (await element.count() > 0) {
        await element.fill(fieldValues[field.name]);
        addResult('passed', `회원가입 폼: ${field.name}`, '필드 입력 완료');
      } else {
        addResult('failed', `회원가입 폼: ${field.name}`, '필드를 찾을 수 없음');
      }
    }

    await page.screenshot({ path: 'student-03-signup-form-filled.png', fullPage: true });

    // 4. 회원가입 제출
    console.log('\n📌 테스트 4: 회원가입 제출');
    const submitButton = await page.locator('button[type="submit"], button:has-text("회원가입")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'student-04-after-signup.png', fullPage: true });

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        addResult('passed', '회원가입 완료', '로그인 페이지로 리다이렉트됨');
      } else if (currentUrl.includes('/signup')) {
        // 에러 메시지 확인
        const errorMessage = await page.locator('.error, [class*="error"], .text-red').first();
        if (await errorMessage.count() > 0) {
          const errorText = await errorMessage.textContent();
          addResult('failed', '회원가입 실패', `에러 메시지: ${errorText}`);
        } else {
          addResult('failed', '회원가입 상태 불명', '회원가입 페이지에 머물러 있음');
        }
      } else {
        addResult('warnings', '회원가입 후 이동', `예상치 못한 URL: ${currentUrl}`);
      }
    } else {
      addResult('failed', '회원가입 버튼', '제출 버튼을 찾을 수 없음');
    }

    // 5. 로그인 시도
    console.log('\n📌 테스트 5: 학생 계정 로그인');

    // 로그인 페이지로 이동 (아직 로그인 페이지가 아니라면)
    if (!page.url().includes('/login')) {
      await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle' });
    }

    // 학생 탭 선택
    const studentLoginTab = await page.locator('button:has-text("학생"), [role="tab"]:has-text("학생")').first();
    if (await studentLoginTab.count() > 0) {
      await studentLoginTab.click();
      await page.waitForTimeout(500);
    }

    const loginIdInput = await page.locator('input[name="username"], input[name="loginId"], input[type="text"]').first();
    const loginPasswordInput = await page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();

    if (await loginIdInput.count() > 0 && await loginPasswordInput.count() > 0) {
      await loginIdInput.fill(STUDENT_USERNAME);
      await loginPasswordInput.fill(STUDENT_PASSWORD);
      await page.screenshot({ path: 'student-05-before-login.png', fullPage: true });

      await loginButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'student-06-after-login.png', fullPage: true });

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        addResult('failed', '학생 로그인', '로그인 후에도 로그인 페이지에 머물러 있음');
      } else {
        addResult('passed', '학생 로그인', `로그인 성공, 현재 URL: ${currentUrl}`);
      }
    } else {
      addResult('failed', '로그인 폼', '로그인 폼 필드를 찾을 수 없음');
    }

    // 6. 문제 목록 확인
    console.log('\n📌 테스트 6: 문제 목록 페이지');
    const problemsMenu = await page.locator('a[href*="/problem"], a:has-text("문제")').first();
    if (await problemsMenu.count() > 0) {
      await problemsMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-07-problems-list.png', fullPage: true });
      addResult('passed', '문제 목록 페이지', '페이지 로드 성공');

      // 문제 카드/리스트 확인
      const problemItems = await page.locator('.problem-card, .problem-item, [class*="problem"]').count();
      addResult('passed', '문제 목록 표시', `${problemItems}개의 문제 항목 발견됨`);
    } else {
      addResult('warnings', '문제 목록 메뉴', '문제 메뉴를 찾을 수 없음');
    }

    // 7. 특정 문제 상세 페이지
    console.log('\n📌 테스트 7: 문제 상세 페이지');
    const firstProblem = await page.locator('.problem-card, .problem-item, [class*="problem"]').first();
    if (await firstProblem.count() > 0) {
      await firstProblem.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-08-problem-detail.png', fullPage: true });
      addResult('passed', '문제 상세 페이지', '페이지 로드 성공');

      // 코드 에디터 확인
      const codeEditor = await page.locator('textarea, .monaco-editor, [class*="editor"]').first();
      if (await codeEditor.count() > 0) {
        addResult('passed', '코드 에디터', '코드 에디터 UI 발견됨');
      } else {
        addResult('warnings', '코드 에디터', '코드 에디터를 찾을 수 없음');
      }

      // 제출 버튼 확인
      const submitCodeButton = await page.locator('button:has-text("제출"), button:has-text("채점")').first();
      if (await submitCodeButton.count() > 0) {
        addResult('passed', '코드 제출 버튼', '제출 버튼 발견됨');
      } else {
        addResult('warnings', '코드 제출 버튼', '제출 버튼을 찾을 수 없음');
      }
    } else {
      addResult('warnings', '첫 번째 문제', '문제를 찾을 수 없음');
    }

    // 8. 마이페이지/프로필
    console.log('\n📌 테스트 8: 마이페이지');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    const myPageMenu = await page.locator('a[href*="/my"], a[href*="/profile"], a:has-text("마이페이지"), a:has-text("프로필")').first();
    if (await myPageMenu.count() > 0) {
      await myPageMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-09-mypage.png', fullPage: true });
      addResult('passed', '마이페이지', '페이지 로드 성공');
    } else {
      addResult('warnings', '마이페이지 메뉴', '마이페이지 메뉴를 찾을 수 없음');
    }

    // 9. 제출 이력
    console.log('\n📌 테스트 9: 제출 이력');
    const submissionsMenu = await page.locator('a[href*="/submission"], a:has-text("제출"), a:has-text("이력")').first();
    if (await submissionsMenu.count() > 0) {
      await submissionsMenu.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-10-submissions.png', fullPage: true });
      addResult('passed', '제출 이력 페이지', '페이지 로드 성공');
    } else {
      addResult('warnings', '제출 이력 메뉴', '제출 이력 메뉴를 찾을 수 없음');
    }

    // 10. 로그아웃
    console.log('\n📌 테스트 10: 로그아웃');
    const logoutButton = await page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'student-11-after-logout.png', fullPage: true });

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
    await page.screenshot({ path: 'student-error.png', fullPage: true });
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
