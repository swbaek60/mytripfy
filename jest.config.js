/** Jest 설정 – 에이전트가 `npm test`로 테스트 실행 가능하도록 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.[jt]s', '**/*.test.[jt]s'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!**/node_modules/**'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
