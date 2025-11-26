# Python Judge 프로젝트 실행 계획

**버전**: 1.0
**작성일**: 2025-11-26
**작성자**: 실행계획 수립팀
**프로젝트 기간**: 3일 (MVP 기준)
**기반 문서**: PRD, 설계 원칙, 아키텍처, ERD

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [Phase별 실행 계획](#phase별-실행-계획)
3. [데이터베이스 작업 목록](#데이터베이스-작업-목록)
4. [백엔드 작업 목록](#백엔드-작업-목록)
5. [프론트엔드 작업 목록](#프론트엔드-작업-목록)
6. [병렬 작업 전략](#병렬-작업-전략)
7. [리스크 관리](#리스크-관리)

---

## 프로젝트 개요

### 핵심 목표
- Python 코딩 테스트 자동 채점 플랫폼 구축
- 평균 5초 이내 채점 완료
- 실시간 스코어보드 제공
- 안전한 코드 실행 환경 구축

### 주요 제약사항
- Docker 사용 불가 → subprocess + AST 정적 분석 사용
- Vercel WebSocket 미지원 → 폴링 방식 사용
- Vercel 함수 타임아웃 10초 (Hobby 플랜)

### 전체 일정 요약

| Phase | 작업 내용 | 예상 소요 시간 | 누적 시간 |
|-------|----------|---------------|----------|
| **Phase 0** | 환경 설정 및 프로젝트 초기화 | 4시간 | 4시간 |
| **Phase 1** | 데이터베이스 설계 및 구축 | 4시간 | 8시간 |
| **Phase 2** | 백엔드 코어 개발 | 8시간 | 16시간 |
| **Phase 3** | 채점 엔진 개발 | 8시간 | 24시간 |
| **Phase 4** | 프론트엔드 개발 | 8시간 | 32시간 |
| **Phase 5** | 통합 테스트 및 배포 | 4시간 | 36시간 |

**총 예상 소요 시간**: 36시간 (약 3일, 하루 12시간 작업 기준)

---

## Phase별 실행 계획

### Phase 0: 환경 설정 및 프로젝트 초기화

**목표**: 개발 환경 구축 및 기본 인프라 설정
**의존성**: 없음
**예상 소요**: 4시간

#### 완료 조건 체크리스트

##### 1. 개발 환경 설정
- [ ] Node.js (v18+) 및 npm 설치 확인
  - 완료 조건: `node -v`, `npm -v` 정상 실행
  - 의존성: 없음

- [ ] Python (3.8-3.12) 설치 및 환경 확인
  - 완료 조건: 여러 버전 Python 실행 가능
  - 의존성: 없음

- [ ] Git 설정 및 브랜치 전략 확립
  - 완료 조건: main, develop 브랜치 생성
  - 의존성: 없음

##### 2. 외부 서비스 설정
- [ ] Supabase 프로젝트 생성
  - 완료 조건: Database URL, API Key 발급
  - 의존성: 없음

- [ ] Vercel 계정 생성 및 프로젝트 연결
  - 완료 조건: Frontend/Backend 프로젝트 생성
  - 의존성: GitHub Repository

- [ ] GitHub Repository 생성 및 기본 구조 설정
  - 완료 조건: README, .gitignore, LICENSE 작성
  - 의존성: 없음

##### 3. 프로젝트 구조 초기화
- [ ] Backend 디렉토리 구조 생성
  - 완료 조건: src/modules, src/shared, src/config 폴더 생성
  - 의존성: 없음

- [ ] Frontend 디렉토리 구조 생성
  - 완료 조건: src/components, src/pages, src/api 폴더 생성
  - 의존성: 없음

- [ ] 환경 변수 템플릿 작성
  - 완료 조건: .env.example 파일 작성
  - 의존성: 없음

##### 4. 개발 도구 설정
- [ ] ESLint + Prettier 설정
  - 완료 조건: .eslintrc, .prettierrc 파일 작성
  - 의존성: 없음

- [ ] Husky + lint-staged 설정
  - 완료 조건: 커밋 전 자동 린트 실행
  - 의존성: npm 패키지 설치

- [ ] 테스트 프레임워크 설정 (Jest)
  - 완료 조건: jest.config.js 작성, 샘플 테스트 실행
  - 의존성: npm 패키지 설치

**병렬 수행 가능**: 개발 환경 설정, 외부 서비스 설정, 개발 도구 설정은 동시 진행 가능

---

### Phase 1: 데이터베이스 설계 및 구축

**목표**: PostgreSQL 스키마 구축 및 Supabase 연동
**의존성**: Phase 0 완료 후 시작 가능
**예상 소요**: 4시간

#### 완료 조건 체크리스트

##### 1. 데이터베이스 스키마 설계
- [ ] ERD 기반 마이그레이션 스크립트 작성
  - 완료 조건: 11개 테이블 생성 SQL 작성 완료
  - 의존성: docs/6-erd.md 참조
  - 테이블: students, administrators, problems, test_cases, submissions, judging_results, education_sessions, session_students, session_problems, scoreboards, audit_logs

- [ ] 인덱스 생성 스크립트 작성
  - 완료 조건: 성능 최적화 인덱스 30개 이상 생성
  - 의존성: 테이블 생성 완료

- [ ] CHECK 제약조건 및 트리거 작성
  - 완료 조건: 비즈니스 규칙 반영 (난이도 1-5, 카테고리 검증 등)
  - 의존성: 테이블 생성 완료

##### 2. Supabase 연동
- [ ] 마이그레이션 실행
  - 완료 조건: Supabase 대시보드에서 테이블 확인
  - 의존성: 마이그레이션 스크립트 완료

- [ ] Row Level Security (RLS) 정책 설정
  - 완료 조건: 학생/관리자 권한별 접근 제어
  - 의존성: 테이블 생성 완료

- [ ] 데이터베이스 연결 테스트
  - 완료 조건: Node.js에서 Supabase 쿼리 성공
  - 의존성: Supabase URL/Key 설정

##### 3. 시드 데이터 준비
- [ ] 관리자 계정 시드 데이터 작성
  - 완료 조건: 최소 1명의 super_admin 계정 생성
  - 의존성: administrators 테이블 생성

- [ ] 테스트 학생 계정 시드 데이터 작성
  - 완료 조건: 최소 3명의 테스트 학생 계정 생성
  - 의존성: students 테이블 생성

- [ ] 샘플 문제 및 테스트 케이스 작성
  - 완료 조건: 카테고리별 최소 1개 문제 (11개 총)
  - 의존성: problems, test_cases 테이블 생성

**병렬 수행 가능**: 시드 데이터 작성은 스키마 설계와 병렬 진행 가능

---

### Phase 2: 백엔드 코어 개발

**목표**: Express API 서버 구축, 인증/인가, 비즈니스 로직 구현
**의존성**: Phase 1 완료 후 시작 가능
**예상 소요**: 8시간

#### 완료 조건 체크리스트

##### 1. 공통 인프라 구축
- [ ] Express 서버 기본 설정
  - 완료 조건: app.js, server.js 작성, 헬스체크 엔드포인트 동작
  - 의존성: 없음

- [ ] 에러 처리 미들웨어 구현
  - 완료 조건: AppError, ValidationError 등 커스텀 에러 클래스 정의
  - 의존성: 없음

- [ ] 로거 설정 (winston)
  - 완료 조건: 요청/응답 로깅, 에러 로깅 동작
  - 의존성: 없음

- [ ] CORS, 보안 헤더 설정 (helmet)
  - 완료 조건: 프론트엔드에서 API 호출 가능
  - 의존성: 없음

##### 2. 인증 모듈 (auth/)
- [ ] JWT 토큰 생성/검증 유틸리티 작성
  - 완료 조건: generateToken, verifyToken 함수 구현
  - 의존성: JWT_SECRET 환경 변수

- [ ] 인증 미들웨어 구현
  - 완료 조건: authMiddleware, requireRole 미들웨어 동작
  - 의존성: JWT 유틸리티

- [ ] 학생 회원가입 API
  - 완료 조건: POST /api/auth/signup (학생)
  - 의존성: students 테이블, bcrypt

- [ ] 로그인 API (학생/관리자 통합)
  - 완료 조건: POST /api/auth/login
  - 의존성: JWT 유틸리티

- [ ] 비밀번호 찾기/변경 API
  - 완료 조건: POST /api/auth/reset-password, PUT /api/auth/change-password
  - 의존성: 인증 미들웨어

##### 3. 사용자 관리 모듈 (users/)
- [ ] 학생 목록 조회 API (관리자 전용)
  - 완료 조건: GET /api/users/students
  - 의존성: RBAC 미들웨어

- [ ] 학생 상세 조회 API
  - 완료 조건: GET /api/users/students/:id
  - 의존성: 인증 미들웨어

##### 4. 문제 관리 모듈 (problems/)
- [ ] 문제 등록 API (관리자 전용)
  - 완료 조건: POST /api/problems
  - 의존성: problems 테이블

- [ ] 문제 수정/삭제 API
  - 완료 조건: PUT /api/problems/:id, DELETE /api/problems/:id
  - 의존성: 문제 등록 API

- [ ] 카테고리별 문제 조회 API
  - 완료 조건: GET /api/problems?category=조건문
  - 의존성: problems 테이블

- [ ] 문제 상세 조회 API
  - 완료 조건: GET /api/problems/:id (공개 테스트 케이스 포함)
  - 의존성: test_cases 테이블

- [ ] 테스트 케이스 관리 API
  - 완료 조건: POST/PUT/DELETE /api/problems/:id/test-cases
  - 의존성: test_cases 테이블

##### 5. 세션 관리 모듈 (sessions/)
- [ ] 세션 생성 API (관리자 전용)
  - 완료 조건: POST /api/sessions
  - 의존성: education_sessions 테이블

- [ ] 세션 학생/문제 할당 API
  - 완료 조건: POST /api/sessions/:id/students, POST /api/sessions/:id/problems
  - 의존성: session_students, session_problems 테이블

- [ ] 세션 시작/종료 API
  - 완료 조건: PUT /api/sessions/:id/status
  - 의존성: education_sessions 테이블

- [ ] 세션 초기화 API (제출 이력 삭제)
  - 완료 조건: DELETE /api/sessions/:id/reset
  - 의존성: submissions, scoreboards 테이블

- [ ] 스코어보드 조회 API
  - 완료 조건: GET /api/sessions/:id/scoreboard
  - 의존성: scoreboards 테이블

##### 6. 감사 로그 모듈 (audit/)
- [ ] 감사 로그 기록 미들웨어
  - 완료 조건: 로그인, 문제 관리, 코드 제출 자동 기록
  - 의존성: audit_logs 테이블

- [ ] 감사 로그 조회 API (최고관리자 전용)
  - 완료 조건: GET /api/audit-logs
  - 의존성: audit_logs 테이블

**병렬 수행 가능**: 인증 모듈 완료 후 사용자, 문제, 세션 모듈은 동시 개발 가능

---

### Phase 3: 채점 엔진 개발

**목표**: Python 코드 자동 채점 시스템 구축 (보안 우선)
**의존성**: Phase 2 (문제 관리 모듈) 완료 후 시작 가능
**예상 소요**: 8시간

#### 완료 조건 체크리스트

##### 1. 보안 검증 모듈
- [ ] AST 정적 분석기 구현
  - 완료 조건: 금지 모듈 탐지 (os, subprocess, socket, urllib, eval, exec)
  - 의존성: Python ast 모듈

- [ ] 허용 모듈 화이트리스트 정의
  - 완료 조건: math, random, itertools, collections, string, re, datetime, json 등
  - 의존성: AST 분석기

- [ ] 코드 크기 검증
  - 완료 조건: 최대 64KB 제한
  - 의존성: 없음

##### 2. 코드 실행 엔진
- [ ] subprocess 격리 실행 함수 구현
  - 완료 조건: 별도 프로세스에서 Python 코드 실행
  - 의존성: subprocess 모듈

- [ ] 타임아웃 설정
  - 완료 조건: 문제별 시간 제한 (1-10초) 적용
  - 의존성: subprocess timeout

- [ ] 메모리 제한 구현 (psutil)
  - 완료 조건: 256MB 메모리 제한
  - 의존성: psutil 라이브러리

- [ ] 임시 디렉토리 생성 및 정리
  - 완료 조건: 코드 실행 후 임시 파일 자동 삭제
  - 의존성: fs, path 모듈

##### 3. 답안 정규화 및 비교
- [ ] 출력 정규화 함수 구현
  - 완료 조건: 줄바꿈 통일, trailing whitespace 제거, 빈 줄 제거
  - 의존성: 없음

- [ ] 부동소수점 비교 함수 구현
  - 완료 조건: 상대 오차 1e-9 허용
  - 의존성: 없음

- [ ] 테스트 케이스별 출력 비교
  - 완료 조건: 학생 출력 vs 예상 출력 비교
  - 의존성: 정규화 함수

##### 4. 채점 로직
- [ ] 채점 결과 상태 정의
  - 완료 조건: AC, WA, TLE, RE, SE, MLE 상태 처리
  - 의존성: 없음

- [ ] 전체 테스트 케이스 실행 및 채점
  - 완료 조건: 모든 케이스 통과 시 AC, 하나라도 실패 시 WA
  - 의존성: 코드 실행 엔진, 답안 비교

- [ ] 실행 시간 및 메모리 측정
  - 완료 조건: 각 테스트 케이스별 실행 시간, 메모리 기록
  - 의존성: psutil

##### 5. 제출 및 채점 모듈 (submissions/)
- [ ] 코드 제출 API
  - 완료 조건: POST /api/submissions (코드 텍스트 또는 파일 업로드)
  - 의존성: AST 분석기

- [ ] 중복 제출 차단
  - 완료 조건: 5초 이내 동일 문제 중복 제출 불가
  - 의존성: submissions 테이블 조회

- [ ] 채점 API 통합
  - 완료 조건: 제출 즉시 채점 시작 → 결과 저장
  - 의존성: 채점 엔진

- [ ] 제출 이력 조회 API
  - 완료 조건: GET /api/submissions?student_id=1
  - 의존성: submissions 테이블

- [ ] 채점 결과 상세 조회 API
  - 완료 조건: GET /api/submissions/:id/result
  - 의존성: judging_results 테이블

##### 6. 스코어보드 자동 업데이트
- [ ] 채점 완료 시 스코어보드 갱신 트리거
  - 완료 조건: AC 시 점수, 해결 문제 수, 순위 자동 업데이트
  - 의존성: scoreboards 테이블

**병렬 수행 가능**: AST 분석기와 코드 실행 엔진은 독립적으로 개발 가능

---

### Phase 4: 프론트엔드 개발

**목표**: React UI 구축 및 API 연동
**의존성**: Phase 2 (백엔드 코어) 완료 후 시작 가능
**예상 소요**: 8시간

#### 완료 조건 체크리스트

##### 1. 공통 인프라
- [ ] React + Vite 프로젝트 초기화
  - 완료 조건: npm run dev 실행 가능
  - 의존성: 없음

- [ ] Tailwind CSS 설정
  - 완료 조건: 유틸리티 클래스 사용 가능
  - 의존성: Tailwind 설치

- [ ] React Router 설정
  - 완료 조건: 라우팅 동작 (/, /login, /problems 등)
  - 의존성: react-router-dom

- [ ] Axios 인스턴스 설정 (API 클라이언트)
  - 완료 조건: JWT 토큰 자동 추가, 에러 처리
  - 의존성: axios

##### 2. 인증 UI
- [ ] 로그인 화면
  - 완료 조건: 학생/관리자 탭 전환, 로그인 성공 시 JWT 저장
  - 의존성: POST /api/auth/login

- [ ] 회원가입 화면 (학생)
  - 완료 조건: 군번(영문/숫자/하이픈), ID, 이름, 비밀번호 입력
  - 의존성: POST /api/auth/signup

- [ ] 비밀번호 찾기 모달
  - 완료 조건: 군번(영문/숫자/하이픈), 이름 입력 후 비밀번호 재설정
  - 의존성: POST /api/auth/reset-password

##### 3. 학생 페이지
- [ ] 문제 목록 화면
  - 완료 조건: 카테고리 필터, 난이도 필터, 검색 기능
  - 의존성: GET /api/problems

- [ ] 문제 상세 화면 (2컬럼 레이아웃)
  - 완료 조건: 좌측 문제 설명, 우측 코드 에디터 (textarea)
  - 의존성: GET /api/problems/:id

- [ ] 코드 제출 기능
  - 완료 조건: 제출 버튼 클릭 시 채점 진행 상황 표시
  - 의존성: POST /api/submissions

- [ ] 제출 이력 화면
  - 완료 조건: 테이블 형태, 최신 제출 상단
  - 의존성: GET /api/submissions

- [ ] 채점 결과 상세 모달
  - 완료 조건: AC/WA/TLE 표시, 통과 케이스 수, 실행 시간
  - 의존성: GET /api/submissions/:id/result

- [ ] 실시간 스코어보드 (폴링)
  - 완료 조건: 5초 간격 자동 새로고침, 순위 변동 애니메이션
  - 의존성: GET /api/sessions/:id/scoreboard

##### 4. 관리자 페이지
- [ ] 관리자 대시보드
  - 완료 조건: 세션 목록, 문제 목록 표시
  - 의존성: GET /api/sessions, GET /api/problems

- [ ] 문제 등록/수정 폼
  - 완료 조건: 제목, 설명, 카테고리, 난이도 입력
  - 의존성: POST/PUT /api/problems

- [ ] 테스트 케이스 관리 UI
  - 완료 조건: 입력/출력 추가, 공개/비공개 설정
  - 의존성: POST /api/problems/:id/test-cases

- [ ] 세션 생성 폼
  - 완료 조건: 이름, 시작/종료 시각, 학생/문제 선택
  - 의존성: POST /api/sessions

- [ ] 세션 관리 화면
  - 완료 조건: 시작/종료 버튼, 초기화 버튼
  - 의존성: PUT /api/sessions/:id/status, DELETE /api/sessions/:id/reset

##### 5. 공통 컴포넌트
- [ ] 로딩 스피너
  - 완료 조건: API 호출 중 표시
  - 의존성: 없음

- [ ] 토스트 알림 (react-toastify)
  - 완료 조건: 성공/실패 메시지 표시
  - 의존성: react-toastify

- [ ] 모달 컴포넌트
  - 완료 조건: 재사용 가능한 모달 래퍼
  - 의존성: 없음

**병렬 수행 가능**: 학생 페이지와 관리자 페이지는 독립적으로 개발 가능

---

### Phase 5: 통합 테스트 및 배포

**목표**: 전체 기능 통합 테스트 및 Vercel 배포
**의존성**: Phase 2, 3, 4 완료 후 시작 가능
**예상 소요**: 4시간

#### 완료 조건 체크리스트

##### 1. 통합 테스트
- [ ] 엔드투엔드 시나리오 테스트
  - 완료 조건: 로그인 → 문제 선택 → 코드 제출 → 결과 확인 성공
  - 의존성: 전체 시스템 통합

- [ ] 관리자 시나리오 테스트
  - 완료 조건: 문제 등록 → 세션 생성 → 스코어보드 확인 성공
  - 의존성: 전체 시스템 통합

- [ ] 채점 엔진 스트레스 테스트
  - 완료 조건: 10개 제출 동시 처리 성공
  - 의존성: 채점 엔진

##### 2. 보안 검증
- [ ] 금지 모듈 사용 코드 제출 테스트
  - 완료 조건: os, subprocess 등 사용 시 SE 반환
  - 의존성: AST 분석기

- [ ] 타임아웃 테스트
  - 완료 조건: 무한 루프 코드 제출 시 TLE 반환
  - 의존성: 채점 엔진

- [ ] 메모리 제한 테스트
  - 완료 조건: 대용량 리스트 생성 시 MLE 반환
  - 의존성: 채점 엔진

##### 3. 배포 설정
- [ ] Vercel 환경 변수 설정
  - 완료 조건: DATABASE_URL, JWT_SECRET 등 설정
  - 의존성: Vercel 프로젝트

- [ ] Backend 배포 (Vercel Functions)
  - 완료 조건: API 엔드포인트 정상 동작
  - 의존성: Backend 코드 완료

- [ ] Frontend 배포 (Vercel)
  - 완료 조건: 프로덕션 URL 접속 가능
  - 의존성: Frontend 코드 완료

- [ ] GitHub Actions CI/CD 설정
  - 완료 조건: main 브랜치 푸시 시 자동 배포
  - 의존성: .github/workflows/deploy.yml

##### 4. 문서화
- [ ] API 문서 작성 (Swagger 또는 Postman)
  - 완료 조건: 모든 엔드포인트 문서화
  - 의존성: API 완료

- [ ] 사용자 매뉴얼 작성
  - 완료 조건: 학생용, 관리자용 매뉴얼
  - 의존성: UI 완료

- [ ] 배포 가이드 작성
  - 완료 조건: 환경 변수 설정, 배포 절차 문서화
  - 의존성: 배포 완료

##### 5. 운영 준비
- [ ] 헬스체크 엔드포인트 확인
  - 완료 조건: GET /api/health 정상 응답
  - 의존성: Backend 배포

- [ ] 모니터링 설정
  - 완료 조건: 에러 로그, 성능 메트릭 수집
  - 의존성: winston, Vercel Analytics

- [ ] 백업 자동화 확인
  - 완료 조건: Supabase 일 1회 자동 백업 설정
  - 의존성: Supabase 설정

**병렬 수행 가능**: 문서화 작업은 통합 테스트와 병렬 진행 가능

---

## 데이터베이스 작업 목록

### 1. 스키마 설계 및 마이그레이션

- [ ] students 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, 제약조건, 인덱스 포함된 SQL 파일
  - 의존성: 없음
  - 병렬 가능: administrators, problems 테이블과 병렬 가능

- [ ] administrators 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, 제약조건, 인덱스 포함된 SQL 파일
  - 의존성: 없음
  - 병렬 가능: students, problems 테이블과 병렬 가능

- [ ] problems 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, 제약조건, 인덱스, FK(author_id), judge_config JSONB 포함
  - 의존성: administrators 테이블
  - 병렬 가능: 없음

- [ ] test_cases 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, 제약조건, FK(problem_id), 복합 인덱스 포함
  - 의존성: problems 테이블
  - 병렬 가능: 없음

- [ ] submissions 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, FK(student_id, problem_id, session_id), 복합 인덱스 포함
  - 의존성: students, problems 테이블
  - 병렬 가능: 없음

- [ ] judging_results 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, FK(submission_id), UNIQUE 제약, CHECK 조건 포함
  - 의존성: submissions 테이블
  - 병렬 가능: 없음

- [ ] education_sessions 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, FK(creator_id), CHECK(end_time > start_time) 포함
  - 의존성: administrators 테이블
  - 병렬 가능: 없음

- [ ] session_students 매핑 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 복합 PK(session_id, student_id), FK 제약 포함
  - 의존성: education_sessions, students 테이블
  - 병렬 가능: session_problems, scoreboards와 병렬 가능

- [ ] session_problems 매핑 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 복합 PK(session_id, problem_id), FK 제약 포함
  - 의존성: education_sessions, problems 테이블
  - 병렬 가능: session_students, scoreboards와 병렬 가능

- [ ] scoreboards 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 복합 PK(session_id, student_id), rank 인덱스 포함
  - 의존성: education_sessions, students 테이블
  - 병렬 가능: session_students, session_problems와 병렬 가능

- [ ] audit_logs 테이블 마이그레이션 스크립트 작성
  - 완료 조건: 컬럼, 인덱스(user_id, performed_at, action_type) 포함
  - 의존성: 없음
  - 병렬 가능: 다른 모든 테이블과 병렬 가능

### 2. 트리거 및 자동화

- [ ] updated_at 자동 갱신 트리거 작성
  - 완료 조건: problems, test_cases, education_sessions 테이블에 적용
  - 의존성: 해당 테이블 마이그레이션
  - 병렬 가능: 다른 트리거와 병렬 가능

- [ ] submission_count 자동 증가 트리거 작성
  - 완료 조건: submissions INSERT 시 problems.submission_count 증가
  - 의존성: problems, submissions 테이블
  - 병렬 가능: 다른 트리거와 병렬 가능

- [ ] accuracy_rate 자동 계산 트리거 작성
  - 완료 조건: judging_results INSERT/UPDATE 시 정답률 재계산
  - 의존성: problems, judging_results 테이블
  - 병렬 가능: 다른 트리거와 병렬 가능

- [ ] scoreboard 자동 업데이트 트리거 작성
  - 완료 조건: AC 결과 시 스코어보드 점수/순위 자동 갱신
  - 의존성: judging_results, scoreboards 테이블
  - 병렬 가능: 다른 트리거와 병렬 가능

### 3. 시드 데이터

- [ ] 관리자 계정 시드 데이터 작성
  - 완료 조건: super_admin 1명, admin 1명 기본 계정 생성 스크립트
  - 의존성: administrators 테이블
  - 병렬 가능: 학생, 문제 시드와 병렬 가능

- [ ] 테스트 학생 계정 시드 데이터 작성
  - 완료 조건: 개발/테스트용 학생 5명 생성 스크립트
  - 의존성: students 테이블
  - 병렬 가능: 관리자, 문제 시드와 병렬 가능

- [ ] 샘플 문제 시드 데이터 작성
  - 완료 조건: 11개 카테고리 각 1개씩 샘플 문제 + 테스트 케이스
  - 의존성: problems, test_cases 테이블
  - 병렬 가능: 관리자, 학생 시드와 병렬 가능

---

## 백엔드 작업 목록

**(상세 내용은 백엔드 에이전트 결과 참조, 총 약 120개 Task)**

### 주요 모듈

1. **공유 계층 (Shared)**: 에러 클래스, 미들웨어, 유틸리티
2. **인증 모듈 (auth)**: 로그인, 회원가입, JWT 관리
3. **사용자 모듈 (users)**: 학생/관리자 관리
4. **문제 모듈 (problems)**: 문제 CRUD, 테스트 케이스 관리
5. **제출 모듈 (submissions)**: 코드 제출, 채점 엔진
6. **세션 모듈 (sessions)**: 세션 관리, 스코어보드
7. **감사 로그 (audit)**: 중요 행위 기록

---

## 프론트엔드 작업 목록

**(상세 내용은 프론트엔드 에이전트 결과 참조, 총 약 100개 Task)**

### 주요 모듈

1. **프로젝트 초기 설정**: React, Tailwind, Router
2. **공통 컴포넌트**: Button, Input, Modal, Toast
3. **API 연동**: Axios 클라이언트, API 모듈
4. **인증 페이지**: 로그인, 회원가입, 비밀번호 찾기
5. **학생 페이지**: 문제 목록, 상세, 제출 이력, 스코어보드
6. **관리자 페이지**: 문제 관리, 세션 관리, 학생 관리

---

## 병렬 작업 전략

### 1단계 병렬 (Phase 0)
- 개발 환경 설정
- 외부 서비스 설정 (Supabase, Vercel)
- 개발 도구 설정 (ESLint, Prettier)

### 2단계 병렬 (Phase 1)
- 독립적인 테이블 마이그레이션 (students, administrators, audit_logs)
- 시드 데이터 준비

### 3단계 병렬 (Phase 2 완료 후)
- 백엔드 모듈 개발 (사용자, 문제, 세션)
- 프론트엔드 컴포넌트 개발

### 4단계 병렬 (Phase 3)
- AST 분석기 개발
- 코드 실행 엔진 개발

### 5단계 병렬 (Phase 4)
- 학생 페이지 개발
- 관리자 페이지 개발

---

## 리스크 관리

| 리스크 | 발생 가능성 | 영향도 | 완화 전략 |
|--------|------------|--------|----------|
| **채점 엔진 개발 복잡도** | 중 | 높음 | 조기 프로토타입 개발, 단순 케이스부터 점진적 확장 |
| **Vercel 타임아웃 (10초)** | 중 | 중 | 채점 시간 최적화, 필요 시 Pro 플랜 전환 |
| **보안 취약점** | 중 | 높음 | AST 분석 강화, subprocess 타임아웃 엄격 설정 |
| **프론트엔드 통합 지연** | 중 | 중 | API 문서 우선 작성, Mock API로 병렬 개발 |
| **일정 지연** | 중 | 중 | 핵심 기능 우선, 부가 기능 Phase 2로 연기 |

---

## 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **채점 평균 응답 시간** | 5초 이내 | 채점 API 응답 시간 측정 |
| **시스템 가동률** | 99% 이상 | Vercel 모니터링 |
| **테스트 커버리지** | 60% 이상 | Jest 커버리지 리포트 |
| **보안 검증** | 금지 모듈 100% 차단 | AST 분석 테스트 |
| **사용자 만족도** | 4점 이상 (5점 만점) | 초기 사용자 피드백 |

---

**문서 종료**
