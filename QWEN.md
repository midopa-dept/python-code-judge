# Python Code Judge 프로젝트 - 개발 컨텍스트

## 반드시 지켜야할 것

- 모든 입출력은 한국어로 할 것
- 오버 엔지니어링 금지

## 프로젝트 개요

Python Code Judge는 온라인 Python 알고리즘 코딩 테스트를 위한 교육 플랫폼입니다. 오프라인 채점의 비효율성을 해결하고 학생들에게 즉각적인 피드백을 제공하여 학습 효율을 극대화하는 것을 목표로 합니다. 프론트엔드는 React, 백엔드는 Node.js/Express, 데이터베이스는 PostgreSQL(Supabase 사용 예정)을 사용한 현대적인 기술 스택으로 구성되어 있습니다.

## 아키텍처 및 기술 스택

### 백엔드

- **프레임워크**: Node.js와 Express.js
- **데이터베이스**: PostgreSQL (현재 로컬, Supabase로 전환 예정)
- **인증**: JWT 기반 (2시간 유효 기간)
- **보안**: 코드 유효성을 위한 AST 정적 분석, 코드 실행을 위한 subprocess 격리
- **언어**: JavaScript/ES6 모듈
- **테스팅**: 단위 테스트를 위한 Jest
- **로깅**: Winston 로거

### 프론트엔드

- **프레임워크**: React (v18.2.0) 및 Vite 빌드 도구
- **스타일링**: Tailwind CSS
- **라우팅**: React Router DOM
- **HTTP 클라이언트**: Axios
- **알림**: React Toastify

### 데이터베이스 및 인프라

- **데이터베이스**: PostgreSQL, Supabase 이전 계획
- **배포**: Render 웹 서비스 (컨테이너 기반)
- **버전 관리**: GitHub
- **CI/CD**: GitHub Actions

## 프로젝트 구조

```
├── backend/              # Node.js Express API 서버
│   ├── src/
│   │   ├── app.js       # 메인 애플리케이션 진입점
│   │   ├── server.js    # 서버 시작
│   │   ├── config/      # 설정 파일
│   │   ├── modules/     # 기능 모듈 (인증, 사용자, 문제 등)
│   │   ├── shared/      # 공유 유틸리티 및 미들웨어
│   ├── judging-temp/    # 코드 실행을 위한 임시 디렉토리
│   ├── logs/           # 로그 파일
│   ├── package.json    # 백엔드 의존성
├── frontend/           # React 프론트엔드 애플리케이션
│   ├── src/
│   ├── package.json    # 프론트엔드 의존성
├── database/           # 데이터베이스 마이그레이션 및 스키마 파일
├── docs/              # 문서 파일 (요구사항, ERD, 와이어프레임 등)
├── swagger/           # API 명세 파일
├── mockup/            # UI/UX 모ック업 파일
├── .env.example       # 예시 환경 변수
├── SETUP-GUIDE.md     # 설치 안내
```

## 주요 기능

### 학생 기능

- 군번, 로그인 ID, 이름, 비밀번호를 사용한 계정 등록
- JWT 인증을 사용한 로그인/로그아웃
- 비밀번호 찾기/관리
- 카테고리별 문제 탐색 (11개 카테고리)
- 예제와 함께 문제 상세 보기
- Python 코드 제출 (.py 파일 또는 텍스트)
- 제출 이력 추적
- 상세 채점 결과 보기 (AC/WA/TLE/RE/SE/MLE)

### 관리자 기능

- 난이도(1-5)를 포함한 문제 CRUD 작업
- 테스트 케이스 관리 (공개 및 비공개 케이스)
- 세션 관리 (학생/문제 할당, 시작/종료)
- 실시간 스코어보드
- 세션 초기화/재설정 기능
- 감사 로그 관리 (90일 보관)

### 채점 엔진

- 악성 코드 탐지를 위한 AST 정적 분석
- 코드 실행을 위한 subprocess 격리
- 시간 제한 적용 (1-10초)
- 메모리 제한 모니터링 (기본 256MB)
- Python 버전 3.8-3.12 지원
- 다양한 채점 상태 (AC, WA, TLE, RE, SE, MLE)

## 개발 설정

### 사전 요구 사항

- Node.js v18 이상 (이 프로젝트에서는 v24.11.1 사용)
- npm v11 이상
- Python 3.8-3.12 (현재 3.14.0 사용 중)
- Git

### 초기 설정

1. Supabase 프로젝트 생성 및 데이터베이스 URL 및 API 키 확보
2. `.env.example` 파일을 `.env`로 복사하고 필요한 값을 입력:
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   JWT_SECRET=64_character_hex_string
   ```
3. 백엔드 의존성 설치: `cd backend && npm install`
4. 프론트엔드 의존성 설치: `cd frontend && npm install`

### 애플리케이션 실행

- **백엔드 개발 서버**: `cd backend && npm run dev`
- **프론트엔드 개발 서버**: `cd frontend && npm run dev`
- **백엔드 프로덕션**: `cd backend && npm start`
- **백엔드 테스트**: `cd backend && npm test`
- **프론트엔드 빌드**: `cd frontend && npm run build`

## 개발 컨벤션

### 백엔드

- ES6 모듈 (import/export 문법) 사용
- REST API 규칙 준수
- 보호된 라우트를 위한 JWT 인증 구현
- 비동기 작업을 위한 async/await 사용
- 사용자 정의 오류 미들웨어를 사용한 오류 처리 패턴 준수
- 다른 로그 수준으로 Winston을 사용한 로깅
- 보안 미들웨어 구현 (Helmet, CORS, 속도 제한)

### 프론트엔드

- React 훅을 사용한 함수형 컴포넌트
- 컴포넌트 기반 아키텍처 준수
- Tailwind CSS를 사용한 스타일링
- 적절한 오류 경계 구현
- 상태 관리를 위한 React 최고 관행 준수
- React Router를 사용한 네비게이션

### 보안 관행

- 코드 실행 전 AST 정적 분석
- 시간 및 메모리 제한이 있는 subprocess 격리
- httpOnly 쿠키에 저장된 JWT 토큰
- RBAC (역할 기반 접근 제어)
- express-validator를 사용한 입력 검증
- 매개변수화된 쿼리를 통한 SQL 인젝션 방지

## 데이터베이스 스키마 (고수준)

- **students**: 학생 사용자 계정
- **administrators**: 역할이 있는 관리자 계정
- **problems**: 카테고리와 난이도가 있는 코딩 문제
- **test_cases**: 검증을 위한 입력/출력 쌍
- **submissions**: 학생의 코드 제출
- **judging_results**: 코드 실행의 상세 결과
- **education_sessions**: 수업/테스트를 위한 구성 세션
- **session_students**: 세션과 학생 간의 매핑
- **session_problems**: 세션과 문제 간의 매핑
- **scoreboards**: 세션 중 실시간 점수
- **audit_logs**: 보안 및 활동 로그

## 테스트

- 백엔드에서 Jest를 사용한 단위 테스트
- API 엔드포인트 테스트
- 데이터베이스 연결 테스트
- 보안 유효성 검사 테스트
- 핵심 흐름을 위한 통합 테스트

## 배포

- Render의 컨테이너 기반 배포
- 환경별 구성
- 헬스 체크 엔드포인트 (`/api/health`)
- 수요에 따른 자동 스케일링
- 일일 백업 (Supabase에서 제공 예정)

## 주요 문서 파일

- `docs/2-product-requirements-document.md`: 기능 및 요구사항이 포함된 상세 요구사항 명세서
- `docs/6-erd.md`: 엔티티 관계 다이어그램
- `docs/5-arch-diagram.md`: 아키텍처 다이어그램
- `SETUP-GUIDE.md`: 포괄적인 설치 안내
- `docs/8-wireframes.md`: UI/UX 와이어프레임