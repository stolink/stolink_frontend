import { useEffect } from "react";

interface UseKeyboardSaveOptions {
  isDemo: boolean;
  selectedSectionId: string | null;
  saveContentRef: React.RefObject<(content: string) => Promise<void>>;
  lastContentRef: React.RefObject<string>;
  saveTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
}

/**
 * Ctrl+S / Command+S 저장 키보드 단축키 훅
 */
export function useKeyboardSave({
  isDemo,
  selectedSectionId,
  saveContentRef,
  lastContentRef,
  saveTimeoutRef,
}: UseKeyboardSaveOptions) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isDemo && selectedSectionId) {
          // Clear any pending debounced save
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          try {
            await saveContentRef.current?.(lastContentRef.current || "");
            showSaveIndicator("success");
          } catch (error) {
            console.error("[EditorPage] Save failed:", error);
            showSaveIndicator("error");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isDemo,
    selectedSectionId,
    saveContentRef,
    lastContentRef,
    saveTimeoutRef,
  ]);
}

/**
 * 저장 인디케이터 표시 유틸리티
 */
function showSaveIndicator(type: "success" | "error") {
  const indicator = document.createElement("div");
  indicator.textContent = type === "success" ? "✓ 저장됨" : "✗ 저장 실패";
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : "#ef4444"};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease-out;
  `;
  document.body.appendChild(indicator);

  requestAnimationFrame(() => {
    indicator.style.opacity = "1";
  });

  setTimeout(
    () => {
      indicator.style.opacity = "0";
      setTimeout(() => indicator.remove(), 300);
    },
    type === "success" ? 2000 : 3000
  );
}
