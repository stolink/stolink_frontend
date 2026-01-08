import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { reportWebVitals } from "./utils/vitals";

reportWebVitals();

/**
 * Chunk 로딩 에러 감지 (다중 방식으로 견고하게)
 */
function isChunkLoadError(
  error: unknown,
  message: string,
  filename?: string,
): boolean {
  // 1. 에러 타입 체크 (가장 안정적)
  if (error && typeof error === "object") {
    const err = error as { name?: string; code?: string };
    if (err.name === "ChunkLoadError" || err.code === "CSS_CHUNK_LOAD_FAILED") {
      return true;
    }
  }

  // 2. 파일 경로 체크 (assets 폴더의 JS/CSS 로드 실패)
  if (filename && /assets\/.*\.(js|css)$/.test(filename)) {
    return true;
  }

  // 3. 메시지 매칭 (폴백 - 브라우저별 다양한 메시지 대응)
  const patterns = [
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    "error loading dynamically imported module",
    "Importing a module script failed",
    "Loading CSS chunk",
  ];

  return patterns.some((pattern) => message.includes(pattern));
}

/**
 * 세션당 최대 1번만 새로고침 (무한 새로고침 방지)
 */
function handleChunkError(): void {
  const reloadCount = parseInt(
    sessionStorage.getItem("chunk-reload-count") || "0",
  );

  if (reloadCount < 1) {
    sessionStorage.setItem("chunk-reload-count", (reloadCount + 1).toString());
    window.location.reload();
  }
}

// Chunk 로딩 실패 시 자동 새로고침 (배포 후 구 버전 사용자 대응)
window.addEventListener("error", (event) => {
  const error = event.error;
  const message = event.message || "";
  const filename = event.filename;

  if (isChunkLoadError(error, message, filename)) {
    handleChunkError();
  }
});

// 동적 import() Promise 거부 처리 (네트워크 장애 등)
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason) || "";

  if (isChunkLoadError(reason, message)) {
    handleChunkError();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
