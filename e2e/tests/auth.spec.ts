import { test, expect } from "@playwright/test";
import {
  TEST_USER,
  getNewUserCredentials,
  ROUTES,
  TIMEOUTS,
} from "../fixtures/test-config";

/**
 * 인증 E2E 테스트
 * TC-AUTH-001 ~ TC-AUTH-005
 */
test.describe("인증 (AUTH)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * TC-AUTH-001: 회원가입 성공
   * 입력: 신규 이메일, 비밀번호, 닉네임
   * 기대: 회원가입 완료 후 로그인 페이지로 리디렉션
   */
  test("TC-AUTH-001: 회원가입 성공 → 로그인 페이지 리디렉션", async ({
    page,
  }) => {
    const newUser = getNewUserCredentials();

    // 회원가입 페이지로 이동
    await page.goto(ROUTES.REGISTER);
    await page.waitForLoadState("networkidle");

    // 회원가입 탭이 활성화되어 있는지 확인
    const registerTab = page
      .locator('[data-state="active"]')
      .filter({ hasText: /회원가입|가입|Register/i });
    if ((await registerTab.count()) === 0) {
      // 탭 클릭으로 전환
      await page.getByRole("tab", { name: /회원가입|가입|Register/i }).click();
    }

    // 폼 입력
    await page.getByLabel(/이메일|email/i).fill(newUser.email);
    await page
      .getByLabel(/비밀번호|password/i)
      .first()
      .fill(newUser.password);

    // 비밀번호 확인 필드가 있다면 입력
    const confirmPassword = page.getByLabel(/비밀번호 확인|confirm/i);
    if ((await confirmPassword.count()) > 0) {
      await confirmPassword.fill(newUser.password);
    }

    // 닉네임 필드가 있다면 입력
    const nicknameField = page.getByLabel(/닉네임|nickname|이름/i);
    if ((await nicknameField.count()) > 0) {
      await nicknameField.fill(newUser.nickname);
    }

    // 가입 버튼 클릭
    await page
      .getByRole("button", { name: /가입|회원가입|Register|Sign up/i })
      .click();

    // 알림 메시지 또는 로그인 페이지 리디렉션 확인
    await Promise.race([
      page.waitForURL(/auth.*login|auth\?tab=login/i, {
        timeout: TIMEOUTS.API_RESPONSE,
      }),
      expect(page.getByText(/가입.*완료|회원가입.*성공/i)).toBeVisible({
        timeout: TIMEOUTS.API_RESPONSE,
      }),
    ]);
  });

  /**
   * TC-AUTH-002: 중복 이메일 가입 실패
   * 입력: 이미 등록된 이메일
   * 기대: 에러 메시지 표시
   */
  test("TC-AUTH-002: 중복 이메일 가입 실패 → 에러 메시지", async ({ page }) => {
    await page.goto(ROUTES.REGISTER);
    await page.waitForLoadState("networkidle");

    // 회원가입 탭 전환
    const registerTab = page.getByRole("tab", {
      name: /회원가입|가입|Register/i,
    });
    if ((await registerTab.count()) > 0) {
      await registerTab.click();
    }

    // 기존 사용자 이메일로 가입 시도
    await page.getByLabel(/이메일|email/i).fill(TEST_USER.email);
    await page
      .getByLabel(/비밀번호|password/i)
      .first()
      .fill("Password123!");

    const confirmPassword = page.getByLabel(/비밀번호 확인|confirm/i);
    if ((await confirmPassword.count()) > 0) {
      await confirmPassword.fill("Password123!");
    }

    const nicknameField = page.getByLabel(/닉네임|nickname|이름/i);
    if ((await nicknameField.count()) > 0) {
      await nicknameField.fill("중복테스트");
    }

    await page
      .getByRole("button", { name: /가입|회원가입|Register|Sign up/i })
      .click();

    // 에러 메시지 확인
    await expect(
      page.getByText(/이미.*등록|중복|already.*exists|duplicate/i),
    ).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
  });

  /**
   * TC-AUTH-003: 로그인 성공
   * 입력: 등록된 이메일, 올바른 비밀번호
   * 기대: 서재 페이지로 이동
   */
  test("TC-AUTH-003: 로그인 성공 → 서재 페이지 이동", async ({ page }) => {
    await page.goto(ROUTES.LOGIN);
    await page.waitForLoadState("networkidle");

    // 로그인 탭 확인/전환
    const loginTab = page.getByRole("tab", { name: /로그인|Login/i });
    if ((await loginTab.count()) > 0) {
      await loginTab.click();
    }

    // 로그인 폼 입력
    await page.getByLabel(/이메일|email/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호|password/i).fill(TEST_USER.password);

    // 로그인 버튼 클릭
    await page.getByRole("button", { name: /로그인|Login|Sign in/i }).click();

    // 서재 페이지로 이동 확인
    await page.waitForURL(/library|서재/i, { timeout: TIMEOUTS.API_RESPONSE });
    await expect(page).toHaveURL(/library/i);
  });

  /**
   * TC-AUTH-004: 로그인 실패 (잘못된 비밀번호)
   * 입력: 등록된 이메일, 틀린 비밀번호
   * 기대: 에러 메시지 표시
   */
  test("TC-AUTH-004: 잘못된 비밀번호 → 에러 메시지", async ({ page }) => {
    await page.goto(ROUTES.LOGIN);
    await page.waitForLoadState("networkidle");

    const loginTab = page.getByRole("tab", { name: /로그인|Login/i });
    if ((await loginTab.count()) > 0) {
      await loginTab.click();
    }

    await page.getByLabel(/이메일|email/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호|password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /로그인|Login|Sign in/i }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText(/비밀번호.*올바르지|틀린|잘못|incorrect|invalid|wrong/i),
    ).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
  });

  /**
   * TC-AUTH-005: 로그아웃
   * 입력: 로그아웃 버튼 클릭
   * 기대: 로그인 페이지로 이동
   */
  test("TC-AUTH-005: 로그아웃 → 로그인 페이지 이동", async ({ page }) => {
    // 먼저 로그인
    await page.goto(ROUTES.LOGIN);
    await page.waitForLoadState("networkidle");

    const loginTab = page.getByRole("tab", { name: /로그인|Login/i });
    if ((await loginTab.count()) > 0) {
      await loginTab.click();
    }

    await page.getByLabel(/이메일|email/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호|password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /로그인|Login|Sign in/i }).click();

    await page.waitForURL(/library/i, { timeout: TIMEOUTS.API_RESPONSE });

    // 로그아웃 버튼 찾기 (프로필 메뉴 등)
    const profileButton = page.locator(
      '[aria-label*="프로필"], [aria-label*="profile"], [aria-label*="user"]',
    );
    if ((await profileButton.count()) > 0) {
      await profileButton.click();
    }

    const logoutButton = page.getByRole("button", {
      name: /로그아웃|Logout|Sign out/i,
    });
    await logoutButton.click();

    // 로그인 페이지로 이동 확인
    await page.waitForURL(/auth|login/i, { timeout: TIMEOUTS.API_RESPONSE });
  });
});
