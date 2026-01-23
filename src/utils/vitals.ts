/**
 * Web Vitals 측정 및 리포팅
 *
 * 프로덕션 환경에서 성능 측정이 필요할 경우 web-vitals 패키지를 설치하고
 * 아래 코드의 주석을 해제하세요.
 *
 * @example
 * // web-vitals 패키지 설치 후 사용:
 * import { onCLS, onLCP, onFCP, onINP, type Metric } from "web-vitals";
 *
 * const reportToConsole = (metric: Metric) => {
 *   console.log(`[Web Vitals] ${metric.name}:`, {
 *     value: metric.value,
 *     rating: metric.rating,
 *     delta: metric.delta,
 *     id: metric.id,
 *   });
 * };
 */

export const reportWebVitals = () => {
  // 프로덕션에서는 비활성화 상태
  // 성능 측정이 필요하면 web-vitals 패키지를 설치하고 위 예제 코드를 사용하세요
};
