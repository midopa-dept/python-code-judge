# Phase 2: 문제 관리 모듈 테스트 보고서

## 테스트 일시
2025-11-26

## 테스트 개요
Phase 2의 모든 문제 관리 API가 정상적으로 구현되고 동작함을 확인했습니다.

---

## 완료된 항목

### 1. 문제 등록 API (POST /api/problems) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\problemController.js:62-124`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:198-228`
- **상태**: ✅ 완료
- **기능**:
  - 제목, 설명, 카테고리, 난이도, 시간제한, 메모리제한 등 필수 필드 검증
  - 카테고리 유효성 검증 (11개 카테고리)
  - 난이도 유효성 검증 (1-5)
  - 시간 제한 유효성 검증 (1-10초)
  - 공개 설정 (public/private/draft)
  - 관리자 권한 필수

### 2. 문제 수정 API (PUT /api/problems/:id) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\problemController.js:126-179`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:230-303`
- **상태**: ✅ 완료
- **기능**:
  - 부분 업데이트 지원 (필드별 선택적 수정)
  - 카테고리, 난이도, 시간 제한, 공개 설정 등 유효성 검증
  - updated_at 자동 업데이트

### 3. 문제 삭제 API (DELETE /api/problems/:id) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\problemController.js:181-194`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:305-334`
- **상태**: ✅ 완료
- **기능**:
  - 제출 이력 확인 (제출 이력이 있으면 삭제 불가)
  - 테스트 케이스 cascade 삭제
  - 관리자 권한 필수

### 4. 문제 목록 조회 API (GET /api/problems)
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\problemController.js:12-45`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:5-102`
- **상태**: ✅ 완료
- **기능**:
  - 카테고리 필터링 (category 쿼리 파라미터)
  - 난이도 필터링 (difficulty 쿼리 파라미터)
  - 검색 기능 (search 쿼리 파라미터 - 제목/설명)
  - 페이지네이션 (page, limit)
  - 학생은 public 문제만 조회 가능
  - 정확도 및 제출 수 통계 포함
  - 사용자별 풀이 여부 표시 (is_solved)

### 5. 문제 상세 조회 API (GET /api/problems/:id)
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\problemController.js:47-60`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:104-196`
- **상태**: ✅ 완료
- **기능**:
  - 문제 정보 전체 조회
  - 학생은 public 문제만 조회 가능
  - 관리자는 모든 테스트 케이스 조회
  - 학생은 공개 테스트 케이스만 조회
  - 정확도 및 제출 통계 포함
  - 작성자 정보 포함

### 6. 테스트 케이스 추가 API (POST /api/problems/:id/test-cases) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\testCaseController.js:22-49`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:376-405`
- **상태**: ✅ 완료
- **기능**:
  - 입력 데이터, 예상 출력, 공개 여부 설정
  - 테스트 케이스 순서 지정 (order)
  - 문제 존재 여부 확인

### 7. 테스트 케이스 수정 API (PUT /api/problems/:problemId/test-cases/:caseId) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\testCaseController.js:51-71`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:407-458`
- **상태**: ✅ 완료
- **기능**:
  - 부분 업데이트 지원
  - 입력 데이터, 예상 출력, 공개 여부, 순서 수정 가능

### 8. 테스트 케이스 삭제 API (DELETE /api/problems/:problemId/test-cases/:caseId) - 관리자 전용
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\testCaseController.js:73-86`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:460-473`
- **상태**: ✅ 완료
- **기능**:
  - 테스트 케이스 개별 삭제
  - 존재 여부 확인

### 9. 테스트 케이스 조회 API (GET /api/problems/:id/test-cases)
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\testCaseController.js:5-20`
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\services\problemService.js:336-374`
- **상태**: ✅ 완료
- **기능**:
  - 관리자는 모든 테스트 케이스 조회
  - 학생은 공개 테스트 케이스만 조회
  - test_order 순서대로 정렬

### 10. 카테고리 목록 조회 API (GET /api/categories)
- **파일**: `C:\test\python-code-judge\backend\src\modules\problems\controllers\categoryController.js:1-16`
- **파일**: `C:\test\python-code-judge\backend\src\shared\utils\validators.js:2-14`
- **상태**: ✅ 완료
- **기능**:
  - 정적 카테고리 목록 반환
  - 11개 카테고리: 입출력, 조건문, 반복문, 리스트, 문자열, 함수, 재귀, 정렬, 탐색, 동적계획법, 기타

---

## API 테스트 결과

### 성공 케이스

#### 1. 로그인
- ✅ 관리자 로그인 성공
- ✅ 학생 로그인 성공

#### 2. 카테고리 조회
- ✅ 카테고리 목록 조회 성공 (11개 카테고리)

#### 3. 문제 등록
- ✅ 문제 등록 성공
- ✅ 학생 권한 검증 성공 (403 Forbidden)

#### 4. 테스트 케이스 추가
- ✅ 공개 테스트 케이스 추가 성공
- ✅ 비공개 테스트 케이스 추가 성공

#### 5. 문제 목록 조회
- ✅ 전체 문제 목록 조회 성공
- ✅ 카테고리 필터링 성공
- ✅ 난이도 필터링 성공
- ✅ 페이지네이션 성공

#### 6. 문제 상세 조회
- ✅ 관리자 문제 상세 조회 성공 (모든 테스트 케이스)
- ✅ 학생 문제 상세 조회 성공 (공개 테스트 케이스만)

#### 7. 문제 수정
- ✅ 문제 수정 성공
- ✅ 수정 내용 반영 확인

#### 8. 테스트 케이스 수정
- ✅ 테스트 케이스 수정 성공

#### 9. 테스트 케이스 조회
- ✅ 관리자 테스트 케이스 조회 성공 (모든 케이스)
- ✅ 학생 테스트 케이스 조회 성공 (공개 케이스만)

#### 10. 유효성 검증
- ✅ 카테고리 유효성 검증 성공
- ✅ 난이도 유효성 검증 성공
- ✅ 필수 필드 검증 성공

#### 11. 테스트 케이스 삭제
- ✅ 테스트 케이스 삭제 성공

#### 12. 문제 삭제
- ✅ 문제 삭제 성공

---

## 라우팅 구조

### 문제 관리 라우트 (C:\test\python-code-judge\backend\src\modules\problems\routes\problemRoutes.js)
```
GET    /api/problems                          - 문제 목록 조회 (인증 필요)
GET    /api/problems/:id                      - 문제 상세 조회 (인증 필요)
POST   /api/problems                          - 문제 등록 (관리자 전용)
PUT    /api/problems/:id                      - 문제 수정 (관리자 전용)
DELETE /api/problems/:id                      - 문제 삭제 (관리자 전용)
GET    /api/problems/:id/test-cases           - 테스트 케이스 조회 (인증 필요)
POST   /api/problems/:id/test-cases           - 테스트 케이스 추가 (관리자 전용)
PUT    /api/problems/:id/test-cases/:caseId   - 테스트 케이스 수정 (관리자 전용)
DELETE /api/problems/:id/test-cases/:caseId   - 테스트 케이스 삭제 (관리자 전용)
```

### 카테고리 라우트 (C:\test\python-code-judge\backend\src\modules\problems\routes\categoryRoutes.js)
```
GET    /api/categories                        - 카테고리 목록 조회 (인증 필요)
```

---

## 데이터베이스 스키마

### problems 테이블
- id (BIGSERIAL PRIMARY KEY)
- title (VARCHAR UNIQUE)
- description (TEXT)
- category (VARCHAR) - CHECK constraint
- difficulty (INTEGER 1-5) - CHECK constraint
- time_limit (INTEGER 1-10) - CHECK constraint
- memory_limit (INTEGER) - CHECK constraint
- visibility (VARCHAR) - public/private/draft
- judge_config (JSONB)
- created_by (BIGINT) - users.id FK
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### test_cases 테이블
- id (BIGSERIAL PRIMARY KEY)
- problem_id (BIGINT) - problems.id FK (CASCADE DELETE)
- input_data (TEXT)
- expected_output (TEXT)
- is_public (BOOLEAN)
- test_order (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

## 보안 및 권한

### 인증 (Authentication)
- 모든 API는 JWT 토큰 인증 필요
- authenticate 미들웨어 적용 (C:\test\python-code-judge\backend\src\shared\middleware\auth.js)

### 권한 (Authorization)
- **관리자 전용 API**:
  - POST /api/problems
  - PUT /api/problems/:id
  - DELETE /api/problems/:id
  - POST /api/problems/:id/test-cases
  - PUT /api/problems/:id/test-cases/:caseId
  - DELETE /api/problems/:id/test-cases/:caseId

- **학생 제한**:
  - 학생은 public 문제만 조회 가능
  - 학생은 공개 테스트 케이스만 조회 가능
  - 문제 등록/수정/삭제 불가
  - 테스트 케이스 추가/수정/삭제 불가

### 감사 로그 (Audit Log)
- 모든 관리자 작업 (create, update, delete)은 auditMiddleware를 통해 기록됨
- C:\test\python-code-judge\backend\src\modules\audit\middleware\auditMiddleware.js

---

## 유효성 검증

### 카테고리 검증 (C:\test\python-code-judge\backend\src\shared\utils\validators.js:25-27)
```javascript
PROBLEM_CATEGORIES = [
  '입출력', '조건문', '반복문', '리스트', '문자열',
  '함수', '재귀', '정렬', '탐색', '동적계획법', '기타'
]
```

### 난이도 검증 (C:\test\python-code-judge\backend\src\shared\utils\validators.js:29-33)
- 최소: 1
- 최대: 5
- 정수 값만 허용

### 시간 제한 검증 (C:\test\python-code-judge\backend\src\shared\utils\validators.js:35-39)
- 최소: 1초
- 최대: 10초
- 정수 값만 허용

### 공개 설정 검증 (C:\test\python-code-judge\backend\src\shared\utils\validators.js:41-44)
- public: 공개 문제
- private: 비공개 문제
- draft: 초안 (작성 중)

---

## 성능 및 최적화

### 데이터베이스 쿼리 최적화
- 문제 목록 조회 시 LEFT JOIN을 통한 제출 통계 계산
- EXISTS 서브쿼리를 통한 풀이 여부 확인
- 인덱스 활용 (title UNIQUE, problem_id FK 등)

### 페이지네이션
- 기본값: page=1, limit=10
- LIMIT/OFFSET을 통한 효율적인 페이지네이션
- 총 개수 조회를 위한 COUNT 쿼리 분리

---

## 에러 처리

### 표준 에러 응답
- ValidationError (400): 입력 유효성 검증 실패
- UnauthorizedError (401): 인증 실패
- ForbiddenError (403): 권한 부족
- NotFoundError (404): 리소스를 찾을 수 없음
- ConflictError (409): 중복 또는 제약 조건 위반
- InternalServerError (500): 서버 내부 오류

### 에러 메시지
- 한국어 메시지 제공
- 명확한 에러 원인 설명
- 개발 환경에서 스택 트레이스 포함

---

## 테스트 스크립트

### 위치
`C:\test\python-code-judge\backend\test-problems.js`

### 테스트 케이스
1. 로그인 (관리자/학생)
2. 카테고리 목록 조회
3. 문제 등록 (관리자)
4. 테스트 케이스 추가 (공개/비공개)
5. 문제 목록 조회 (필터링, 페이지네이션)
6. 문제 상세 조회 (관리자/학생)
7. 문제 수정
8. 테스트 케이스 수정
9. 테스트 케이스 조회 (관리자/학생)
10. 유효성 검증 (카테고리, 난이도, 필수 필드)
11. 테스트 케이스 삭제
12. 문제 삭제

---

## 결론

Phase 2의 문제 관리 모듈이 성공적으로 구현되었으며, 모든 API가 정상적으로 동작함을 확인했습니다.

### 주요 성과
- ✅ 12개 API 엔드포인트 완성
- ✅ 관리자/학생 권한 분리
- ✅ 유효성 검증 완료
- ✅ 공개/비공개 테스트 케이스 관리
- ✅ 페이지네이션 및 필터링 지원
- ✅ 통계 정보 제공 (정확도, 제출 수, 풀이 여부)
- ✅ 감사 로그 통합
- ✅ 에러 처리 완료

### 다음 단계
Phase 3: 제출 및 채점 모듈 구현
