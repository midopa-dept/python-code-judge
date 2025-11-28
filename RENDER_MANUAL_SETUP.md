# Render 수동 배포 가이드 (간단 버전)

## 🚀 Step-by-Step 배포

### 1. New Web Service 생성

1. [Render Dashboard](https://dashboard.render.com/) 접속
2. **New +** → **Web Service** 클릭
3. GitHub 저장소 연결 → `python-code-judge` 선택
4. **Connect** 클릭

---

### 2. 기본 설정

다음과 같이 입력하세요:

**Name (이름):**
```
python-judge
```

**Region (지역):**
```
Oregon (US West)
```

**Branch (브랜치):**
```
main
```

**Root Directory (루트 디렉토리):**
```
(비워둠)
```

**Runtime (런타임):**
```
Node
```

---

### 3. Build & Start Commands 설정 ⚙️

**Build Command (빌드 명령):**
```bash
npm install -g pnpm && cd frontend && pnpm install && pnpm run build && mv dist ../backend/frontend-dist && cd ../backend && pnpm install
```

**Start Command (시작 명령):**
```bash
cd backend && node src/server.js
```

---

### 4. 환경 변수 설정 🔐

**Advanced** → **Add Environment Variable** 클릭하여 아래 변수들을 추가:

#### 필수 환경 변수:

| Key | Value | 설명 |
|-----|-------|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Service Role Key |
| `JWT_SECRET` | (64자 랜덤 문자열) | JWT 암호화 키 |

#### JWT_SECRET 생성 방법:

터미널에서 실행:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

출력된 64자 문자열을 복사하여 `JWT_SECRET`에 붙여넣기

---

### 5. Supabase 정보 가져오기 📋

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **API** 이동
4. 다음 정보 복사:
   - **Project URL**: `SUPABASE_URL`에 입력
   - **service_role key (secret)**: `SUPABASE_SERVICE_ROLE_KEY`에 입력

⚠️ **주의**: `anon` key가 아니라 **`service_role` key**를 사용하세요!

---

### 6. 배포 시작 🎯

1. 모든 설정 확인
2. **Create Web Service** 클릭
3. 빌드 시작 (약 5-10분 소요)
4. 로그 확인:
   ```
   ==> Installing dependencies...
   ==> Building frontend...
   ==> Building backend...
   ==> Starting server...
   🚀 Server is running on port 10000
   ```

---

### 7. 배포 완료 확인 ✅

배포가 완료되면 Render가 제공하는 URL로 접속:

**URL 형식:**
```
https://python-judge.onrender.com
```

**Health Check 테스트:**
```
https://python-judge.onrender.com/api/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T...",
  "environment": "production",
  "database": "connected",
  "uptime": 12.345
}
```

---

## 🐛 문제 해결

### 빌드 실패 시

**로그에서 확인:**
```
==> Checking logs...
```

**흔한 문제:**

1. **pnpm 설치 실패**
   - Build Command에 `npm install -g pnpm &&` 포함 확인

2. **frontend 빌드 실패**
   - `cd frontend && pnpm install && pnpm run build` 확인

3. **backend 빌드 실패**
   - `cd ../backend && pnpm install` 확인

---

### 런타임 오류 시

**증상:** 서비스가 시작되지 않음

**확인 사항:**
1. 모든 환경 변수 설정 확인
2. `SUPABASE_SERVICE_ROLE_KEY` 확인 (anon key가 아님!)
3. `JWT_SECRET` 최소 32자 이상 확인

**로그 확인:**
```
Dashboard → Logs → Application Logs
```

---

### 데이터베이스 연결 실패

**증상:** `database: "disconnected"` 응답

**확인:**
1. Supabase URL이 정확한지 확인
2. Service Role Key가 올바른지 확인
3. Supabase 프로젝트가 활성 상태인지 확인

---

## 📌 중요 참고사항

### 무료 플랜 제한

- **슬립 모드**: 15분 동안 요청이 없으면 자동으로 슬립
- **첫 요청**: 슬립에서 깨어나는데 30초~1분 소요
- **해결**: 유료 플랜($7/월) 업그레이드 또는 주기적 ping

### 업그레이드가 필요한 경우

- 24/7 항상 활성 상태 필요
- 더 빠른 응답 속도 필요
- 더 많은 메모리/CPU 필요

**Starter 플랜**: $7/월
- 슬립 없음
- 512MB RAM
- 0.5 CPU

---

## 🎉 완료!

배포가 성공적으로 완료되었습니다!

**다음 단계:**
1. 로그인 페이지 접속
2. 관리자 계정으로 로그인 (teacher)
3. 학생 계정 생성 및 테스트
4. 문제 생성 및 제출 테스트

**문제 발생 시:**
- Render Logs 확인
- GitHub Issues 등록
- Supabase 대시보드 확인

