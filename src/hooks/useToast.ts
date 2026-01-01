import { useCallback, useState } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

// Global toast state (simple implementation for now)
let toastListeners: Array<(toast: Toast) => void> = [];
let removeListeners: Array<(id: string) => void> = [];

export function useToast() {
  const [toasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
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
  }, []);

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
