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

- 3-tier 아키텍처 (Presentation - Application - Data)
- 컨테이너 기반 모듈러 모놀리스 (Render Web Service)
- 필요한 경우에만 추상화 레이어 추가
- YAGNI (You Aren't Gonna Need It) 원칙 준수

### 1.2 관심사의 분리 (Separation of Concerns)

**원칙**: 각 모듈과 계층은 명확한 책임을 가지며, 다른 관심사와 섞이지 않습니다.

**이유**:

- 코드 재사용성 향상
- 테스트 용이성 증대
- 변경의 영향 범위 최소화

**적용 방법**:

- 비즈니스 로직은 서비스 계층에만 위치
- 데이터 접근은 리포지토리/DAO 패턴 사용
- 프레젠테이션 로직은 컨트롤러/컴포넌트에만 위치
- 횡단 관심사(인증, 로깅)는 미들웨어로 분리

### 1.3 모놀리스-우선, 모듈러 설계 (Modular Monolith, 컨테이너 배포)

**원칙**: 단일 배포 단위를 유지하되, 내부적으로는 명확한 모듈 경계를 가집니다.

**이유**:

- 초기 규모에서는 모놀리스가 효율적
- 컨테이너(Web Service)로 운영/스케일 단순화
- 향후 필요 시 모듈 단위로 분리 가능하도록 설계

**모듈 구조**:

- auth/ - 인증 모듈 (독립적)
- problems/ - 문제 관리 모듈
- submissions/ - 제출 및 채점 모듈
- sessions/ - 세션 관리 모듈
- users/ - 사용자 관리 모듈

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

- 초기에는 동기 처리 (비동기 큐 도입 보류)
- 캐시 레이어 없이 시작 (필요 시 Redis 추가)
- 데이터베이스 정규화보다 읽기 성능 우선
- 폴링 방식 사용 (WebSocket 대신)

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

---

## 2. 의존성 및 레이어 원칙

### 2.1 의존성 역전 원칙 (Dependency Inversion)

**원칙**: 상위 레벨 모듈은 하위 레벨 모듈에 의존하지 않으며, 둘 다 추상화에 의존합니다.

**이유**:

- 테스트 용이성 (모킹 가능)
- 구현 교체 용이성 (예: Supabase → 다른 DB)
- 순환 의존성 방지

### 2.2 계층 간 의존성 방향

**원칙**: 의존성은 항상 외부에서 내부로, 상위에서 하위로 흐릅니다.

**계층 구조**:

- Presentation Layer (Controllers, Components)
  - ↓
- Application Layer (Services, Use Cases)
  - ↓
- Domain Layer (Entities, Business Rules)
  - ↓
- Infrastructure Layer (Repositories, External APIs)

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

**의존성 규칙**:

- auth ← 모든 모듈 (인증은 공통 의존성)
- submissions → problems (문제 정보 조회)
- sessions → problems, submissions (세션은 문제와 제출 의존)
- users ← auth (사용자 정보는 인증 모듈이 사용)

### 2.4 공유 코드 관리

**원칙**: 공통 로직은 shared 폴더에 집중하되, 과도한 공유는 지양합니다.

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

- 폴더명: `camelCase`
- 파일명: `camelCase.js`
- 클래스 파일: `PascalCase.js`
- 테스트 파일: `*.test.js`

**코드**:

- 클래스: PascalCase
- 함수/메서드: camelCase
- 변수: camelCase
- 상수: UPPER_SNAKE_CASE
- private 메서드: _camelCase (관례)

**데이터베이스**:

- 테이블명: `snake_case` 복수형
- 컬럼명: `snake_case`
- 인덱스: `idx_table_column`
- 외래키: `fk_table_column`

#### Frontend (React + Tailwind)

**파일 및 폴더**:

- 컴포넌트 파일: `PascalCase.jsx`
- 훅 파일: `use*.js`
- 유틸 파일: `camelCase.js`
- 폴더명: `camelCase`

**코드**:

- 컴포넌트: PascalCase
- 훅: useCamelCase
- Props: camelCase
- State: camelCase
- 이벤트 핸들러: handle* 또는 on*

### 3.2 함수 및 메서드 설계

**원칙**: 함수는 한 가지 일만 하며, 작고 명확해야 합니다.

**함수 크기**:

- 최대 50줄 권장 (스크롤 없이 한 화면)
- 중첩 깊이 최대 3단계
- 파라미터 최대 5개 (넘으면 객체로 묶기)

**함수 명명 패턴**:

- 조회: get*, find*, fetch*
- 생성: create*, add*
- 수정: update*, modify*
- 삭제: delete*, remove*
- 검증: validate*, check*, verify*
- 변환: to*, from*, convert*

### 3.3 주석 및 문서화

**원칙**: 코드는 자체 설명적이어야 하며, 주석은 "왜"를 설명합니다.

**필수 주석**:

- 함수/메서드: JSDoc 형식의 설명, 파라미터, 반환값, 예외
- 복잡한 비즈니스 로직: 의도와 맥락 설명
- 임시 해결책: TODO, FIXME, HACK 주석

**좋은 주석**:

- 기술적 제약사항이나 비즈니스 규칙 설명
- 외부 의존성으로 인한 제약사항 설명
- 성능 최적화나 보안 결정에 대한 설명

**나쁜 주석**:

- 코드가 무엇을 하는지 그대로 설명하는 주석
- 명확한 변수명/함수명으로 대체 가능한 주석

### 3.4 에러 처리

**원칙**: 에러는 명확하게 분류하고, 적절한 레벨에서 처리합니다.

**에러 계층**:

- AppError: 기본 애플리케이션 에러
- ValidationError: 입력 검증 실패 (400)
- AuthenticationError: 인증 실패 (401)
- ForbiddenError: 권한 없음 (403)
- NotFoundError: 리소스 없음 (404)

**에러 처리 레벨**:

- 컨트롤러: 에러를 미들웨어로 전달
- 서비스: 비즈니스 에러를 명확히 표현
- 에러 미들웨어: 중앙 집중 처리

---

## 4. 테스트 및 품질 원칙

### 4.1 테스트 전략

**테스트 피라미드**:

- Unit Tests: 많음 (60%)
- Integration Tests: 중간 (30%)
- E2E Tests: 적음 (10%)

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

### 4.3 통합 테스트 (Integration Tests)

**프레임워크**: Jest + Supertest

**원칙**:

- 실제 데이터베이스 사용 (테스트 DB)
- 전체 요청 흐름 검증
- 트랜잭션 롤백으로 격리

### 4.4 E2E 테스트

**프레임워크**: Playwright (또는 Cypress)

**핵심 시나리오만**:

- 로그인 → 문제 선택 → 코드 제출 → 결과 확인
- 관리자 로그인 → 문제 등록 → 테스트 케이스 추가
- 세션 생성 → 학생 참여 → 스코어보드 확인

### 4.5 코드 품질 도구

**Linter**: ESLint

- 기본 규칙: eslint:recommended, plugin:react/recommended
- 주요 규칙: no-console, max-lines, max-depth, complexity

**Formatter**: Prettier

- 일관된 코드 스타일 자동 적용

**커밋 훅**: Husky + lint-staged

- 커밋 전 자동 린트 및 포맷팅

---

## 5. 환경 설정, 보안 및 운영 원칙

### 5.1 환경 변수 관리

**원칙**: 모든 환경별 설정은 환경 변수로 관리하며, 코드에 하드코딩하지 않습니다.

**환경 분리**:

- .env.development - 로컬 개발
- .env.test - 테스트
- .env.production - 프로덕션 (배포 환경 변수로 관리)

**필수 환경 변수**:

- DATABASE_URL
- JWT_SECRET
- JUDGING_TIMEOUT
- MAX_CODE_SIZE
- PYTHON_VERSIONS
- SUPABASE_URL
- SUPABASE_KEY

### 5.2 보안 설정

**CORS 설정**:

- 프로덕션: 허용된 도메인만
- 개발: localhost 허용
- credentials: true

**보안 헤더**:

- helmet 미들웨어 사용
- Content Security Policy 설정
- HSTS 설정

**Rate Limiting**:

- 일반 API: 1분당 60회
- 제출 API: 5초당 1회

**입력 검증**:

- express-validator 사용
- 모든 입력 데이터 검증
- 타입, 길이, 형식 검증

### 5.3 로깅 전략

**로깅 레벨**:

- ERROR: 시스템 오류, 즉시 대응 필요
- WARN: 비정상적이지만 처리 가능한 상황
- INFO: 중요한 비즈니스 이벤트
- DEBUG: 개발 시 디버깅 정보

**로거 설정**:

- winston 라이브러리 사용
- 프로덕션: 파일 또는 외부 서비스
- 개발: 콘솔 출력

**로깅 대상**:

- 요청/응답 로깅
- 비즈니스 이벤트
- 에러 로깅

### 5.4 모니터링 및 알림

**헬스체크 엔드포인트**:

- /api/health 엔드포인트
- 데이터베이스 연결 확인
- 시스템 상태 반환

**메트릭 수집**:

- 채점 큐 모니터링
- 시스템 리소스 모니터링
- 주기적 로깅

---

## 6. 프론트엔드 디렉토리 구조

### 6.1 React 프론트엔드 구조

**주요 디렉토리**:

- public/ - 정적 파일
- src/api/ - API 클라이언트
- src/components/ - 재사용 가능한 컴포넌트
  - common/ - 공통 UI 컴포넌트
  - layout/ - 레이아웃 컴포넌트
  - auth/ - 인증 컴포넌트
  - problems/ - 문제 관련 컴포넌트
  - submissions/ - 제출 관련 컴포넌트
  - sessions/ - 세션 관련 컴포넌트
- src/pages/ - 페이지 컴포넌트
  - student/ - 학생 페이지
  - admin/ - 관리자 페이지
- src/hooks/ - Custom Hooks
- src/contexts/ - React Context
- src/utils/ - 유틸리티 함수
- src/styles/ - 글로벌 스타일

### 6.2 주요 패턴 설명

**API 클라이언트 중앙화**:

- axios 인스턴스 생성
- 요청 인터셉터: JWT 토큰 자동 추가
- 응답 인터셉터: 에러 처리

**Custom Hook 패턴**:

- 상태 관리 및 API 호출 로직 분리
- 재사용 가능한 비즈니스 로직

**폴링 훅**:

- 실시간 업데이트를 위한 폴링 구현
- 스코어보드, 채점 상태 등에 활용

---

## 7. 백엔드 디렉토리 구조

### 7.1 Node.js + Express 백엔드 구조

**주요 디렉토리**:

- src/modules/ - 도메인 모듈
  - auth/ - 인증 모듈
  - users/ - 사용자 관리
  - problems/ - 문제 관리
  - submissions/ - 제출 및 채점
  - sessions/ - 교육 세션
  - audit/ - 감사 로그
- src/shared/ - 공유 코드
  - database/ - 데이터베이스 설정
  - middlewares/ - 공통 미들웨어
  - errors/ - 에러 클래스
  - utils/ - 유틸리티 함수
  - constants/ - 전역 상수
- src/config/ - 환경 설정
- src/routes/ - 라우팅 통합
- tests/ - 테스트
  - unit/ - 단위 테스트
  - integration/ - 통합 테스트
  - e2e/ - E2E 테스트

### 7.2 모듈 구조 상세

**각 모듈의 계층 구조**:

- controllers/ - HTTP 요청/응답 처리, 입력 검증
- services/ - 비즈니스 로직, 트랜잭션 관리
- repositories/ - 데이터베이스 접근 (CRUD)
- models/ - 데이터 모델 (엔티티)
- validators/ - 입력 검증 규칙
- routes.js - 라우팅 정의
- index.js - 공개 인터페이스

### 7.3 라우팅 통합

**라우팅 계층**:

- routes/index.js - 모든 모듈 라우트 통합
- app.js - Express 앱 설정
- server.js - 서버 시작 (로컬 개발용)

---

## 8. 데이터베이스 스키마 관리

### 8.1 마이그레이션 전략

**원칙**: 모든 스키마 변경은 마이그레이션 파일로 관리하며, 버전 관리합니다.

**마이그레이션 도구**: node-pg-migrate (또는 Supabase 대시보드)

**마이그레이션 파일 명명**:

- 순차적 번호_설명.sql
- 예: 001_create_students_table.sql

### 8.2 시드 데이터

**시드 전략**: 개발/테스트 환경용 초기 데이터 제공

**시드 데이터 종류**:

- 관리자 계정
- 테스트 학생
- 샘플 문제

---

## 9. 배포 및 CI/CD

### 9.1 Render 컨테이너 배포

- Backend/채점: 단일 컨테이너 Web Service (Express + subprocess)
- Frontend: 정적 호스팅(동일 컨테이너 또는 별도 정적 서비스)
- 환경 변수: Render 대시보드로 관리 (Supabase는 추후 연결)
- 로그: 애플리케이션 JSON 로그 + Render 로그 뷰어

### 9.2 GitHub Actions CI/CD

**CI Pipeline**:

- Backend: lint, test
- Frontend: lint, test, build

**Deploy Pipeline**:

- main 브랜치 푸시 시 자동 배포 (Render로 컨테이너 이미지 배포)
- Backend/Frontend를 하나의 이미지로 배포하거나 별도 서비스로 분리

---

## 10. 답안 정규화 구현 가이드

### 10.1 답안 정규화의 필요성

학생들이 작성한 코드의 출력을 예상 출력과 비교할 때, 다음과 같은 형식적 차이로 인해 의미적으로 동일한 출력이 오답 처리되는 것을 방지해야 합니다:

- 운영체제별 줄바꿈 문자 차이 (Windows: CRLF, Linux/Mac: LF)
- 코드 에디터에서 자동으로 추가되는 trailing whitespace
- 의도하지 않은 빈 줄 추가
- 부동소수점 계산의 미세한 오차

### 10.2 정규화 구현 전략

**핵심 원칙**: 의미적으로 동일한 출력은 정답으로 처리하되, 의미 있는 차이는 구분한다.

#### 정규화 파이프라인

```
학생 출력 → 줄바꿈 정규화 → 각 줄 trim → 빈 줄 제거 → 비교
예상 출력 → 줄바꿈 정규화 → 각 줄 trim → 빈 줄 제거 → 비교
```

### 10.3 구현 예시 (Python)

#### 기본 정규화 함수

```python
def normalize_output(output: str) -> str:
    """
    출력 문자열을 정규화합니다.

    Args:
        output: 원본 출력 문자열

    Returns:
        정규화된 출력 문자열
    """
    # 1. 줄바꿈 통일 (CRLF, CR → LF)
    normalized = output.replace('\r\n', '\n').replace('\r', '\n')

    # 2. 각 줄의 trailing whitespace 제거
    lines = normalized.split('\n')
    trimmed_lines = [line.rstrip() for line in lines]

    # 3. leading/trailing empty lines 제거
    while trimmed_lines and trimmed_lines[0] == '':
        trimmed_lines.pop(0)
    while trimmed_lines and trimmed_lines[-1] == '':
        trimmed_lines.pop()

    # 4. 다시 합치기
    return '\n'.join(trimmed_lines)
```

#### 부동소수점 비교 함수

```python
import re
import math

def compare_with_float_tolerance(student_output: str, expected_output: str,
                                 rel_tol: float = 1e-9) -> bool:
    """
    부동소수점 오차를 허용하여 출력을 비교합니다.

    Args:
        student_output: 학생 출력
        expected_output: 예상 출력
        rel_tol: 상대 오차 허용 범위 (기본: 1e-9)

    Returns:
        출력이 일치하는지 여부
    """
    # 기본 정규화
    student = normalize_output(student_output)
    expected = normalize_output(expected_output)

    # 문자열이 완전히 같으면 true
    if student == expected:
        return True

    # 부동소수점 비교 시도
    try:
        # 각 줄을 비교
        student_lines = student.split('\n')
        expected_lines = expected.split('\n')

        if len(student_lines) != len(expected_lines):
            return False

        for s_line, e_line in zip(student_lines, expected_lines):
            # 각 줄에서 숫자 추출
            s_nums = re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', s_line)
            e_nums = re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', e_line)

            if len(s_nums) != len(e_nums):
                return False

            # 각 숫자 비교
            for s_num, e_num in zip(s_nums, e_nums):
                try:
                    s_val = float(s_num)
                    e_val = float(e_num)

                    # 상대 오차 비교
                    if not math.isclose(s_val, e_val, rel_tol=rel_tol, abs_tol=0):
                        return False
                except ValueError:
                    # 숫자로 변환 불가능하면 문자열 비교
                    if s_num != e_num:
                        return False

            # 숫자를 제외한 나머지 부분도 비교
            s_remainder = re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', '', s_line)
            e_remainder = re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', '', e_line)

            if s_remainder != e_remainder:
                return False

        return True
    except Exception:
        # 파싱 실패 시 문자열 비교
        return student == expected
```

#### 채점 함수

```python
def judge_output(student_output: str, expected_output: str,
                problem_config: dict) -> tuple[bool, str]:
    """
    학생 출력과 예상 출력을 비교하여 채점합니다.

    Args:
        student_output: 학생 코드의 출력
        expected_output: 예상 출력
        problem_config: 문제 설정 (case_sensitive, float_comparison 등)

    Returns:
        (정답 여부, 피드백 메시지)
    """
    # 대소문자 구분 옵션
    if not problem_config.get('case_sensitive', True):
        student_output = student_output.lower()
        expected_output = expected_output.lower()

    # 부동소수점 비교 활성화 여부
    if problem_config.get('float_comparison', True):
        is_correct = compare_with_float_tolerance(
            student_output,
            expected_output,
            rel_tol=problem_config.get('float_tolerance', 1e-9)
        )
    else:
        # 단순 문자열 비교
        is_correct = normalize_output(student_output) == normalize_output(expected_output)

    if is_correct:
        return True, "정답입니다!"
    else:
        return False, "출력이 예상과 다릅니다."
```

### 10.4 정규화 설정 옵션

문제별로 다음 옵션을 설정할 수 있습니다:

```typescript
interface ProblemJudgeConfig {
  // 대소문자 구분 여부 (기본: true)
  case_sensitive: boolean;

  // 부동소수점 비교 활성화 (기본: true)
  float_comparison: boolean;

  // 부동소수점 상대 오차 허용 범위 (기본: 1e-9)
  float_tolerance: number;

  // trailing whitespace 제거 (기본: true)
  trim_trailing_whitespace: boolean;

  // leading/trailing empty lines 제거 (기본: true)
  trim_empty_lines: boolean;

  // 줄바꿈 정규화 (기본: true)
  normalize_newlines: boolean;
}
```

### 10.5 테스트 케이스

답안 정규화 로직의 정확성을 보장하기 위한 단위 테스트:

```python
import unittest

class TestOutputNormalization(unittest.TestCase):

    def test_trailing_whitespace(self):
        """줄 끝 공백 제거 테스트"""
        student = "Hello, World!   \n"
        expected = "Hello, World!\n"
        self.assertEqual(normalize_output(student), normalize_output(expected))

    def test_newline_normalization(self):
        """줄바꿈 문자 정규화 테스트"""
        student = "123\r\n456\r\n"  # Windows
        expected = "123\n456\n"      # Linux
        self.assertEqual(normalize_output(student), normalize_output(expected))

    def test_trailing_empty_lines(self):
        """마지막 빈 줄 제거 테스트"""
        student = "1\n2\n3\n\n\n"
        expected = "1\n2\n3\n"
        self.assertEqual(normalize_output(student), normalize_output(expected))

    def test_float_tolerance(self):
        """부동소수점 오차 허용 테스트"""
        student = "3.141592653589793"
        expected = "3.141592654"
        self.assertTrue(compare_with_float_tolerance(student, expected))

    def test_meaningful_whitespace(self):
        """의미 있는 공백은 구분해야 함"""
        student = "Hello,World!"
        expected = "Hello, World!"
        self.assertNotEqual(normalize_output(student), normalize_output(expected))

    def test_case_sensitive(self):
        """대소문자 구분 테스트"""
        student = "HELLO"
        expected = "hello"
        config = {'case_sensitive': True}
        is_correct, _ = judge_output(student, expected, config)
        self.assertFalse(is_correct)

    def test_case_insensitive(self):
        """대소문자 무시 테스트"""
        student = "HELLO"
        expected = "hello"
        config = {'case_sensitive': False}
        is_correct, _ = judge_output(student, expected, config)
        self.assertTrue(is_correct)

if __name__ == '__main__':
    unittest.main()
```

### 10.6 데이터베이스 스키마 추가

문제별 정규화 설정을 저장하기 위한 스키마:

```sql
-- problems 테이블에 컬럼 추가
ALTER TABLE problems ADD COLUMN judge_config JSONB DEFAULT '{
  "case_sensitive": true,
  "float_comparison": true,
  "float_tolerance": 1e-9,
  "trim_trailing_whitespace": true,
  "trim_empty_lines": true,
  "normalize_newlines": true
}'::jsonb;

-- 인덱스 추가 (선택)
CREATE INDEX idx_problems_judge_config ON problems USING GIN (judge_config);
```

### 10.7 관리자 UI 가이드

관리자가 문제 등록 시 정규화 옵션을 설정할 수 있도록 UI 제공:

```jsx
// React 컴포넌트 예시
function JudgeConfigForm({ config, setConfig }) {
  return (
    <div className="judge-config">
      <h3>채점 설정</h3>

      <label>
        <input
          type="checkbox"
          checked={config.case_sensitive}
          onChange={(e) => setConfig({...config, case_sensitive: e.target.checked})}
        />
        대소문자 구분
      </label>

      <label>
        <input
          type="checkbox"
          checked={config.float_comparison}
          onChange={(e) => setConfig({...config, float_comparison: e.target.checked})}
        />
        부동소수점 비교 활성화
      </label>

      {config.float_comparison && (
        <label>
          부동소수점 허용 오차:
          <input
            type="number"
            step="1e-10"
            value={config.float_tolerance}
            onChange={(e) => setConfig({...config, float_tolerance: parseFloat(e.target.value)})}
          />
        </label>
      )}

      <p className="help-text">
        ℹ️ trailing whitespace, 줄바꿈 정규화, 빈 줄 제거는 항상 적용됩니다.
      </p>
    </div>
  );
}
```

### 10.8 성능 고려사항

- **캐싱**: 정규화된 예상 출력을 캐싱하여 반복 계산 방지
- **조기 종료**: 문자열 길이가 크게 다르면 바로 오답 판정
- **병렬 처리**: 여러 테스트 케이스를 병렬로 처리 (향후)

```python
# 예상 출력 캐싱 예시
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_normalized_expected_output(test_case_id: int) -> str:
    """테스트 케이스의 정규화된 예상 출력을 캐싱하여 반환"""
    expected_output = fetch_expected_output_from_db(test_case_id)
    return normalize_output(expected_output)
```

---

## 11. 핵심 설계 결정 및 트레이드오프

### 11.1 주요 아키텍처 결정

| 결정 사항           | 선택한 방향           | 이유                          | 트레이드오프                              |
| ------------------- | --------------------- | ----------------------------- | ----------------------------------------- |
| **아키텍처 스타일** | 모듈러 모놀리스       | 초기 규모에 적합, 배포 단순   | 향후 마이크로서비스 전환 시 리팩토링 필요 |
| **코드 실행 격리**  | subprocess + AST      | Docker 불가 환경, 실용적 보안 | 컨테이너 격리보다 보안 수준 낮음          |
| **실시간 통신**     | 폴링 (3-5초)          | 단순 구현, WebSocket 불사용   | 네트워크 오버헤드, 지연 시간              |
| **상태 관리**       | Stateless (JWT)       | 수평 확장 대비                | 세션 무효화 복잡함                        |
| **데이터베이스**    | PostgreSQL (Supabase 예정) | 관계형 데이터, 안정성         | NoSQL 유연성 부족                         |
| **채점 방식**       | 동기 처리             | 초기 규모 작음, 구현 단순     | 대규모 확장 시 비동기 큐 필요             |
| **캐시 레이어**     | 없음 (Phase 1)        | 복잡도 최소화                 | 데이터베이스 부하 증가 가능               |

### 11.2 보안 관련 결정

| 위협                 | 완화 전략                                  | 수용 가능한 잔여 위험             |
| -------------------- | ------------------------------------------ | --------------------------------- |
| **악의적 코드 실행** | AST 정적 분석 + subprocess 격리 + 타임아웃 | 정교한 우회 기법 (매우 낮은 확률) |
| **DoS 공격**         | Rate limiting + 채점 큐 제한               | 분산 공격 (관리형 서비스로 완화)  |
| **데이터 유출**      | RBAC + 최소 권한 + 감사 로그               | 권한 오용 (모니터링으로 대응)     |
| **인증 우회**        | JWT + httpOnly 쿠키 + HTTPS                | 토큰 탈취 (2시간 짧은 유효 기간)  |

### 11.3 성능 관련 결정

| 성능 목표               | 달성 전략                                     | 확장 계획                                    |
| ----------------------- | --------------------------------------------- | -------------------------------------------- |
| **채점 5초 이내**       | 최적화된 Python 실행, 테스트 케이스 병렬 처리 | 필요 시 워커 프로세스 추가                   |
| **동시 30명 처리**      | 컨테이너 스케일업/아웃                        | 트래픽 증가 시 인스턴스 증설                 |
| **스코어보드 업데이트** | 5초 폴링, 클라이언트 캐싱                     | Phase 2에서 Redis Pub/Sub 검토               |
| **데이터베이스 쿼리**   | 인덱스 최적화, 필요한 컬럼만 조회             | 쿼리 성능 모니터링, 필요 시 읽기 전용 복제본 |

---

## 12. 마이그레이션 및 확장 전략

### 12.1 수평 확장 포인트

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

### 12.2 마이크로서비스 분리 시나리오

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
- [ ] 기술 스택 확정 (Node.js, React, PostgreSQL/Supabase, Render)
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

- [ ] Render 프로젝트 생성/연동 (Web Service)
- [ ] Supabase 프로젝트(추후) 및 환경 변수 준비
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
- [Render Documentation](https://render.com/docs)

**보안 참조**:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python AST Module](https://docs.python.org/3/library/ast.html)
- [Subprocess Security](https://docs.python.org/3/library/subprocess.html#security-considerations)

---

**문서 종료**
