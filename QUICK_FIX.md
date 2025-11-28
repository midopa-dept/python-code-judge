# 데이터베이스 연결 문제 해결 가이드

## 🔴 현재 문제
PostgreSQL 데이터베이스가 설치되어 있지 않아 로그인/회원가입이 모두 실패합니다.

```
error: 사용자 "postgres"의 password 인증에 실패했습니다
Code: 28P01
```

---

## ✅ 해결 방법 1: PostgreSQL 로컬 설치 (권장)

### 1단계: PostgreSQL 다운로드 및 설치

1. **PostgreSQL 다운로드**
   - https://www.postgresql.org/download/windows/
   - 또는 https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Windows x86-64 최신 버전 다운로드 (예: PostgreSQL 16)

2. **설치 과정**
   - 설치 프로그램 실행
   - 기본 설정 그대로 진행
   - **중요**: 비밀번호 입력 시 `password`로 설정 (또는 원하는 비밀번호 입력 후 .env 파일 수정)
   - 포트: 5432 (기본값)
   - 로케일: Default locale
   - Stack Builder는 설치 안 해도 됨

### 2단계: 데이터베이스 생성

설치 완료 후 PowerShell에서 실행:

```powershell
# PostgreSQL에 연결
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE python_judge_test;

# 데이터베이스 확인
\l

# 종료
\q
```

### 3단계: 데이터베이스 스키마 생성

프로젝트의 SQL 파일이 있다면 실행:

```bash
cd C:\test\python-code-judge
psql -U postgres -d python_judge_test -f database/schema.sql
```

### 4단계: .env 파일 확인

비밀번호를 `password`가 아닌 다른 것으로 설정했다면:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/python_judge_test
```

---

## ✅ 해결 방법 2: Supabase 클라우드 사용

Supabase 계정이 있다면:

### 1단계: Supabase 프로젝트 생성
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Database Password 설정 및 기록

### 2단계: 연결 정보 복사
- Settings → Database → Connection String
- Connection pooling 모드의 URI 복사

### 3단계: .env 파일 업데이트
```env
DATABASE_URL=postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[프로젝트ID].supabase.co
SUPABASE_ANON_KEY=[발급받은 anon key]
SUPABASE_SERVICE_ROLE_KEY=[발급받은 service role key]
```

---

## ✅ 해결 방법 3: 테스트용 임시 데이터베이스 (가장 빠름)

PostgreSQL with Docker (Docker Desktop 필요):

```bash
# Docker로 PostgreSQL 실행
docker run --name postgres-python-judge -e POSTGRES_PASSWORD=password -e POSTGRES_DB=python_judge_test -p 5432:5432 -d postgres:16

# 연결 테스트
docker exec -it postgres-python-judge psql -U postgres -d python_judge_test
```

---

## 🔧 설치 후 확인

백엔드 서버를 재시작하고 로그 확인:

```bash
cd backend
npm run dev
```

정상 작동 시:
```
🚀 Server is running on port 3000
📦 Environment: development
PostgreSQL connection pool created
```

에러가 없어야 합니다!

---

## 📝 다음 단계: 스키마 생성

데이터베이스 연결 성공 후 테이블을 생성해야 합니다.
`database/` 디렉토리의 SQL 파일을 확인하세요.

---

어떤 방법을 선택하시겠습니까?
