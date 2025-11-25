# Python Judge 프로젝트 구조 설계 원칙

**버전**: 1.0
**최종 수정일**: 2025-11-25
**작성자**: Architecture Review
**상태**: 확정

## 변경 이력

| 버전 | 날짜       | 변경 내용 | 작성자              |
| ---- | ---------- | --------- | ------------------- |
| 1.0  | 2025-11-25 | 초안 작성 | Architecture Review |

---

## 1. 최상위 아키텍처 원칙

### 1.1 단순성 우선 (Simplicity First)

**원칙**: 복잡도를 최소화하고, 명확하고 이해하기 쉬운 구조를 유지합니다.

**이유**:

- 소규모 팀(2명)과 제한된 사용자(초기 24명)로 시작
- 빠른 개발과 유지보수 용이성이 핵심
- 과도한 추상화는 오히려 생산성 저하

**적용 방법**:

```
- 3-tier 아키텍처 (Presentation - Application - Data)
- 서버리스 배포로 인프라 관리 복잡도 제거
- 필요한 경우에만 추상화 레이어 추가
- YAGNI (You Aren't Gonna Need It) 원칙 준수
```

**예시**:

```javascript
// GOOD: 단순하고 명확한 구조
router.post("/submissions", authMiddleware, submissionController.submit);

// AVOID: 불필요한 추상화 (초기 단계)
router.post(
  "/submissions",
  composePipeline(
    authStrategy,
    validationStrategy,
    rateLimitStrategy,
    submissionStrategy
  )
);
```

### 1.2 관심사의 분리 (Separation of Concerns)

**원칙**: 각 모듈과 계층은 명확한 책임을 가지며, 다른 관심사와 섞이지 않습니다.

**이유**:

- 코드 재사용성 향상
- 테스트 용이성 증대
- 변경의 영향 범위 최소화

**적용 방법**:

```
- 비즈니스 로직은 서비스 계층에만 위치
- 데이터 접근은 리포지토리/DAO 패턴 사용
- 프레젠테이션 로직은 컨트롤러/컴포넌트에만 위치
- 횡단 관심사(인증, 로깅)는 미들웨어로 분리
```

**예시**:

```javascript
// Backend 계층 분리
// controllers/submissionController.js - HTTP 요청/응답 처리
// services/submissionService.js - 비즈니스 로직
// repositories/submissionRepository.js - 데이터베이스 접근
// middlewares/authMiddleware.js - 인증 확인

// Frontend 계층 분리
// components/SubmissionForm.jsx - UI 렌더링
// hooks/useSubmission.js - 상태 관리 및 API 호출
// api/submissionApi.js - HTTP 클라이언트
```

### 1.3 모놀리스-우선, 모듈러 설계 (Modular Monolith)

**원칙**: 단일 배포 단위를 유지하되, 내부적으로는 명확한 모듈 경계를 가집니다.

**이유**:

- Vercel 서버리스 환경에서 마이크로서비스는 과도한 복잡도
- 초기 규모에서는 모놀리스가 효율적
- 향후 필요 시 모듈 단위로 분리 가능하도록 설계

**적용 방법**:

```
backend/
  src/
    modules/
      auth/        # 인증 모듈 (독립적)
      problems/    # 문제 관리 모듈
      submissions/ # 제출 및 채점 모듈
      sessions/    # 세션 관리 모듈
      users/       # 사용자 관리 모듈
```

**각 모듈은**:

- 독립적인 데이터베이스 스키마 관리
- 독립적인 비즈니스 로직
- 명확한 공개 인터페이스(API)
- 다른 모듈의 내부 구현에 의존하지 않음

### 1.4 실용주의 (Pragmatism over Purity)

**원칙**: 이론적 완벽함보다는 실제 문제 해결과 배포 속도를 우선합니다.

**이유**:

- MVP 3개월 개발 목표
- 제한된 리소스(인력, 시간)
- 실제 사용자 피드백이 아키텍처 개선보다 중요

**적용 방법**:

```
- 초기에는 동기 처리 (비동기 큐 도입 보류)
- 캐시 레이어 없이 시작 (필요 시 Redis 추가)
- 데이터베이스 정규화보다 읽기 성능 우선
- 폴링 방식 사용 (WebSocket 대신)
```

**판단 기준**:

- 성능 문제가 실제로 발생했는가?
- 사용자 경험에 부정적 영향이 있는가?
- 개선의 비용 대비 효과가 명확한가?

### 1.5 보안 우선 설계 (Security by Design)

**원칙**: 보안은 나중에 추가하는 것이 아닌, 설계 단계부터 반영합니다.

**이유**:

- Python 코드 실행이라는 높은 보안 위험성
- 학생 개인정보 보호 필요
- 시스템 악용 방지 (악의적 코드, 리소스 남용)

**적용 방법**:

```
1. Defense in Depth (다층 방어)
   - AST 정적 분석 (1차 방어)
   - subprocess 프로세스 격리 (2차 방어)
   - 타임아웃 및 리소스 제한 (3차 방어)

2. Least Privilege (최소 권한)
   - 실행 환경: 최소한의 모듈만 허용
   - 데이터베이스: 역할별 권한 분리
   - API: RBAC 기반 엔드포인트 접근 제어

3. Fail Secure (안전한 실패)
   - 에러 발생 시 실행 중단
   - 의심스러운 패턴 발견 시 차단
   - 기본값은 항상 거부(deny by default)
```

**예시**:

```javascript
// 코드 실행 파이프라인
async function executeCode(code, testCases) {
  // 1차 방어: AST 정적 분석
  await validateCodeAST(code); // 금지 모듈/함수 검사

  // 2차 방어: 프로세스 격리
  const result = await runInSandbox(code, {
    timeout: 10000, // 10초 타임아웃
    maxMemory: 256, // 256MB 메모리 제한
    allowedModules: WHITELIST,
  });

  // 3차 방어: 결과 검증
  validateExecutionResult(result);

  return result;
}
```

---

## 2. 의존성 및 레이어 원칙

### 2.1 의존성 역전 원칙 (Dependency Inversion)

**원칙**: 상위 레벨 모듈은 하위 레벨 모듈에 의존하지 않으며, 둘 다 추상화에 의존합니다.

**이유**:

- 테스트 용이성 (모킹 가능)
- 구현 교체 용이성 (예: Supabase → 다른 DB)
- 순환 의존성 방지

**적용 방법**:

```javascript
// GOOD: 서비스는 인터페이스(추상)에 의존
class SubmissionService {
  constructor(submissionRepository, judgingEngine) {
    this.submissionRepository = submissionRepository;
    this.judgingEngine = judgingEngine;
  }

  async submitCode(studentId, problemId, code) {
    // 비즈니스 로직
    const submission = await this.submissionRepository.create({...});
    const result = await this.judgingEngine.judge(code, testCases);
    return result;
  }
}

// BAD: 서비스가 구체 구현에 직접 의존
class SubmissionService {
  async submitCode(studentId, problemId, code) {
    const submission = await supabase.from('submissions').insert({...});
    const result = await subprocess.run(['python3', code]);
    // ...
  }
}
```

### 2.2 계층 간 의존성 방향

**원칙**: 의존성은 항상 외부에서 내부로, 상위에서 하위로 흐릅니다.

```
Presentation Layer (Controllers, Components)
        ↓
Application Layer (Services, Use Cases)
        ↓
Domain Layer (Entities, Business Rules)
        ↓
Infrastructure Layer (Repositories, External APIs)
```

**규칙**:

- Controllers는 Services를 호출 (역방향 호출 금지)
- Services는 Repositories를 호출
- Repositories는 Database를 호출
- Database/External APIs는 다른 레이어를 호출하지 않음

**예외 처리**:

- 하위 레이어에서 상위로 이벤트 발행 (옵저버 패턴) 허용
- 미들웨어는 횡단 관심사로 모든 레이어 접근 가능

### 2.3 모듈 간 의존성 관리

**원칙**: 모듈 간 의존성은 공개 인터페이스를 통해서만 이루어집니다.

**적용 방법**:

```javascript
// modules/problems/index.js (공개 인터페이스)
export { ProblemService } from "./services/problemService";
export { ProblemController } from "./controllers/problemController";
// 내부 구현은 노출하지 않음

// modules/submissions/services/submissionService.js
import { ProblemService } from "../../problems"; // OK
// import { ProblemRepository } from '../../problems/repositories/problemRepository'; // FORBIDDEN
```

**의존성 규칙**:

```
auth ← 모든 모듈 (인증은 공통 의존성)
submissions → problems (문제 정보 조회)
sessions → problems, submissions (세션은 문제와 제출 의존)
users ← auth (사용자 정보는 인증 모듈이 사용)
```

### 2.4 공유 코드 관리

**원칙**: 공통 로직은 shared 폴더에 집중하되, 과도한 공유는 지양합니다.

**적용 방법**:

```
backend/
  src/
    shared/
      utils/          # 순수 유틸리티 함수
        dateUtils.js
        stringUtils.js
      constants/      # 전역 상수
        errors.js
        config.js
      types/          # 공통 TypeScript 타입
        common.ts
      middlewares/    # 공통 미들웨어
        authMiddleware.js
        errorHandler.js
```

**공유 가능 조건**:

- 3개 이상 모듈에서 사용
- 명확한 단일 책임
- 외부 의존성 최소화

**공유 불가능**:

- 도메인 특화 로직
- 2개 모듈에서만 사용 (중복 허용)

---

## 3. 코드 작성 및 네이밍 원칙

### 3.1 명명 규칙 (Naming Conventions)

#### Backend (Node.js + Express)

**파일 및 폴더**:

- 폴더명: `camelCase` (예: `submissionService`)
- 파일명: `camelCase.js` (예: `submissionController.js`)
- 클래스 파일: `PascalCase.js` (예: `SubmissionService.js`)
- 테스트 파일: `*.test.js` (예: `submissionService.test.js`)

**코드**:

```javascript
// 클래스: PascalCase
class SubmissionService { }

// 함수/메서드: camelCase
function submitCode() { }
async function judgeSubmission() { }

// 변수: camelCase
const studentId = 1;
const submissionResult = await ...;

// 상수: UPPER_SNAKE_CASE
const MAX_CODE_SIZE = 64 * 1024;
const JUDGING_TIMEOUT = 30000;

// private 메서드: _camelCase (관례)
class Service {
  _validateInput() { }
}
```

**데이터베이스**:

- 테이블명: `snake_case` 복수형 (예: `submissions`, `test_cases`)
- 컬럼명: `snake_case` (예: `student_id`, `created_at`)
- 인덱스: `idx_table_column` (예: `idx_submissions_student_id`)
- 외래키: `fk_table_column` (예: `fk_submissions_problem_id`)

#### Frontend (React + Tailwind)

**파일 및 폴더**:

- 컴포넌트 파일: `PascalCase.jsx` (예: `SubmissionForm.jsx`)
- 훅 파일: `use*.js` (예: `useSubmission.js`)
- 유틸 파일: `camelCase.js` (예: `apiClient.js`)
- 폴더명: `camelCase` (예: `components/`, `hooks/`)

**코드**:

```javascript
// 컴포넌트: PascalCase
function SubmissionForm() {}
const ProblemCard = () => {};

// 훅: useCamelCase
function useSubmission() {}
function useProblemList(category) {}

// Props: camelCase
function Component({ studentId, onSubmit }) {}

// State: camelCase
const [isLoading, setIsLoading] = useState(false);

// 이벤트 핸들러: handle* 또는 on*
const handleSubmit = () => {};
<button onClick={handleClick}>Submit</button>;
```

### 3.2 함수 및 메서드 설계

**원칙**: 함수는 한 가지 일만 하며, 작고 명확해야 합니다.

**함수 크기**:

- 최대 50줄 권장 (스크롤 없이 한 화면)
- 중첩 깊이 최대 3단계
- 파라미터 최대 5개 (넘으면 객체로 묶기)

**예시**:

```javascript
// GOOD: 단일 책임
async function submitCode(studentId, problemId, code) {
  await validateSubmission(studentId, problemId, code);
  const submission = await createSubmission(studentId, problemId, code);
  await queueForJudging(submission.id);
  return submission;
}

// BAD: 너무 많은 책임
async function submitCodeAndJudgeAndUpdateScoreboard(...) {
  // 100+ lines...
}
```

**함수 명명 패턴**:

```javascript
// 조회: get*, find*, fetch*
getSubmissionById(id);
findSubmissionsByStudent(studentId);
fetchProblemsInCategory(category);

// 생성: create*, add*
createSubmission(data);
addTestCase(problemId, testCase);

// 수정: update*, modify*
updateProblemTitle(id, newTitle);
modifySessionStatus(id, status);

// 삭제: delete*, remove*
deleteSubmission(id);
removeProblemFromSession(sessionId, problemId);

// 검증: validate*, check*, verify*
validateCode(code);
checkPermission(userId, action);
verifyTestCase(input, output);

// 변환: to*, from*, convert*
toDTO(entity);
fromJSON(json);
convertToAST(code);
```

### 3.3 주석 및 문서화

**원칙**: 코드는 자체 설명적이어야 하며, 주석은 "왜"를 설명합니다.

**필수 주석**:

```javascript
/**
 * 제출된 Python 코드를 자동 채점합니다.
 *
 * @param {number} submissionId - 제출 ID
 * @param {Array} testCases - 테스트 케이스 배열
 * @returns {Promise<Object>} 채점 결과 (status, passedCases, executionTime)
 * @throws {ValidationError} 코드에 금지된 모듈이 포함된 경우
 * @throws {TimeoutError} 채점 시간이 30초를 초과한 경우
 */
async function judgeSubmission(submissionId, testCases) {
  // ...
}
```

**왜 주석 (Good)**:

```javascript
// Vercel 서버리스는 WebSocket을 지원하지 않으므로 폴링 사용
setInterval(() => fetchScoreboard(), 5000);

// AST 파싱으로 런타임 실행 전 악의적 코드 차단
const ast = parseAST(code);
validateNoForbiddenModules(ast);
```

**무엇 주석 (Bad - 삭제 필요)**:

```javascript
// studentId를 1 증가시킴
studentId = studentId + 1;

// 제출을 생성함
const submission = await createSubmission(...);
```

### 3.4 에러 처리

**원칙**: 에러는 명확하게 분류하고, 적절한 레벨에서 처리합니다.

**에러 계층**:

```javascript
// shared/errors/
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}
```

**에러 처리 패턴**:

```javascript
// 컨트롤러: 에러를 미들웨어로 전달
async function submitCode(req, res, next) {
  try {
    const result = await submissionService.submitCode(...);
    res.json(result);
  } catch (error) {
    next(error); // 에러 미들웨어가 처리
  }
}

// 서비스: 비즈니스 에러를 명확히 표현
async function submitCode(studentId, problemId, code) {
  if (code.length > MAX_CODE_SIZE) {
    throw new ValidationError(`Code size exceeds ${MAX_CODE_SIZE} bytes`);
  }

  const problem = await problemRepository.findById(problemId);
  if (!problem) {
    throw new NotFoundError('Problem');
  }

  // ...
}

// 에러 미들웨어: 중앙 집중 처리
function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // 예상치 못한 에러는 로그 후 일반 메시지
  logger.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}
```

---

## 4. 테스트 및 품질 원칙

### 4.1 테스트 전략

**테스트 피라미드**:

```
      /\
     /E2E\          적음 (10%)
    /------\
   /Integration\    중간 (30%)
  /------------\
 /   Unit Tests  \  많음 (60%)
/----------------\
```

**테스트 우선순위**:

1. 핵심 비즈니스 로직 (채점 엔진, 보안 검증)
2. API 엔드포인트 (통합 테스트)
3. 유틸리티 함수 (단위 테스트)
4. UI 컴포넌트 (스냅샷 테스트)

**테스트 작성 기준**:

- 복잡한 로직 (분기가 3개 이상)
- 보안 관련 코드 (AST 분석, 샌드박스)
- 금액/점수 계산 로직
- 외부 API 연동

### 4.2 단위 테스트 (Unit Tests)

**프레임워크**: Jest

**원칙**:

- 각 테스트는 독립적
- 외부 의존성은 모킹
- AAA 패턴 (Arrange-Act-Assert)

**예시**:

```javascript
// submissionService.test.js
describe("SubmissionService", () => {
  let submissionService;
  let mockRepository;
  let mockJudgingEngine;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
    };
    mockJudgingEngine = {
      judge: jest.fn(),
    };
    submissionService = new SubmissionService(
      mockRepository,
      mockJudgingEngine
    );
  });

  describe("submitCode", () => {
    it("should create submission and return result", async () => {
      // Arrange
      const studentId = 1;
      const problemId = 1;
      const code = 'print("hello")';
      mockRepository.create.mockResolvedValue({ id: 1 });
      mockJudgingEngine.judge.mockResolvedValue({ status: "AC" });

      // Act
      const result = await submissionService.submitCode(
        studentId,
        problemId,
        code
      );

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        student_id: studentId,
        problem_id: problemId,
        code: code,
      });
      expect(result.status).toBe("AC");
    });

    it("should throw ValidationError if code size exceeds limit", async () => {
      // Arrange
      const code = "a".repeat(65 * 1024); // 65KB

      // Act & Assert
      await expect(submissionService.submitCode(1, 1, code)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
```

### 4.3 통합 테스트 (Integration Tests)

**프레임워크**: Jest + Supertest

**원칙**:

- 실제 데이터베이스 사용 (테스트 DB)
- 전체 요청 흐름 검증
- 트랜잭션 롤백으로 격리

**예시**:

```javascript
// submissionController.integration.test.js
describe("POST /api/submissions", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it("should submit code and return judging result", async () => {
    const token = await getAuthToken(testStudentId);

    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        problem_id: 1,
        code: 'print("hello")',
        python_version: "3.10",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      status: "AC",
      execution_time: expect.any(Number),
    });
  });

  it("should return 401 if not authenticated", async () => {
    await request(app)
      .post("/api/submissions")
      .send({ problem_id: 1, code: 'print("hello")' })
      .expect(401);
  });
});
```

### 4.4 E2E 테스트

**프레임워크**: Playwright (또는 Cypress)

**핵심 시나리오만**:

- 로그인 → 문제 선택 → 코드 제출 → 결과 확인
- 관리자 로그인 → 문제 등록 → 테스트 케이스 추가
- 세션 생성 → 학생 참여 → 스코어보드 확인

**예시**:

```javascript
// e2e/submission.spec.js
test("student can submit code and see result", async ({ page }) => {
  // 로그인
  await page.goto("/login");
  await page.fill('input[name="id"]', "student1");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');

  // 문제 선택
  await page.click("text=조건문");
  await page.click("text=FizzBuzz");

  // 코드 작성 및 제출
  await page.fill('textarea[name="code"]', SAMPLE_CODE);
  await page.click('button:has-text("제출")');

  // 결과 확인
  await expect(page.locator(".result-status")).toHaveText("정답 (AC)");
});
```

### 4.5 코드 품질 도구

**Linter**: ESLint

```javascript
// .eslintrc.js
module.exports = {
  extends: ["eslint:recommended", "plugin:react/recommended"],
  rules: {
    "no-console": ["warn", { allow: ["error"] }],
    "max-lines": ["warn", { max: 300 }],
    "max-depth": ["error", 3],
    complexity: ["warn", 10],
    "no-unused-vars": "error",
  },
};
```

**Formatter**: Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**커밋 훅**: Husky + lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"],
    "*.jsx": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 5. 환경 설정, 보안 및 운영 원칙

### 5.1 환경 변수 관리

**원칙**: 모든 환경별 설정은 환경 변수로 관리하며, 코드에 하드코딩하지 않습니다.

**환경 분리**:

```
.env.development    # 로컬 개발
.env.test           # 테스트
.env.production     # 프로덕션 (Vercel 환경 변수로 관리)
```

**필수 환경 변수**:

```bash
# .env.example (버전 관리에 포함)
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=2h

# Judging Engine
JUDGING_TIMEOUT=30000
MAX_CODE_SIZE=65536
PYTHON_VERSIONS=3.8,3.9,3.10,3.11,3.12

# Rate Limiting
MAX_SUBMISSIONS_PER_5SEC=1
MAX_CONCURRENT_SUBMISSIONS=3
MAX_JUDGING_QUEUE_SIZE=500

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

**접근 패턴**:

```javascript
// config/index.js
const config = {
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  },
  judging: {
    timeout: parseInt(process.env.JUDGING_TIMEOUT) || 30000,
    maxCodeSize: parseInt(process.env.MAX_CODE_SIZE) || 64 * 1024,
  },
};

// 필수 환경 변수 검증
function validateConfig() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export default config;
```

### 5.2 보안 설정

**CORS 설정**:

```javascript
// Backend (Express)
const cors = require("cors");

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://python-judge.vercel.app"
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

**보안 헤더**:

```javascript
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // React inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind inline styles
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.SUPABASE_URL],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

**Rate Limiting**:

```javascript
const rateLimit = require("express-rate-limit");

// 일반 API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 60,
  message: "Too many requests from this IP",
});

// 제출 API (더 엄격)
const submissionLimiter = rateLimit({
  windowMs: 5 * 1000, // 5초
  max: 1,
  message: "Please wait 5 seconds before submitting again",
});

app.use("/api/", apiLimiter);
app.use("/api/submissions", submissionLimiter);
```

**입력 검증**:

```javascript
const { body, validationResult } = require("express-validator");

// 제출 검증
const validateSubmission = [
  body("problem_id").isInt({ min: 1 }),
  body("code")
    .isString()
    .isLength({ max: 64 * 1024 })
    .withMessage("Code size exceeds 64KB"),
  body("python_version")
    .isIn(["3.8", "3.9", "3.10", "3.11", "3.12"])
    .withMessage("Invalid Python version"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.post(
  "/submissions",
  authMiddleware,
  validateSubmission,
  submissionController.submit
);
```

### 5.3 로깅 전략

**로깅 레벨**:

```
ERROR: 시스템 오류, 즉시 대응 필요
WARN:  비정상적이지만 처리 가능한 상황
INFO:  중요한 비즈니스 이벤트 (로그인, 제출, 채점 완료)
DEBUG: 개발 시 디버깅 정보
```

**로거 설정**:

```javascript
// utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // 프로덕션: 파일 또는 외부 서비스
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "error.log",
            level: "error",
          }),
          new winston.transports.File({ filename: "combined.log" }),
        ]
      : []),
  ],
});

module.exports = logger;
```

**로깅 패턴**:

```javascript
// 요청 로깅
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip,
  });
  next();
});

// 비즈니스 이벤트
logger.info("Code submitted", {
  submissionId: submission.id,
  studentId: studentId,
  problemId: problemId,
});

// 에러 로깅
logger.error("Judging failed", {
  submissionId: submission.id,
  error: error.message,
  stack: error.stack,
});
```

### 5.4 모니터링 및 알림

**헬스체크 엔드포인트**:

```javascript
// /api/health
app.get("/api/health", async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    await db.query("SELECT 1");

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

**메트릭 수집**:

```javascript
// 채점 큐 모니터링
function getJudgingQueueMetrics() {
  return {
    queueSize: judgingQueue.length,
    maxQueueSize: MAX_QUEUE_SIZE,
    utilizationPercent: (judgingQueue.length / MAX_QUEUE_SIZE) * 100,
  };
}

// 주기적으로 로그
setInterval(() => {
  const metrics = getJudgingQueueMetrics();
  logger.info("Queue metrics", metrics);

  if (metrics.utilizationPercent > 80) {
    logger.warn("Queue is nearly full", metrics);
  }
}, 60000); // 1분마다
```

---

## 6. 프론트엔드 디렉토리 구조

### 6.1 React 프론트엔드 구조

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── api/                    # API 클라이언트
│   │   ├── client.js           # Axios 인스턴스, 인터셉터
│   │   ├── authApi.js          # 인증 관련 API
│   │   ├── problemApi.js       # 문제 관련 API
│   │   ├── submissionApi.js    # 제출 관련 API
│   │   └── sessionApi.js       # 세션 관련 API
│   │
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── common/             # 공통 UI 컴포넌트
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── MainLayout.jsx
│   │   │
│   │   ├── auth/               # 인증 컴포넌트
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── PasswordResetForm.jsx
│   │   │
│   │   ├── problems/           # 문제 관련 컴포넌트
│   │   │   ├── ProblemCard.jsx
│   │   │   ├── ProblemList.jsx
│   │   │   ├── ProblemDetail.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   └── TestCaseDisplay.jsx
│   │   │
│   │   ├── submissions/        # 제출 관련 컴포넌트
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── SubmissionForm.jsx
│   │   │   ├── SubmissionHistory.jsx
│   │   │   ├── JudgingResult.jsx
│   │   │   └── ResultBadge.jsx
│   │   │
│   │   └── sessions/           # 세션 관련 컴포넌트
│   │       ├── SessionCard.jsx
│   │       ├── Scoreboard.jsx
│   │       └── SessionTimer.jsx
│   │
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── student/            # 학생 페이지
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProblemListPage.jsx
│   │   │   ├── ProblemDetailPage.jsx
│   │   │   ├── SubmissionHistoryPage.jsx
│   │   │   ├── ScoreboardPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   └── admin/              # 관리자 페이지
│   │       ├── AdminLoginPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── ProblemManagementPage.jsx
│   │       ├── SessionManagementPage.jsx
│   │       ├── StudentManagementPage.jsx
│   │       └── StatisticsPage.jsx
│   │
│   ├── hooks/                  # Custom Hooks
│   │   ├── useAuth.js          # 인증 상태 관리
│   │   ├── useProblem.js       # 문제 데이터 관리
│   │   ├── useSubmission.js    # 제출 관리
│   │   ├── useScoreboard.js    # 스코어보드 폴링
│   │   ├── usePolling.js       # 범용 폴링 훅
│   │   └── useToast.js         # 토스트 알림
│   │
│   ├── contexts/               # React Context
│   │   ├── AuthContext.jsx     # 인증 컨텍스트
│   │   └── ThemeContext.jsx    # 테마 컨텍스트 (다크모드 등)
│   │
│   ├── utils/                  # 유틸리티 함수
│   │   ├── formatters.js       # 날짜, 숫자 포맷팅
│   │   ├── validators.js       # 입력 검증 함수
│   │   ├── constants.js        # 상수 정의
│   │   └── helpers.js          # 기타 헬퍼 함수
│   │
│   ├── styles/                 # 글로벌 스타일
│   │   ├── index.css           # Tailwind imports
│   │   └── custom.css          # 커스텀 CSS
│   │
│   ├── App.jsx                 # 루트 컴포넌트
│   ├── index.js                # 엔트리 포인트
│   └── routes.jsx              # 라우팅 설정
│
├── .env.example                # 환경 변수 예시
├── .eslintrc.js                # ESLint 설정
├── .prettierrc                 # Prettier 설정
├── tailwind.config.js          # Tailwind 설정
├── package.json
└── README.md
```

### 6.2 주요 패턴 설명

**API 클라이언트 중앙화**:

```javascript
// api/client.js
import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 처리
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;
```

**Custom Hook 패턴**:

```javascript
// hooks/useSubmission.js
import { useState } from "react";
import { submitCode } from "../api/submissionApi";

export function useSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (problemId, code, pythonVersion) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const data = await submitCode(problemId, code, pythonVersion);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, result, error };
}
```

**폴링 훅**:

```javascript
// hooks/usePolling.js
import { useState, useEffect, useRef } from "react";

export function usePolling(fetchFunc, interval = 5000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      try {
        const result = await fetchFunc();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
      }
    };

    fetch(); // 즉시 실행
    intervalRef.current = setInterval(fetch, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFunc, interval, enabled]);

  return { data, error };
}

// 사용 예시
const { data: scoreboard } = usePolling(
  () => fetchScoreboard(sessionId),
  5000,
  isSessionActive
);
```

---

## 7. 백엔드 디렉토리 구조

### 7.1 Node.js + Express 백엔드 구조

```
backend/
├── src/
│   ├── modules/                # 도메인 모듈
│   │   ├── auth/               # 인증 모듈
│   │   │   ├── controllers/
│   │   │   │   └── authController.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   ├── middlewares/
│   │   │   │   └── authMiddleware.js
│   │   │   ├── validators/
│   │   │   │   └── authValidators.js
│   │   │   ├── routes.js
│   │   │   └── index.js        # 모듈 공개 인터페이스
│   │   │
│   │   ├── users/              # 사용자 관리
│   │   │   ├── controllers/
│   │   │   │   ├── studentController.js
│   │   │   │   └── adminController.js
│   │   │   ├── services/
│   │   │   │   ├── studentService.js
│   │   │   │   └── adminService.js
│   │   │   ├── repositories/
│   │   │   │   ├── studentRepository.js
│   │   │   │   └── adminRepository.js
│   │   │   ├── models/
│   │   │   │   ├── Student.js
│   │   │   │   └── Admin.js
│   │   │   ├── validators/
│   │   │   │   └── userValidators.js
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── problems/           # 문제 관리
│   │   │   ├── controllers/
│   │   │   │   ├── problemController.js
│   │   │   │   └── testCaseController.js
│   │   │   ├── services/
│   │   │   │   ├── problemService.js
│   │   │   │   └── testCaseService.js
│   │   │   ├── repositories/
│   │   │   │   ├── problemRepository.js
│   │   │   │   └── testCaseRepository.js
│   │   │   ├── models/
│   │   │   │   ├── Problem.js
│   │   │   │   └── TestCase.js
│   │   │   ├── validators/
│   │   │   │   └── problemValidators.js
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── submissions/        # 제출 및 채점
│   │   │   ├── controllers/
│   │   │   │   └── submissionController.js
│   │   │   ├── services/
│   │   │   │   ├── submissionService.js
│   │   │   │   └── judgingService.js
│   │   │   ├── repositories/
│   │   │   │   ├── submissionRepository.js
│   │   │   │   └── judgingResultRepository.js
│   │   │   ├── models/
│   │   │   │   ├── Submission.js
│   │   │   │   └── JudgingResult.js
│   │   │   ├── engines/        # 채점 엔진
│   │   │   │   ├── judgingEngine.js
│   │   │   │   ├── sandboxRunner.js
│   │   │   │   ├── astValidator.js
│   │   │   │   └── outputComparer.js
│   │   │   ├── validators/
│   │   │   │   └── submissionValidators.js
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── sessions/           # 교육 세션
│   │   │   ├── controllers/
│   │   │   │   ├── sessionController.js
│   │   │   │   └── scoreboardController.js
│   │   │   ├── services/
│   │   │   │   ├── sessionService.js
│   │   │   │   └── scoreboardService.js
│   │   │   ├── repositories/
│   │   │   │   ├── sessionRepository.js
│   │   │   │   └── scoreboardRepository.js
│   │   │   ├── models/
│   │   │   │   ├── Session.js
│   │   │   │   └── Scoreboard.js
│   │   │   ├── validators/
│   │   │   │   └── sessionValidators.js
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   └── audit/              # 감사 로그
│   │       ├── controllers/
│   │       │   └── auditController.js
│   │       ├── services/
│   │       │   └── auditService.js
│   │       ├── repositories/
│   │       │   └── auditRepository.js
│   │       ├── models/
│   │       │   └── AuditLog.js
│   │       ├── routes.js
│   │       └── index.js
│   │
│   ├── shared/                 # 공유 코드
│   │   ├── database/           # 데이터베이스 설정
│   │   │   ├── connection.js   # Supabase 연결
│   │   │   ├── migrations/     # 마이그레이션 파일
│   │   │   └── seeds/          # 시드 데이터
│   │   │
│   │   ├── middlewares/        # 공통 미들웨어
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validateRequest.js
│   │   │
│   │   ├── errors/             # 에러 클래스
│   │   │   ├── AppError.js
│   │   │   ├── ValidationError.js
│   │   │   ├── AuthenticationError.js
│   │   │   └── index.js
│   │   │
│   │   ├── utils/              # 유틸리티 함수
│   │   │   ├── logger.js
│   │   │   ├── dateUtils.js
│   │   │   ├── stringUtils.js
│   │   │   ├── cryptoUtils.js
│   │   │   └── validators.js
│   │   │
│   │   ├── constants/          # 전역 상수
│   │   │   ├── httpStatus.js
│   │   │   ├── judgingStatus.js
│   │   │   ├── roles.js
│   │   │   └── config.js
│   │   │
│   │   └── types/              # TypeScript 타입 (선택)
│   │       └── common.ts
│   │
│   ├── config/                 # 환경 설정
│   │   ├── index.js            # 통합 설정
│   │   ├── database.js         # DB 설정
│   │   ├── security.js         # 보안 설정
│   │   └── judging.js          # 채점 설정
│   │
│   ├── routes/                 # 라우팅 통합
│   │   └── index.js            # 모든 모듈 라우트 통합
│   │
│   ├── app.js                  # Express 앱 설정
│   └── server.js               # 서버 시작 (로컬 개발용)
│
├── tests/                      # 테스트
│   ├── unit/                   # 단위 테스트
│   │   ├── services/
│   │   ├── repositories/
│   │   └── utils/
│   │
│   ├── integration/            # 통합 테스트
│   │   └── api/
│   │
│   ├── e2e/                    # E2E 테스트
│   │
│   └── fixtures/               # 테스트 데이터
│       ├── students.json
│       ├── problems.json
│       └── testCases.json
│
├── scripts/                    # 유틸리티 스크립트
│   ├── seed.js                 # 데이터베이스 시드
│   └── migrate.js              # 마이그레이션 실행
│
├── .env.example                # 환경 변수 예시
├── .eslintrc.js                # ESLint 설정
├── .prettierrc                 # Prettier 설정
├── jest.config.js              # Jest 설정
├── package.json
└── README.md
```

### 7.2 모듈 구조 상세

**각 모듈의 계층 구조**:

```
module/
  controllers/      # HTTP 요청/응답 처리, 입력 검증
  services/         # 비즈니스 로직, 트랜잭션 관리
  repositories/     # 데이터베이스 접근 (CRUD)
  models/           # 데이터 모델 (엔티티)
  validators/       # 입력 검증 규칙
  routes.js         # 라우팅 정의
  index.js          # 공개 인터페이스
```

**예시 - Submission 모듈**:

```javascript
// controllers/submissionController.js
const { submissionService } = require("../services/submissionService");
const { validateSubmission } = require("../validators/submissionValidators");

async function submit(req, res, next) {
  try {
    const { problem_id, code, python_version } = req.body;
    const studentId = req.user.id; // authMiddleware에서 설정

    const result = await submissionService.submitCode(
      studentId,
      problem_id,
      code,
      python_version
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { submit };
```

```javascript
// services/submissionService.js
const {
  submissionRepository,
} = require("../repositories/submissionRepository");
const { judgingService } = require("./judgingService");
const { problemService } = require("../../problems");

class SubmissionService {
  async submitCode(studentId, problemId, code, pythonVersion) {
    // 1. 검증
    await this._validateSubmission(studentId, problemId, code);

    // 2. 제출 생성
    const submission = await submissionRepository.create({
      student_id: studentId,
      problem_id: problemId,
      code: code,
      python_version: pythonVersion,
      judging_status: "PENDING",
    });

    // 3. 채점 큐에 추가 (백그라운드)
    judgingService.queueJudging(submission.id).catch((err) => {
      logger.error("Failed to queue judging", {
        submissionId: submission.id,
        error: err,
      });
    });

    return submission;
  }

  async _validateSubmission(studentId, problemId, code) {
    // 제출 쿨타임 체크
    const recentSubmission = await submissionRepository.findRecentByStudent(
      studentId,
      problemId,
      5000 // 5초
    );
    if (recentSubmission) {
      throw new ValidationError(
        "Please wait 5 seconds before submitting again"
      );
    }

    // 문제 존재 여부
    const problem = await problemService.getProblemById(problemId);
    if (!problem) {
      throw new NotFoundError("Problem");
    }

    // 코드 크기
    if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
      throw new ValidationError(`Code size exceeds ${MAX_CODE_SIZE} bytes`);
    }
  }
}

module.exports = { submissionService: new SubmissionService() };
```

```javascript
// repositories/submissionRepository.js
const { supabase } = require("../../../shared/database/connection");

class SubmissionRepository {
  async create(data) {
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return submission;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  async findRecentByStudent(studentId, problemId, withinMs) {
    const cutoffTime = new Date(Date.now() - withinMs).toISOString();

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("student_id", studentId)
      .eq("problem_id", problemId)
      .gte("submitted_at", cutoffTime)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    return data;
  }
}

module.exports = { submissionRepository: new SubmissionRepository() };
```

```javascript
// routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../../shared/middlewares");
const { submissionController } = require("./controllers/submissionController");
const { validateSubmission } = require("./validators/submissionValidators");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  validateSubmission,
  submissionController.submit
);

router.get("/history", authMiddleware, submissionController.getHistory);

router.get("/:id", authMiddleware, submissionController.getById);

module.exports = router;
```

```javascript
// index.js (공개 인터페이스)
const routes = require("./routes");
const { submissionService } = require("./services/submissionService");

module.exports = {
  submissionRoutes: routes,
  submissionService,
};
```

### 7.3 라우팅 통합

```javascript
// routes/index.js
const express = require("express");
const router = express.Router();

const { authRoutes } = require("../modules/auth");
const { userRoutes } = require("../modules/users");
const { problemRoutes } = require("../modules/problems");
const { submissionRoutes } = require("../modules/submissions");
const { sessionRoutes } = require("../modules/sessions");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/problems", problemRoutes);
router.use("/submissions", submissionRoutes);
router.use("/sessions", sessionRoutes);

module.exports = router;
```

```javascript
// app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler, requestLogger } = require("./shared/middlewares");

const app = express();

// 보안 미들웨어
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// 파싱 미들웨어
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 로깅
app.use(requestLogger);

// 헬스체크
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API 라우트
app.use("/api", routes);

// 에러 핸들러 (마지막)
app.use(errorHandler);

module.exports = app;
```

---

## 8. 데이터베이스 스키마 관리

### 8.1 마이그레이션 전략

**원칙**: 모든 스키마 변경은 마이그레이션 파일로 관리하며, 버전 관리합니다.

**마이그레이션 도구**: node-pg-migrate (또는 Supabase 대시보드)

**마이그레이션 파일 명명**:

```
migrations/
  001_create_students_table.sql
  002_create_problems_table.sql
  003_create_submissions_table.sql
  004_add_index_submissions_student_id.sql
  005_alter_problems_add_visibility.sql
```

**예시**:

```sql
-- migrations/001_create_students_table.sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  military_id VARCHAR(20) UNIQUE NOT NULL,
  login_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  group_info VARCHAR(100),
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_students_military_id ON students(military_id);
CREATE INDEX idx_students_login_id ON students(login_id);

-- Rollback
-- DROP TABLE IF EXISTS students;
```

### 8.2 시드 데이터

**시드 전략**: 개발/테스트 환경용 초기 데이터 제공

```javascript
// scripts/seed.js
const { supabase } = require("../src/shared/database/connection");

async function seedDatabase() {
  // 관리자 계정
  await supabase.from("administrators").insert([
    {
      login_id: "admin",
      name: "Administrator",
      password_hash: await bcrypt.hash("admin123", 10),
      role_level: "super_admin",
    },
  ]);

  // 테스트 학생
  await supabase.from("students").insert([
    {
      military_id: "12345",
      login_id: "student1",
      name: "Test Student",
      password_hash: await bcrypt.hash("password", 10),
    },
  ]);

  // 샘플 문제
  await supabase.from("problems").insert([
    {
      title: "Hello World",
      description: 'Print "Hello, World!"',
      category: "basic",
      difficulty: 1,
      time_limit: 2,
      memory_limit: 256,
      author_id: 1,
    },
  ]);

  console.log("Database seeded successfully");
}

seedDatabase().catch(console.error);
```

---

## 9. 배포 및 CI/CD

### 9.1 Vercel 배포 설정

**vercel.json** (Backend):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/server.js"
    },
    {
      "src": "/health",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**vercel.json** (Frontend):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 9.2 GitHub Actions CI/CD

**.github/workflows/ci.yml**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint

      - name: Run tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint

      - name: Run tests
        working-directory: ./frontend
        run: npm test

      - name: Build
        working-directory: ./frontend
        run: npm run build
```

**.github/workflows/deploy.yml**:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Backend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_BACKEND_PROJECT_ID }}
          working-directory: ./backend
          vercel-args: "--prod"

      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_FRONTEND_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: "--prod"
```

---

## 10. 핵심 설계 결정 및 트레이드오프

### 10.1 주요 아키텍처 결정

| 결정 사항           | 선택한 방향           | 이유                          | 트레이드오프                              |
| ------------------- | --------------------- | ----------------------------- | ----------------------------------------- |
| **아키텍처 스타일** | 모듈러 모놀리스       | 초기 규모에 적합, 배포 단순   | 향후 마이크로서비스 전환 시 리팩토링 필요 |
| **코드 실행 격리**  | subprocess + AST      | Docker 불가 환경, 실용적 보안 | 컨테이너 격리보다 보안 수준 낮음          |
| **실시간 통신**     | 폴링 (3-5초)          | Vercel WebSocket 미지원       | 네트워크 오버헤드, 지연 시간              |
| **상태 관리**       | Stateless (JWT)       | 서버리스 환경, 스케일링 용이  | 세션 무효화 복잡함                        |
| **데이터베이스**    | PostgreSQL (Supabase) | 관계형 데이터, 안정성         | NoSQL 유연성 부족                         |
| **채점 방식**       | 동기 처리             | 초기 규모 작음, 구현 단순     | 대규모 확장 시 비동기 큐 필요             |
| **캐시 레이어**     | 없음 (Phase 1)        | 복잡도 최소화                 | 데이터베이스 부하 증가 가능               |

### 10.2 보안 관련 결정

| 위협                 | 완화 전략                                  | 수용 가능한 잔여 위험             |
| -------------------- | ------------------------------------------ | --------------------------------- |
| **악의적 코드 실행** | AST 정적 분석 + subprocess 격리 + 타임아웃 | 정교한 우회 기법 (매우 낮은 확률) |
| **DoS 공격**         | Rate limiting + 채점 큐 제한               | 분산 공격 (관리형 서비스로 완화)  |
| **데이터 유출**      | RBAC + 최소 권한 + 감사 로그               | 권한 오용 (모니터링으로 대응)     |
| **인증 우회**        | JWT + httpOnly 쿠키 + HTTPS                | 토큰 탈취 (2시간 짧은 유효 기간)  |

### 10.3 성능 관련 결정

| 성능 목표               | 달성 전략                                     | 확장 계획                                    |
| ----------------------- | --------------------------------------------- | -------------------------------------------- |
| **채점 5초 이내**       | 최적화된 Python 실행, 테스트 케이스 병렬 처리 | 필요 시 워커 프로세스 추가                   |
| **동시 30명 처리**      | Vercel 서버리스 자동 스케일링                 | 50명 이상 시 Pro 플랜 전환                   |
| **스코어보드 업데이트** | 5초 폴링, 클라이언트 캐싱                     | Phase 2에서 Redis Pub/Sub 검토               |
| **데이터베이스 쿼리**   | 인덱스 최적화, 필요한 컬럼만 조회             | 쿼리 성능 모니터링, 필요 시 읽기 전용 복제본 |

---

## 11. 마이그레이션 및 확장 전략

### 11.1 수평 확장 포인트

**Phase 2 확장 시나리오** (50명 이상):

1. **비동기 채점 큐 도입**

   - Redis + Bull 또는 AWS SQS
   - 채점 워커 프로세스 분리
   - 우선순위 큐 (세션 내 제출 우선)

2. **캐시 레이어 추가**

   - Redis: 스코어보드, 문제 목록, 세션 정보
   - TTL 전략: 스코어보드 5초, 문제 목록 1시간

3. **데이터베이스 최적화**
   - 읽기 전용 복제본
   - 파티셔닝 (제출 이력 날짜별)
   - 감사 로그 아카이빙 (90일 이후 콜드 스토리지)

### 11.2 마이크로서비스 분리 시나리오

**언제?**: 100명 이상, 다중 언어 지원 필요 시

**분리 우선순위**:

1. **Judging Service** (독립 배포, 높은 리소스 소비)
2. **Session Service** (실시간 업데이트, 독립 스케일링)
3. **Problem Service** (읽기 중심, CDN 캐싱)

**유지할 모놀리스**:

- Auth, User (변경 빈도 낮음, 다른 서비스와 강결합)

---

## 부록 A: 체크리스트

### 설계 단계

- [ ] 도메인 정의서 검토 완료
- [ ] PRD 요구사항 반영 확인
- [ ] 기술 스택 확정 (Node.js, React, PostgreSQL, Vercel)
- [ ] 보안 요구사항 반영 (AST 분석, subprocess 격리)
- [ ] 디렉토리 구조 합의

### 개발 단계

- [ ] ESLint + Prettier 설정 완료
- [ ] 환경 변수 관리 (.env.example 작성)
- [ ] 에러 클래스 정의
- [ ] 로거 설정
- [ ] 데이터베이스 마이그레이션 스크립트
- [ ] 시드 데이터 준비
- [ ] API 라우팅 구조 구현
- [ ] 인증 미들웨어 구현
- [ ] 테스트 프레임워크 설정

### 배포 단계

- [ ] Vercel 프로젝트 생성 (Frontend, Backend)
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 Vercel에 설정
- [ ] GitHub Actions CI/CD 설정
- [ ] 헬스체크 엔드포인트 구현
- [ ] 에러 모니터링 설정
- [ ] 배포 문서 작성

### 운영 단계

- [ ] 로그 모니터링 대시보드
- [ ] 성능 메트릭 수집
- [ ] 백업 자동화 확인
- [ ] 보안 감사 로그 확인 프로세스
- [ ] 인시던트 대응 프로세스

---

## 부록 B: 참조 자료

**관련 문서**:

- `docs/1-domain-definition.md` - 도메인 정의서
- `docs/2-product-requirements-document.md` - 제품 요구사항 문서
- `docs/prd-input-template.md` - PRD 입력 템플릿

**외부 참조**:

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

**보안 참조**:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python AST Module](https://docs.python.org/3/library/ast.html)
- [Subprocess Security](https://docs.python.org/3/library/subprocess.html#security-considerations)

---

**문서 종료**
