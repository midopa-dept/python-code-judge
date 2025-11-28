# 🔧 Render 배포 수정 가이드

## ❌ 발생한 문제

```
Refused to apply style from 'https://python-code-judge.onrender.com/assets/index-CjE1qsxh.css' 
because its MIME type ('application/json') is not a supported stylesheet MIME type
```

**원인**: 정적 파일(CSS, JS)이 제대로 서빙되지 않음

---

## ✅ 해결 방법

### 1. 코드 수정 완료 ✓

`backend/src/app.js` 파일이 수정되었습니다:
- 정적 파일 서빙 순서 개선
- MIME 타입 설정 강화
- 에러 핸들링 추가

### 2. 변경사항 커밋 및 푸시

```bash
git add .
git commit -m "fix: 정적 파일 서빙 개선"
git push origin main
```

### 3. Render 재배포

**자동 재배포가 안 될 경우:**

1. Render Dashboard 접속
2. 해당 서비스 선택
3. **Manual Deploy** → **Deploy latest commit** 클릭

---

## 📋 Build Command 재확인

Render Dashboard → Settings → Build & Deploy에서 확인:

**Build Command (정확히 이렇게!):**
```bash
npm install -g pnpm && cd frontend && pnpm install && pnpm run build && ls -la dist && mv dist ../backend/frontend-dist && ls -la ../backend/frontend-dist && cd ../backend && pnpm install
```

**추가된 부분 설명:**
- `ls -la dist`: 빌드된 파일 확인
- `ls -la ../backend/frontend-dist`: 이동 후 파일 확인

---

## 🔍 배포 로그 확인

배포 시 로그에서 다음을 확인하세요:

### 성공적인 빌드 로그 예시:

```
==> Installing pnpm...
==> Building frontend...
✓ built in 12.34s

==> Listing frontend build files:
total 48
drwxr-xr-x 3 render render  4096 Nov 28 14:00 .
drwxr-xr-x 8 render render  4096 Nov 28 14:00 ..
drwxr-xr-x 2 render render  4096 Nov 28 14:00 assets
-rw-r--r-- 1 render render  1234 Nov 28 14:00 index.html
...

==> Moving to backend/frontend-dist...
==> Listing moved files:
total 48
drwxr-xr-x 3 render render  4096 Nov 28 14:00 .
...

==> Installing backend dependencies...
✓ Done

==> Build succeeded! 🎉
```

### ❌ 실패 시 확인사항:

1. **frontend/dist 폴더가 비어있음**
   ```
   ==> Listing frontend build files:
   total 0
   ```
   → Vite 빌드 실패, frontend 의존성 확인

2. **mv 명령 실패**
   ```
   mv: cannot move 'dist': No such file or directory
   ```
   → frontend 빌드가 안 됨

3. **backend 의존성 설치 실패**
   ```
   npm ERR! ...
   ```
   → package.json 확인

---

## 🚀 배포 후 확인

### 1. Health Check

```bash
curl https://python-code-judge.onrender.com/api/health
```

**예상 출력:**
```json
{
  "status": "ok",
  "environment": "production",
  "database": "connected"
}
```

### 2. 정적 파일 확인

브라우저 개발자 도구 (F12) → Network 탭:
- `index.html`: 200 OK, `text/html`
- `assets/index-xxx.css`: 200 OK, `text/css`
- `assets/index-xxx.js`: 200 OK, `application/javascript`

### 3. 콘솔 로그 확인

**정상 로그:**
```
📦 Serving static files from: /opt/render/project/src/backend/frontend-dist
🚀 Server is running on port 10000
```

**문제 로그:**
```
❌ Error serving index.html: ENOENT: no such file or directory
```

---

## 🐛 여전히 문제가 있다면

### 옵션 A: 빌드 확인 명령 추가

Build Command를 더 상세하게:

```bash
npm install -g pnpm && 
cd frontend && 
pnpm install && 
pnpm run build && 
echo "=== Frontend build complete ===" && 
ls -la dist && 
test -f dist/index.html && echo "✓ index.html exists" || echo "✗ index.html missing" && 
mv dist ../backend/frontend-dist && 
cd ../backend && 
ls -la frontend-dist && 
test -f frontend-dist/index.html && echo "✓ frontend-dist/index.html exists" || echo "✗ Missing!" && 
pnpm install
```

### 옵션 B: 절대 경로 사용

Build Command 수정:

```bash
npm install -g pnpm && 
cd $RENDER_GIT_REPO_SLUG/frontend && 
pnpm install && 
pnpm run build && 
mkdir -p $RENDER_GIT_REPO_SLUG/backend/frontend-dist && 
mv dist/* $RENDER_GIT_REPO_SLUG/backend/frontend-dist/ && 
cd $RENDER_GIT_REPO_SLUG/backend && 
pnpm install
```

### 옵션 C: app.js에서 디버깅

임시로 `backend/src/app.js`에 추가:

```javascript
if (config.nodeEnv === 'production') {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../frontend-dist');
  
  console.log('=== Checking frontend-dist ===');
  console.log('Path:', frontendPath);
  console.log('Exists:', fs.existsSync(frontendPath));
  
  if (fs.existsSync(frontendPath)) {
    console.log('Contents:', fs.readdirSync(frontendPath));
  }
}
```

그 다음 Render Logs에서 확인

---

## 📞 추가 도움이 필요하면

1. **Render Dashboard → Logs** 전체 로그 복사
2. **브라우저 Console (F12)** 에러 메시지 복사
3. **Network 탭** 실패한 요청들 스크린샷

이 정보를 공유해주시면 정확한 진단이 가능합니다!

