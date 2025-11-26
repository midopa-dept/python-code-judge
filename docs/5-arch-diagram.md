# Python Judge 기술 아키텍처 다이어그램

**버전**: 1.0
**작성일**: 2025-11-26
**기반 문서**: 2-product-requirements-document.md

---

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        Client[웹 브라우저<br/>Chrome/Firefox/Edge]
    end

    subgraph "애플리케이션 서버 (Render Web Service)"
        Frontend[React Frontend<br/>Vite + Tailwind]
        Backend[Express API<br/>Node.js]
        Judge[채점 엔진<br/>(subprocess, Python 3.8~3.12)]
    end

    subgraph "Database (Supabase 예정)"
        DB[(PostgreSQL<br/>Managed)]
    end

    Client -->|HTTPS| Frontend
    Frontend -->|REST API| Backend
    Backend -->|SQL Query| DB
    Backend -->|코드 실행| Judge
    Judge -.->|결과 반환| Backend
```

---

## 2. 3-Tier 아키텍처

```mermaid
graph LR
    subgraph "Presentation Layer"
        UI[React UI (Vite)<br/>- 문제 목록<br/>- 코드 제출<br/>- 스코어보드]
    end

    subgraph "Application Layer (컨테이너)"
        API[Express API<br/>모듈러 모놀리스]
        Modules[모듈: auth/users/problems/sessions/submissions/audit]
        Judge[채점 엔진<br/>(AST + subprocess)]
    end

    subgraph "Data Layer"
        Data[(PostgreSQL<br/>Supabase 예정, 현재 로컬)]
    end

    UI <-->|JSON/JWT| API
    API --> Modules
    API <-->|SQL| Data
    Modules --> Judge
```

---

## 3. 인증 흐름

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant A as API Server
    participant D as Database

    C->>A: 로그인 요청<br/>(ID, 비밀번호)
    A->>D: 사용자 조회
    D-->>A: 사용자 정보
    A->>A: bcrypt 검증
    A->>A: JWT 생성<br/>(유효기간 2시간)
    A-->>C: JWT 토큰

    C->>A: API 요청<br/>(JWT 포함)
    A->>A: JWT 검증<br/>RBAC 권한 확인
    A-->>C: 응답
```

---

## 4. 채점 프로세스

```mermaid
sequenceDiagram
    participant S as 학생
    participant API as Express API
    participant AST as AST 분석기
    participant Judge as 채점 엔진
    participant DB as Database

    S->>API: 코드 제출
    API->>AST: 정적 분석
    AST-->>API: 금지 패턴 검증

    alt 금지 패턴 감지
        API-->>S: SE (Syntax Error)
    else 검증 통과
        API->>DB: 제출 기록 저장
        API->>Judge: subprocess 실행

        loop 각 테스트 케이스
            Judge->>Judge: 코드 실행<br/>(타임아웃, 메모리 제한)
            Judge->>Judge: 출력 비교
        end

        Judge-->>API: 채점 결과<br/>(AC/WA/TLE/RE/MLE)
        API->>DB: 결과 저장
        API-->>S: 채점 완료 (평균 5초)
    end
```

---

## 5. 데이터 모델 (간소화)

```mermaid
erDiagram
    users ||--o{ submissions : "제출"
    users ||--o{ scoreboards : "순위"
    users ||--o{ audit_logs : "로그"

    problems ||--o{ test_cases : "포함"
    problems ||--o{ submissions : "대상"
    problems ||--o{ session_problems : "할당"

    submissions }o--|| education_sessions : "세션"
    education_sessions ||--o{ session_students : "학생"
    education_sessions ||--o{ session_problems : "문제"
    education_sessions ||--o{ scoreboards : "스코어보드"

    users {
        bigserial id PK
        varchar military_id UK
        varchar login_id UK
        varchar name
        varchar password_hash
        varchar role
        varchar account_status
        timestamp created_at
        timestamp last_login
        timestamp updated_at
    }

    problems {
        bigserial id PK
        varchar title
        text description
        varchar category
        integer difficulty
        integer time_limit
        integer memory_limit
        varchar visibility
        bigint created_by FK
        timestamp created_at
        timestamp updated_at
    }

    test_cases {
        bigserial id PK
        bigint problem_id FK
        text input_data
        text expected_output
        boolean is_public
        integer test_order
        timestamp created_at
        timestamp updated_at
    }

    submissions {
        bigserial id PK
        bigint student_id FK
        bigint problem_id FK
        bigint session_id FK
        text code
        integer code_size
        varchar status
        varchar python_version
        integer execution_time
        integer memory_usage
        integer passed_cases
        integer total_cases
        text error_message
        timestamp submitted_at
        timestamp judged_at
    }

    education_sessions {
        bigserial id PK
        varchar name
        timestamp start_time
        timestamp end_time
        varchar status
        varchar session_type
        boolean allow_resubmit
        bigint creator_id FK
        timestamp created_at
        timestamp updated_at
    }

    session_students {
        bigint session_id PK_FK
        bigint student_id PK_FK
        timestamp joined_at
    }

    session_problems {
        bigint session_id PK_FK
        bigint problem_id PK_FK
        integer problem_order
    }

    scoreboards {
        bigint session_id PK_FK
        bigint student_id PK_FK
        integer score
        integer solved_count
        integer rank
        timestamp updated_at
    }

    audit_logs {
        bigserial id PK
        bigint user_id FK
        varchar user_role
        varchar action_type
        varchar target_resource
        varchar ip_address
        varchar user_agent
        timestamp performed_at
        varchar result
        text error_message
    }
```

---

## 6. 보안 계층

```mermaid
graph TD
    subgraph "보안 메커니즘"
        L1[네트워크: HTTPS 필수]
        L2[인증: JWT + httpOnly Cookie]
        L3[권한: RBAC<br/>학생/관리자/최고관리자]
        L4[코드 검증: AST 정적 분석<br/>금지: os, subprocess, socket, eval<br/>허용: math, random, itertools 등]
        L5[실행 격리: subprocess<br/>타임아웃 + 메모리 제한]
        L6[데이터: bcrypt 암호화<br/>Supabase RLS 예정]
        L7[감사: 로그 90일 보관]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    L6 --> L7
```

---

## 7. 배포 아키텍처

```mermaid
graph TB
    subgraph "GitHub"
        Code[소스 코드<br/>Repository]
    end

    subgraph "GitHub Actions"
        CI[CI/CD<br/>자동 테스트/빌드]
    end

    subgraph "Render"
        Deploy[자동 배포<br/>컨테이너 Web Service]
        Prod[Production<br/>환경]
    end

    subgraph "Database (Supabase 예정)"
        ProdDB[(PostgreSQL<br/>Managed)]
    end

    Code -->|Push| CI
    CI -->|성공 시| Deploy
    Deploy --> Prod
    Prod <--> ProdDB
```

---

## 8. 기술 스택 요약

| 계층 | 기술 | 역할 |
|------|------|------|
| **Frontend** | React + Tailwind CSS | UI 렌더링, 사용자 인터랙션 |
| **Backend** | Node.js + Express | REST API, 비즈니스 로직 |
| **Database** | PostgreSQL (Supabase 예정) | 데이터 저장 및 관리 |
| **채점** | subprocess (Python 3.8-3.12) | AST 검사 + 코드 실행 및 채점 |
| **인증** | JWT | 무상태 인증 |
| **보안** | AST + subprocess | 코드 정적 분석 + 프로세스 격리 |
| **배포** | Render Web Service (컨테이너) | 컨테이너 배포, 자동 HTTPS |
| **CI/CD** | GitHub Actions | 자동 테스트 및 배포 |
| **버전 관리** | GitHub | 소스 코드 관리 및 협업 |
| **보안 모듈** | AST + 금지 모듈 차단 | os, subprocess, socket, eval 등 차단 |

---

## 9. 주요 특징

### 9.1 컨테이너 우선
- Express 기반 모듈러 모놀리스 (Render Web Service)
- 채점 엔진과 API가 동일 컨테이너 내 subprocess로 동작
- PostgreSQL은 Supabase로 이전 예정 (현 개발 단계는 로컬)

### 9.2 Stateless 설계
- JWT 기반 무상태 인증
- 수평 확장 용이
- 세션 저장소 불필요

### 9.3 보안 우선
- AST 정적 분석으로 악성 코드 사전 차단
- subprocess 프로세스 격리
- 타임아웃 및 메모리 제한
- RBAC 권한 관리

### 9.4 실시간 피드백
- 평균 5초 이내 채점 완료
- 폴링 방식 스코어보드 업데이트 (3-5초 간격)
- 즉각적인 학습 피드백

### 9.5 성능 목표
- 채점 응답 시간: 평균 5초, 최대 30초
- API 응답 시간: 95% 요청 1초 이내
- 동시 접속 처리: 30명
- 동시 제출 처리: 채점 큐 최대 500개

---

## 10. 주요 제약사항

### 10.1 기술적 제약사항

| 제약사항 | 영향 | 대응 방안 |
|---------|------|----------|
| **Docker 사용 불가** | 컨테이너 격리 불가능 | subprocess 격리 + AST 정적 분석 |
| **컨테이너 자원 한도** | CPU/메모리 제한 | 기본 5초 제한, 필요 시 스케일업 |
| **Supabase 미연동 (현재)** | 관리형 기능(RLS/백업) 미사용 | 로컬 Postgres로 개발, 배포 시 Supabase 전환 |

### 10.2 보안 정책

| 항목 | 금지 | 허용 |
|------|------|------|
| **모듈** | os, subprocess, socket, urllib, eval, exec | math, random, itertools, collections, string, re, datetime, json 등 |
| **파일 I/O** | 시스템 파일 접근 | 임시 디렉토리만 허용 |
| **네트워크** | 모든 네트워크 통신 | 차단 |

---

**문서 종료**
