# 🚀 Python Code Judge - 배포 가이드

## 📋 배포 전 체크리스트

### 1. 코드 정리 및 커밋 ✅

```bash
# 현재 수정사항 확인
git status

# 수정된 파일 추가
git add .

# 커밋
git commit -m "feat: Supabase 연동 및 배포 준비 완료"

# GitHub에 푸시
git push origin main
```

### 2. Supabase 설정 확인 ✅

다음 정보를 Supabase 대시보드에서 확인하세요:

- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: Settings → API → Project API keys → `anon` `public`
- **Service Role Key**: Settings → API → Project API keys → `service_role` (⚠️ 절대 공개하지 마세요!)

### 3. JWT Secret 생성 🔑

안전한 JWT Secret을 생성하세요:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

출력된 64자리 문자열을 복사해두세요.

---

## 🌐 Render 배포 단계

### Step 1: Render 계정 및 서비스 생성

1. [Render.com](https://render.com)에 로그인
2. Dashboard → **New +** → **Web Service** 클릭
3. GitHub 저장소 연결
   - 저장소 선택: `python-code-judge`
   - 브랜치 선택: `main`

### Step 2: 기본 설정

- **Name**: `python-judge` (원하는 이름)
- **Region**: Oregon (또는 원하는 지역)
- **Branch**: `main`
- **Root Directory**: (비워둠)
- **Runtime**: Node
- **Build Command**: (자동 감지됨 - render.yaml 사용)
- **Start Command**: (자동 감지됨 - render.yaml 사용)

### Step 3: 환경 변수 설정 🔧

**Environment** 탭에서 다음 환경 변수를 추가하세요:

#### 필수 환경 변수:

```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-64-char-jwt-secret-here
```

#### 선택 환경 변수 (기본값 사용 가능):

```env
JUDGING_TIMEOUT=10000
MAX_CODE_BYTES=65536
PYTHON_VERSIONS=3.8,3.9,3.10,3.11,3.12
```

### Step 4: 배포 시작 🎯

1. **Create Web Service** 버튼 클릭
2. 빌드 로그 확인 (5-10분 소요)
3. 배포 완료 후 URL 확인: `https://python-judge.onrender.com`

---

## ✅ 배포 확인

### 1. Health Check 확인

브라우저나 curl로 다음 URL 접속:

```bash
curl https://your-app.onrender.com/api/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T...",
  "environment": "production",
  "database": "connected",
  "uptime": 123.456
}
```

### 2. 기능 테스트

1. **로그인 페이지 접속**: `https://your-app.onrender.com`
2. **관리자 로그인**: 
   - ID: `teacher`
   - PW: (초기 비밀번호 확인)
3. **학생 계정 생성** 및 테스트
4. **문제 생성** 및 제출 테스트
5. **세션 생성** 및 학생 할당 테스트

---

## 🔧 배포 후 설정

### 1. 커스텀 도메인 설정 (선택)

Render Dashboard → Settings → Custom Domain에서 도메인 연결

### 2. HTTPS 자동 활성화

Render는 자동으로 Let's Encrypt SSL 인증서를 제공합니다.

### 3. 로그 모니터링

Dashboard → Logs 탭에서 실시간 로그 확인 가능

---

## ⚠️ 주의사항

### 보안

1. **Service Role Key는 절대 공개하지 마세요!**
2. JWT_SECRET은 최소 32자 이상의 랜덤 문자열 사용
3. 프로덕션 환경에서는 CORS 설정 확인

### 성능

1. Render 무료 플랜은 15분 비활성 시 슬립 모드 진입
   - 첫 요청 시 30초 정도 소요될 수 있음
2. 유료 플랜 업그레이드 고려 (항상 활성 상태 유지)

### 데이터베이스

1. Supabase 무료 플랜 제한 확인
   - 500MB 저장소
   - 2GB 전송량/월
2. 정기적인 백업 권장

---

## 🐛 트러블슈팅

### 빌드 실패 시

1. **빌드 로그 확인**: Render Dashboard → Logs
2. **의존성 문제**: `pnpm-lock.yaml` 파일 확인
3. **Node 버전**: package.json에 engines 필드 추가 고려

### 런타임 오류 시

1. **환경 변수 확인**: 모든 필수 변수가 설정되었는지 확인
2. **데이터베이스 연결**: Supabase URL 및 키 확인
3. **로그 확인**: Application Logs에서 에러 메시지 확인

### 데이터베이스 연결 실패

1. Supabase URL 형식 확인: `https://xxx.supabase.co`
2. Service Role Key 확인 (Anon Key가 아님!)
3. Supabase 프로젝트 상태 확인

---

## 📞 지원

문제가 발생하면:
1. GitHub Issues 등록
2. 로그 파일 첨부
3. 환경 변수 설정 스크린샷 (민감 정보 제외)

---

## 🎉 배포 완료!

축하합니다! Python Code Judge가 성공적으로 배포되었습니다. 🚀

**접속 URL**: `https://your-app.onrender.com`

이제 학생들과 함께 Python 코딩을 시작하세요!

