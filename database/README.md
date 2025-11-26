# 데이터베이스 설정 가이드

## 개요

Python Judge 프로젝트의 PostgreSQL 데이터베이스 스키마 및 시드 데이터입니다.

## 파일 구조

```
database/
├── schmea.sql      # 데이터베이스 스키마 (11개 테이블, 21개 인덱스, 6개 트리거, 4개 함수)
├── seeds.sql       # 초기 시드 데이터
├── migrate.js      # 스키마 마이그레이션 스크립트
├── seed.js         # 시드 데이터 삽입 스크립트
├── verify.js       # 데이터베이스 검증 스크립트
└── package.json    # 의존성 관리
```

## 연결 정보

```
Host: localhost
Port: 5432
Database: postgres
User: postgres
Password: claude0729
```

**연결 문자열:**
```
postgresql://postgres:claude0729@localhost:5432/postgres
```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd database
npm install
```

### 2. 스키마 생성

```bash
node migrate.js
```

**결과:**
- 11개 테이블 생성
- 21개 인덱스 생성
- 8개 트리거 생성
- 4개 함수 생성

### 3. 시드 데이터 삽입

```bash
node seed.js
```

**삽입되는 데이터:**
- 관리자 1명 (super_admin / admin123)
- 학생 3명 (student01, student02, student03 / student123)
- 샘플 문제 3개
- 테스트 케이스 15개 (각 문제당 5개)
- 교육 세션 1개 (진행 중)
- 샘플 제출 및 채점 결과 1개

### 4. 검증

```bash
node verify.js
```

모든 테이블, 인덱스, 트리거, 데이터가 정상적으로 생성되었는지 확인합니다.

## 생성된 테이블

| 테이블명 | 설명 | 주요 필드 |
|---------|------|----------|
| administrators | 관리자 계정 | login_id, name, role_level |
| students | 학생 계정 | military_id, login_id, name |
| problems | 문제 정보 | title, category, difficulty |
| test_cases | 테스트 케이스 | problem_id, input_data, expected_output |
| submissions | 코드 제출 | student_id, problem_id, code |
| judging_results | 채점 결과 | submission_id, status, passed_cases |
| education_sessions | 교육 세션 | name, start_time, end_time |
| session_students | 세션-학생 매핑 | session_id, student_id |
| session_problems | 세션-문제 매핑 | session_id, problem_id |
| scoreboards | 점수판 | session_id, student_id, score, rank |
| audit_logs | 감사 로그 | user_id, action_type, performed_at |

## 시드 데이터 상세

### 관리자 계정

| login_id | 비밀번호 | 역할 |
|----------|---------|------|
| super_admin | admin123 | super_admin |

### 학생 계정

| login_id | 비밀번호 | 이름 | 군번 | 소속 |
|----------|---------|------|------|------|
| student01 | student123 | 김철수 | 24-12345 | 1소대 |
| student02 | student123 | 이영희 | 24-12346 | 1소대 |
| student03 | student123 | 박민수 | 24-12347 | 2소대 |

### 샘플 문제

1. **짝수와 홀수 판별** (조건문, 난이도 1)
   - 공개 테스트: 2개
   - 비공개 테스트: 3개

2. **1부터 N까지의 합** (반복문, 난이도 2)
   - 공개 테스트: 2개
   - 비공개 테스트: 3개

3. **리스트 최댓값 찾기** (리스트, 난이도 2)
   - 공개 테스트: 2개
   - 비공개 테스트: 3개

## 백엔드 연결

백엔드에서 데이터베이스 연결은 `backend/src/config/database.js`에서 관리됩니다.

### 사용 예제

```javascript
import { query, getClient } from './config/database.js';

// 간단한 쿼리
const result = await query('SELECT * FROM students WHERE id = $1', [1]);

// 트랜잭션
const client = await getClient();
try {
  await client.query('BEGIN');
  // ... 여러 쿼리 실행
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## 트리거 기능

### 1. set_updated_at()
- 테이블: problems, test_cases, education_sessions
- 동작: UPDATE 시 updated_at 자동 갱신

### 2. increment_submission_count()
- 테이블: submissions
- 동작: 제출 시 문제의 submission_count 증가

### 3. recalc_problem_accuracy()
- 테이블: judging_results
- 동작: 채점 결과 저장 시 문제의 정답률 재계산

### 4. upsert_scoreboard()
- 테이블: judging_results
- 동작: 채점 완료 시 스코어보드 자동 업데이트 및 순위 재계산

## 문제 해결

### 스키마 재생성

```bash
# 1. 기존 테이블 삭제 (주의!)
psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. 스키마 재생성
node migrate.js

# 3. 시드 데이터 재삽입
node seed.js
```

### 연결 테스트

```bash
cd ../backend
node test-db-connection.js
```

## 주의사항

- 운영 환경에서는 반드시 강력한 비밀번호로 변경하세요
- 시드 데이터의 비밀번호 해시는 테스트용입니다 (bcrypt)
- 외래 키 제약 조건으로 인해 데이터 삭제 시 순서에 주의하세요
