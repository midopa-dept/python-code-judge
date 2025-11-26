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

    subgraph "Vercel 서버리스"
        Frontend[React Frontend<br/>Tailwind CSS]
        Backend[Express API<br/>Node.js]
        Judge[채점 엔진<br/>(subprocess, Python 3.8-3.12)]
    end

    subgraph "Supabase"
        DB[(PostgreSQL<br/>Database)]
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
        UI[React UI<br/>- 문제 목록<br/>- 코드 제출<br/>- 스코어보드]
    end

    subgraph "Application Layer"
        API[Express API<br/>- 인증/인가<br/>- 비즈니스 로직<br/>- 채점 관리]
    end

    subgraph "Data Layer"
        Data[(PostgreSQL<br/>- 학생 정보<br/>- 문제/테스트<br/>- 제출 이력)]
    end

    UI <-->|JSON/JWT| API
    API <-->|SQL| Data
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
    students ||--o{ submissions : "제출"
    administrators ||--o{ problems : "출제"
    problems ||--o{ test_cases : "포함"
    problems ||--o{ submissions : "대상"
    submissions ||--|| judging_results : "결과"

    education_sessions ||--o{ session_students : "참여"
    education_sessions ||--o{ session_problems : "할당"
    education_sessions ||--o{ scoreboards : "순위"

    students {
        int id PK
        string military_id UK
        string login_id UK
        string name
        string password_hash
    }

    problems {
        int id PK
        string title
        string category
        int difficulty
        int time_limit
    }

    submissions {
        int id PK
        int student_id FK
        int problem_id FK
        text code
        timestamp submitted_at
    }

    judging_results {
        int id PK
        int submission_id FK
        string status
        int passed_cases
        float execution_time
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
        L6[데이터: bcrypt 암호화<br/>Supabase RLS]
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

    subgraph "Vercel"
        Deploy[자동 배포<br/>서버리스]
        Prod[Production<br/>환경]
    end

    subgraph "Supabase"
        ProdDB[(Production DB<br/>자동 백업)]
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
| **Database** | PostgreSQL (Supabase) | 데이터 저장 및 관리 |
| **채점** | subprocess (Python 3.8-3.12) | 코드 실행 및 채점 |
| **인증** | JWT | 무상태 인증 (2시간 유효) |
| **보안** | AST + subprocess | 코드 정적 분석 + 프로세스 격리 |
| **배포** | Vercel | 서버리스 자동 스케일링 |
| **CI/CD** | GitHub Actions | 자동 테스트 및 배포 |
| **버전 관리** | GitHub | 소스 코드 관리 및 협업 |
| **보안 모듈** | AST + 금지 모듈 차단 | os, subprocess, socket, eval 등 차단 |

---

## 9. 주요 특징

### 9.1 서버리스 아키텍처
- Vercel Functions로 자동 스케일링
- 사용량 기반 과금
- 인프라 관리 불필요

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
| **Docker 사용 불가** | 컨테이너 격리 불가능 | subprocess 프로세스 격리 + AST 정적 분석 |
| **Vercel WebSocket 미지원** | 실시간 양방향 통신 불가 | 폴링 방식 (3-5초 간격) 스코어보드 업데이트 |
| **Vercel 함수 타임아웃** | Hobby 10초, Pro 60초 | 채점 시간 최적화, 필요 시 Pro 플랜 전환 |
| **Vercel 함수 메모리** | 최대 1024MB | 채점 엔진 메모리 최적화 |

### 10.2 보안 정책

| 항목 | 금지 | 허용 |
|------|------|------|
| **모듈** | os, subprocess, socket, urllib, eval, exec | math, random, itertools, collections, string, re, datetime, json 등 |
| **파일 I/O** | 시스템 파일 접근 | 임시 디렉토리만 허용 |
| **네트워크** | 모든 네트워크 통신 | 차단 |

---

**문서 종료**
