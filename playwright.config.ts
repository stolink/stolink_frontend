import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: "./e2e",

  // 테스트 파일 패턴
  testMatch: "**/*.spec.ts",

  // 병렬 실행 설정
  fullyParallel: true,

  // CI에서 재시도 없음
  retries: process.env.CI ? 2 : 0,

  // 병렬 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: "http://localhost:5173",

    // 스크린샷 (실패 시에만)
    screenshot: "only-on-failure",

    // 트레이스 (재시도 시에만)
    trace: "on-first-retry",

    // 비디오 녹화 (실패 시에만)
    video: "on-first-retry",
  },

  // 브라우저 프로젝트 설정
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 로컬 개발 서버 (이미 실행 중이므로 주석 처리)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
