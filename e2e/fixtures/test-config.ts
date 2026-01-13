/**
 * E2E 테스트 공통 설정 및 테스트 계정 정보
 */

// 테스트용 계정 정보
export const TEST_USER = {
  email: "user@gmail.com",
  password: "qlalfqjsgh1~",
};

// 신규 가입용 테스트 계정 (매번 고유해야 함)
export const getNewUserCredentials = () => ({
  email: `testuser_${Date.now()}@example.com`,
  password: "Password123!",
  nickname: `테스트유저_${Date.now()}`,
});

// 공통 URL 경로
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  LOGIN: "/auth?tab=login",
  REGISTER: "/auth?tab=register",
  LIBRARY: "/library",
  EDITOR: (projectId: string) => `/projects/${projectId}/editor`,
  WORLD: (projectId: string) => `/projects/${projectId}/world`,
  GRAPH: (projectId: string) => `/projects/${projectId}/graph`,
};

// 테스트 타임아웃 설정
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  API_RESPONSE: 15000,
};

// 테스트용 프로젝트/문서 ID (테스트 DB에 존재해야 함)
export const TEST_DATA = {
  PROJECT_ID: "", // 테스트 실행 시 동적으로 생성
  DOCUMENT_ID: "", // 테스트 실행 시 동적으로 생성
};
