import { useCallback, useState } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

// Global toast state (simple implementation for now)
let toastListeners: Array<(toast: Toast) => void> = [];
let removeListeners: Array<(id: string) => void> = [];
// Toast Debounce 설정
const TOAST_DEBOUNCE_MS = 500;
const recentToasts = new Map<string, number>();

export const toast = (options: ToastOptions) => {
  // 중복 toast 방지: title + description 조합으로 고유 키 생성
  const key = `${options.title}:${options.description || ""}`;
  const now = Date.now();
  const lastTime = recentToasts.get(key);

  // 최근(500ms 이내)에 동일한 토스트가 발생했다면 무시
  if (lastTime && now - lastTime < TOAST_DEBOUNCE_MS) {
    return "debounced-duplicate";
  }

  // 호출 기록 업데이트
  recentToasts.set(key, now);

  // 오래된 기록 정리 (메모리 누수 방지)
  setTimeout(() => {
    recentToasts.delete(key);
  }, TOAST_DEBOUNCE_MS);

  const id = Math.random().toString(36).slice(2);
  const newToast: Toast = { ...options, id };

  // Notify all listeners
  toastListeners.forEach((listener) => listener(newToast));

  // Auto dismiss after duration
  const duration = options.duration ?? 5000;
  setTimeout(() => {
    removeListeners.forEach((listener) => listener(id));
  }, duration);

  return id;
};

export function useToast() {
  const [toasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    removeListeners.forEach((listener) => listener(id));
  }, []);

  return { toast, dismiss, toasts };
}

// Hook for toast container to subscribe to all toasts
export function useToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Subscribe to toast events
  useState(() => {
    const addListener = (newToast: Toast) => {
      setToasts((prev) => [...prev, newToast]);
    };

    const removeListener = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    toastListeners.push(addListener);
    removeListeners.push(removeListener);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== addListener);
      removeListeners = removeListeners.filter((l) => l !== removeListener);
    };
  });

  return toasts;
}
