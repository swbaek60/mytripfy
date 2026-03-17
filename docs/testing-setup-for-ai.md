# AI(에이전트)가 테스트까지 실행하도록 설정하는 방법

이 문서는 **Cursor/에이전트가 코드 수정 후 터미널에서 테스트를 직접 실행해 검증**할 수 있도록 프로젝트를 어떻게 맞추면 되는지 정리한 것입니다.

---

## 1. 왜 이렇게 하면 좋은지

- **당신**: 수동으로 브라우저·모바일에서 매번 확인할 필요가 줄어듦.
- **에이전트**: `npm test` / `npm run test:e2e` 등을 실행해 통과 여부를 확인하고, 실패 시 원인을 보고 수정할 수 있음.

---

## 2. 테스트 종류와 역할

| 종류 | 무엇을 검증하는지 | 에이전트가 실행 가능? |
|------|-------------------|------------------------|
| **단위(Unit)** | 함수·유틸·API 라우트 로직 | ✅ `npm test` |
| **컴포넌트** | React 컴포넌트 렌더·클릭 등 | ✅ `npm test` |
| **E2E(Playwright 등)** | 실제 브라우저에서 로그인·네비게이션 | ✅ `npm run test:e2e` (Playwright 설치 시) |

**모바일에서만 재현되는 문제**는 E2E에서 **모바일 뷰포트**로 시나리오를 짜 두면, 에이전트가 그 테스트를 실행해 “같은 조건”에서 깨지는지 확인할 수 있습니다.

---

## 3. 설정 방법 (요약)

### 3.1 단위/컴포넌트 테스트 (Jest + React Testing Library)

1. **의존성 설치**
   ```bash
   npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
   ```
2. **Jest 설정**  
   - `jest.config.ts` 또는 `jest.config.mjs` 추가 (Next.js 16 + App Router 기준으로 설정).
3. **`package.json`에 스크립트 추가**
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch"
   }
   ```
4. **테스트 파일 위치**  
   - 예: `src/**/*.test.ts(x)` 또는 `__tests__/**/*.test.ts(x)`  
   - 한 곳으로 통일해 두면 에이전트가 “테스트 실행” 시 항상 같은 패턴으로 돌릴 수 있음.

이후 에이전트에게 **“이 기능 수정하고 `npm test`까지 실행해서 통과하는지 확인해줘”**라고 하면, 수정 후 터미널에서 `npm test`를 실행해 결과를 보고할 수 있습니다.

### 3.2 E2E 테스트 (Playwright) – 선택

1. **설치**
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```
2. **`package.json`에 스크립트 추가**
   ```json
   "scripts": {
     "test:e2e": "playwright test",
     "test:e2e:ui": "playwright test --ui"
   }
   ```
3. **모바일 시나리오**  
   - `playwright.config.ts`에서 뷰포트를 모바일로 두거나,  
   - `test.use({ viewport: { width: 390, height: 844 } })` 같은 설정으로 “모바일에서 페이스북 로그인 클릭” 같은 플로우를 작성.

에이전트에게 **“모바일 Facebook 로그인 플로우 E2E 테스트 추가하고, `npm run test:e2e`로 확인해줘”**처럼 요청하면, 테스트 코드 작성 + 실행까지 진행할 수 있습니다.

---

## 4. 에이전트에게 요청할 때 쓰기 좋은 문장

- **“이번에 수정한 부분 단위/컴포넌트 테스트 추가하고, `npm test` 실행해서 통과하는지 확인해줘.”**
- **“Facebook 로그인 버튼이 같은 탭으로 이동하는지 E2E 테스트 추가하고, `npm run test:e2e` 돌려서 확인해줘.”**
- **“이 PR에서 `npm test`와 `npm run test:e2e` 둘 다 실행해서 결과 알려줘.”**

에이전트는 터미널에서 위 스크립트를 실행할 수 있으므로, **테스트가 이미 작성·설정되어 있다면** 수정 후 자동으로 테스트까지 진행할 수 있습니다.

---

## 5. 이 프로젝트에서 이미 해 두면 좋은 것

- [ ] `package.json`에 `"test": "jest"` (또는 `vitest` 등) 스크립트가 있는지  
- [ ] `jest.config.*` 또는 `vitest.config.*`가 있고, `src`/`__tests__`를 포함하는지  
- [ ] 중요한 API 라우트·유틸에 대해 `*.test.ts` 한두 개라도 있어서 `npm test`가 “한 번이라도 돌아가는지” 확인 가능한지  
- [ ] (선택) Playwright 설치 후 `test:e2e` 스크립트와 로그인/메인 플로우용 스펙 1개

이렇게만 되어 있으면, **앞으로 “테스트까지 너가 해줘”라고 하면, 제가 테스트 실행까지 진행할 수 있습니다.**

---

## 6. 정리

- **설정**: `npm test` / `npm run test:e2e`가 동작하도록 스크립트와 설정 파일을 두고, 테스트 파일을 한 곳에 둠.  
- **요청**: “수정하고 **테스트 추가 + `npm test`(또는 `test:e2e`) 실행해서 통과시켜줘**”라고 하면, 에이전트가 테스트까지 수행 가능.  
- **테스트를 안 하고 싶을 때**: “테스트는 건드리지 말고 코드만 수정해줘”라고 하면 됨.

---

## 7. 이 프로젝트에서 이미 해 둔 것

- **`npm test`**: Jest로 `__tests__/**/*.test.ts` 실행 (예: `/api/auth/facebook-url` env 없을 때 500 반환 검증).
- **`jest.config.js`**: `testEnvironment: 'node'`, `@/` → `src/` 매핑, `ts-jest`로 TypeScript 변환.
- **`jest.setup.js`**: 테스트 시 사용할 env 기본값 (필요 시 여기서 설정).

일부 API 라우트는 Next/process.env 동작 때문에 Jest에서 "env 있을 때 200" 시나리오를 재현하기 어려울 수 있음. 그런 경우엔 "env 없을 때 500"만 단위 테스트하고, 실제 플로우는 E2E 또는 수동으로 검증하면 됨.
