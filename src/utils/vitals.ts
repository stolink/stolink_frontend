// import { onCLS, onLCP, onFCP, onINP, type Metric } from "web-vitals";

// const reportToConsole = (metric: Metric) => {
//   console.log(`[Web Vitals] ${metric.name}:`, {
//     value: metric.value,
//     rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
//     delta: metric.delta,
//     id: metric.id,
//   });
// };

export const reportWebVitals = () => {
  // Disabled for production - uncomment to enable Web Vitals logging
  // onCLS(reportToConsole);
  // onLCP(reportToConsole);
  // onFCP(reportToConsole);
  // onINP(reportToConsole);
};
