# Repository Guidelines

## 반드시 지켜야할 것

- 모든 입출력은 한국어로 할 것
- 오버 엔지니어링 금지
- 모든 문서는 UTF-8로 읽을 것

## Project Structure & Module Organization

- 현재 저장소는 `docs/`(도메인, PRD, 아키텍처) 문서 중심이며, 코드 추가 시 의사결정 근거가 되는 문서와 나란히 두세요.
- 백엔드(예정: Node.js + Express): `src/modules/`(auth, users, problems, submissions, sessions), 공용 유틸은 `src/shared/`(database, middlewares, errors, utils, constants), 라우팅은 `src/routes/`.
- 프런트엔드(예정: React + Tailwind): `src/` 아래 `components/`(common, layout, 기능별), `pages/`(student, admin), `hooks/`, `contexts/`, `utils/`, `styles/`, 정적 자산은 `public/`.

## Build, Test, and Development Commands

- 초기 세팅: 루트에서 `npm install`.
- 로컬 개발: `npm run dev:backend`(Express API), `npm run dev:frontend`(React). 통합 실행 스크립트가 생기면 전체 연동 점검에 우선 사용.
- 품질 점검: `npm test`(Jest 단위/통합), `npm run test:e2e`(Playwright/Cypress), `npm run lint`, `npm run format`.

## Coding Style & Naming Conventions

- JavaScript/TypeScript: 스페이스 2칸, 파일 끝 개행, 트레일링 공백 금지. Prettier로 포맷, ESLint(eslint:recommended + react 규칙)로 린트.
- 백엔드 네이밍: 파일 `camelCase.js`, 클래스 `PascalCase`, 변수/함수 `camelCase`, 상수 `UPPER_SNAKE_CASE`, 테스트 `*.test.js`(`tests/unit`, `tests/integration`).
- 프런트엔드 네이밍: 컴포넌트 `PascalCase.jsx`, 훅 `useThing.js`, 유틸 `camelCase.js`, 이벤트 핸들러 `handle*`/`on*`, 불리언 props `is*`/`has*`.
- 함수는 50줄 이하, 매개변수는 꼭 필요한 것만; 복잡 로직은 짧은 주석이나 JSDoc으로 설명.

## Testing Guidelines

- 기본 도구: Jest(단위/통합), Supertest(HTTP), Playwright/Cypress(E2E). 폴더는 `unit/`, `integration/`, `e2e/`로 정리하고, 기능 폴더 내 배치도 허용.
- 설계 문서의 테스트 믹스를 목표(단위 위주, 교차 모듈 흐름은 통합/E2E). 공용 픽스처/목은 `tests/fixtures`에 두어 중복 최소화.
- 푸시 전 `npm test`, 라우팅·인증·세션 변경 시 `npm run test:e2e`까지 실행.

## Commit & Pull Request Guidelines

- 커밋은 가급적 Conventional Commits(`feat:`, `fix:`, `chore:`, `docs:`). 제목은 ~72자 이내, 범위를 명확히.
- PR: 요약, 관련 이슈/ADR 링크, 수행 테스트 체크리스트, UI 변경 시 스크린샷. 환경변수/마이그레이션/호환성 깨짐 여부를 본문에 명시.

## Security & Configuration Tips

- 비밀값은 git에 올리지 말고 `.env.development`, `.env.test`, `.env.production`으로 분리. 핵심 변수: `DATABASE_URL`, `JWT_SECRET`, `JUDGING_TIMEOUT`, `MAX_CODE_SIZE`, `PYTHON_VERSIONS`, `SUPABASE_URL`, `SUPABASE_KEY`.
- 아키텍처 문서의 방어 전략을 따를 것: 입력은 경계에서 검증, subprocess 권한 상승 금지, 인증/세션 이벤트는 감사 로그로 남기기.
