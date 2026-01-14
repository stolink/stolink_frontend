import { useState, useEffect } from "react";

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

const TOAST_DEBOUNCE_MS = 500;
const recentToasts = new Map<string, number>();

export const toast = (options: ToastOptions) => {
  const key = `${options.title}:${options.description || ""}`;
  const now = Date.now();
  const lastTime = recentToasts.get(key);

  if (lastTime && now - lastTime < TOAST_DEBOUNCE_MS) {
    return "debounced-duplicate";
  }

  recentToasts.set(key, now);

  setTimeout(() => {
    recentToasts.delete(key);
  }, TOAST_DEBOUNCE_MS);

  const id = Math.random().toString(36).slice(2);
  const newToast: Toast = { ...options, id };

  toastListeners.forEach((listener) => listener(newToast));

  const duration = options.duration ?? 5000;
  if (duration !== Infinity) {
    setTimeout(() => {
      removeListeners.forEach((listener) => listener(id));
    }, duration);
  }

  return id;
};

export const dismiss = (id: string) => {
  removeListeners.forEach((listener) => listener(id));
};

export function useToast() {
  return { toast, dismiss };
}

// Hook for toast container to subscribe to all toasts
export function useToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
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
  }, []);

  return toasts;
}
