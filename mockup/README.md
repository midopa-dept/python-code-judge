# Python Judge Mock API Server

Swagger 스펙 기반 Mock API 서버입니다. 프론트엔드 개발 시 백엔드 완성 전에 API 테스트 및 개발에 활용할 수 있습니다.

## 시작하기

### 서버 실행

개발 모드 (자동 재시작):
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

## 접속 주소

서버 시작 후 다음 URL에 접속하세요:

- **루트**: http://localhost:3000/
- **Mock API**: http://localhost:3000/api
- **Swagger UI**: http://localhost:3000/docs

## 사용 예시

### 1. Swagger UI에서 API 테스트

http://localhost:3000/docs 에 접속하여 모든 API 엔드포인트를 브라우저에서 직접 테스트할 수 있습니다.

### 2. 프론트엔드에서 API 호출

```javascript
// 학생 회원가입 예시
fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    militaryId: '12345678',
    loginId: 'kim_soldier',
    name: '김병장',
    password: 'securePassword123!'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 3. Postman으로 테스트

1. Postman에서 `../swagger/swagger.json` Import
2. Base URL을 `http://localhost:3000/api`로 변경
3. 요청 전송

## Mock 데이터

Mock 서버는 Swagger 스펙의 `example` 필드를 기반으로 자동으로 응답을 생성합니다.

## 주의사항

- 이 서버는 개발 및 테스트 목적으로만 사용하세요.
- 실제 데이터베이스에 연결되지 않으며, 데이터는 저장되지 않습니다.
- 모든 요청은 Swagger 스펙에 정의된 예시 데이터로 응답합니다.

## 문제 해결

### 포트 충돌 시

`server.js` 파일에서 `PORT` 변수를 변경하세요:
```javascript
const PORT = 3001; // 다른 포트로 변경
```

### Swagger 스펙 변경 시

Swagger 스펙(`../swagger/swagger.json`)을 수정한 후 서버를 재시작하세요:
```bash
# nodemon 사용 시 자동 재시작됨
npm run dev
```
