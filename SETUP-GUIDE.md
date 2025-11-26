# Python Judge 프로젝트 환경 설정 가이드

## Phase 0 - 환경 설정 및 프로젝트 초기화

### ✅ 1단계: 개발 환경 확인

#### 설치된 버전 확인 완료
- ✅ Node.js: v24.11.1 (v18+ 요구사항 충족)
- ✅ npm: 11.6.2
- ✅ Python: 3.14.0 (3.8-3.12 권장, 3.14도 호환 가능)
- ✅ Git: 2.52.0

#### Git 브랜치 전략
```bash
# 현재 main 브랜치에 있습니다
# develop 브랜치 생성 (선택 사항)
git checkout -b develop
git checkout main
```

---

### 🔧 2단계: 외부 서비스 설정

#### A. Supabase 프로젝트 설정

**필수 작업:**

1. **Supabase 계정 생성 및 프로젝트 생성**
   - 접속: https://supabase.com
   - 'Start your project' 클릭
   - 프로젝트 이름: `python-judge` (또는 원하는 이름)
   - 데이터베이스 비밀번호: **반드시 안전하게 저장**
   - 리전: Northeast Asia (Seoul) 또는 가까운 리전

2. **Database URL 및 API Key 발급받기**

   Supabase 프로젝트 대시보드에서:

   **Settings > Database > Connection String**
   - Connection pooling 모드 선택
   - URI 복사 (예시):
     ```
     postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
     ```

   **Settings > API**
   - Project URL 복사 (예시): `https://xxxxx.supabase.co`
   - `anon` `public` 키 복사
   - `service_role` `secret` 키 복사 (⚠️ 절대 노출 금지)

3. **환경 변수 파일 설정**

   ```bash
   # 루트 디렉토리에서
   cp .env.example .env
   ```

   **.env 파일을 열어 다음 값들을 입력:**
   ```env
   # Supabase에서 복사한 값으로 변경
   DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

   # JWT Secret 생성
   # 아래 명령어 실행하여 생성된 값을 붙여넣기
   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   JWT_SECRET=여기에_생성된_64자_랜덤_문자열_붙여넣기

   # 나머지는 기본값 사용 가능
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

#### B. Vercel 계정 및 프로젝트 연결

**필수 작업:**

1. **Vercel 계정 생성**
   - 접속: https://vercel.com
   - GitHub 계정으로 Sign Up 권장

2. **GitHub Repository 연결**
   ```bash
   # 이미 Git 저장소가 초기화되어 있음
   # 원격 저장소 추가 (GitHub에서 Repository 생성 후)
   git remote add origin https://github.com/your-username/python-judge.git

   # 첫 커밋 및 푸시
   git add .
   git commit -m "초기 프로젝트 구조 설정"
   git push -u origin main
   ```

3. **Vercel 프로젝트 생성**
   - Vercel 대시보드에서 'New Project' 클릭
   - GitHub Repository `python-judge` 선택
   - 두 개의 프로젝트 생성:
     - `python-judge-backend` (Root Directory: `backend`)
     - `python-judge-frontend` (Root Directory: `frontend`)

4. **Vercel 환경 변수 설정**
   - Backend 프로젝트 Settings > Environment Variables
   - .env 파일의 모든 변수를 Vercel에 입력 (Production, Preview, Development 모두 체크)

---

### 📦 3단계: 의존성 설치

#### Backend 패키지 설치
```bash
cd backend
npm install
```

**설치될 주요 패키지:**
- express: API 서버 프레임워크
- @supabase/supabase-js: Supabase 클라이언트
- jsonwebtoken: JWT 인증
- bcryptjs: 비밀번호 해싱
- winston: 로깅
- helmet, cors: 보안 및 CORS

#### Frontend 패키지 설치
```bash
cd ../frontend
npm install
```

**설치될 주요 패키지:**
- react, react-dom: React 프레임워크
- vite: 빌드 도구
- react-router-dom: 라우팅
- axios: HTTP 클라이언트
- tailwindcss: CSS 프레임워크

---

### 🛠️ 4단계: 개발 도구 설정

#### ESLint + Prettier 설정
Backend와 Frontend에 각각 설정 파일이 필요합니다.

**Backend .eslintrc.json**
```bash
cd backend
# .eslintrc.json 파일 생성 (다음 단계에서 제공)
```

**Frontend .eslintrc.json**
```bash
cd frontend
# .eslintrc.json, tailwind.config.js 파일 생성 (다음 단계에서 제공)
```

---

### ✅ 체크리스트

#### Phase 0-1: 개발 환경 설정
- [x] Node.js v18+ 설치 확인
- [x] Python 3.8-3.14 설치 확인
- [x] Git 설치 확인
- [ ] Git 브랜치 전략 확립 (main, develop)

#### Phase 0-2: 외부 서비스 설정
- [ ] Supabase 프로젝트 생성 완료
- [ ] DATABASE_URL 발급 및 .env 파일에 입력
- [ ] SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY 발급 및 입력
- [ ] JWT_SECRET 생성 및 .env 파일에 입력
- [ ] GitHub Repository 생성 및 연결
- [ ] Vercel 계정 생성 및 프로젝트 연결 (선택 사항, 나중에 가능)

#### Phase 0-3: 프로젝트 구조 초기화
- [x] Backend 디렉토리 구조 생성
- [x] Frontend 디렉토리 구조 생성
- [x] .env.example 파일 작성
- [ ] Backend 패키지 설치 (`cd backend && npm install`)
- [ ] Frontend 패키지 설치 (`cd frontend && npm install`)

#### Phase 0-4: 개발 도구 설정
- [ ] Backend ESLint + Prettier 설정
- [ ] Frontend ESLint + Prettier + Tailwind 설정
- [ ] Jest 테스트 프레임워크 설정
- [ ] Husky + lint-staged 설정 (선택 사항)

---

### 🎯 다음 단계

Phase 0 완료 후:
- **Phase 1**: 데이터베이스 스키마 설계 및 마이그레이션 (docs/6-erd.md 참조)
- **Phase 2**: 백엔드 API 개발
- **Phase 3**: 채점 엔진 개발
- **Phase 4**: 프론트엔드 개발
- **Phase 5**: 통합 테스트 및 배포

---

### ❓ 자주 묻는 질문

**Q: Supabase 무료 플랜으로 충분한가요?**
A: 개발 및 테스트에는 충분합니다. 프로덕션에서는 사용량에 따라 유료 플랜 고려 필요.

**Q: Vercel은 언제 설정하나요?**
A: Phase 0에서 설정할 수도 있고, Phase 5 배포 단계에서 설정해도 됩니다.

**Q: Python 3.14를 3.12로 다운그레이드해야 하나요?**
A: 대부분 호환됩니다. 문제 발생 시 pyenv로 3.12 설치 권장.

**Q: JWT_SECRET은 어떻게 생성하나요?**
A: 터미널에서 다음 명령어 실행:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
