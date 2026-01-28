/**
 * Route Prefetching Utilities
 *
 * 이 모듈은 React.lazy로 로딩되는 페이지 컴포넌트들의 코드를
 * 사용자의 클릭 이전에 미리 다운로드(Prefetch)하기 위해 사용됩니다.
 *
 * Vite/Rollup은 동일한 import() 경로에 대해 중복 요청을 제거하므로
 * App.tsx의 lazy import와 여기서의 prefetch import가 동일한 경로라면
 * 한 번만 다운로드됩니다.
 */

// 에디터 페이지 (가장 무거운 청크)
export const prefetchEditor = () => import("@/pages/editor/EditorPage");

// 세계관 설정 페이지
export const prefetchWorld = () => import("@/pages/world/WorldPage");

// 통계 페이지
export const prefetchAnalytics = () =>
  import("@/pages/analytics/AnalyticsPage");

// 설정 페이지
export const prefetchSettings = () => import("@/pages/settings/SettingsPage");

// 공유 페이지
export const prefetchShared = () => import("@/pages/share/SharedProjectPage");
