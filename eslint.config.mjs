import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor 네이티브 셸의 빌드 산출물. 우리가 쓴 코드가 아니고 생성물이므로
    // 검사해도 고칠 수 없다. "build/**" 는 최상위만 걸러서 여기까지 닿지 않는다.
    "android/**",
    "ios/**",
    "mobile-app/android/**",
    "mobile-app/ios/**",
    // 생성 결과물 및 산출물 디렉터리.
    "scripts/out/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    // scripts/ 는 Node 로 직접 실행하는 유지보수 스크립트다. package.json 에
    // "type" 이 없어 .js/.cjs 는 CommonJS 로 동작하므로 require() 가 정상이다.
    // 번들러를 거치는 src/ 에서는 이 규칙을 그대로 유지한다.
    files: ["scripts/**/*.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
