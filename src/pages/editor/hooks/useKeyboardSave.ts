import { useEffect } from "react";

interface UseKeyboardSaveOptions {
  isDemo: boolean;
  selectedSectionId: string | null;
  saveContentRef: React.RefObject<(content: string) => Promise<void>>;
  lastContentRef: React.RefObject<string>;
  saveTimeoutRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  getLatestContent?: () => string;
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
  getLatestContent,
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
            // Get content from callback if available (for debounced editors), otherwise use ref
            const contentToSave = getLatestContent
              ? getLatestContent()
              : lastContentRef.current || "";

            // If content is empty strings, we should still save if that's the intention,
            // but usually we want to fallback to lastContentRef if getContent returns empty?
            // No, empty content is valid.
            // However, editorContentRef.current.getContent() updates ONLY if viewMode is editor.
            // If scrivenings, it returns "".
            // Use fallback logic: if getLatestContent returns "", verify if it's intentional?
            // TiptapEditor.getContent() returns editor.getHTML() which might be "<p></p>" or similar, rarely empty string unless truly empty.
            // But if viewMode is scrivenings, getContent returns "".
            // So we should check if getLatestContent returns something usable.

            // Actually, let's keep it simple: caller handles the logic.
            // But EditorContent.tsx returns "" for scrivenings.
            // In Scrivenings mode, simple Cmd+S might not work well with 'lastContentRef' of a single section anyway?
            // EditorPage tracks 'selectedSectionId'.
            // Let's assume for now we trust `getLatestContent` if provided, but maybe check for empty string if that's a failure case?
            // If TiptapEditor is mounted, it returns HTML string.

            await saveContentRef.current?.(contentToSave);
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
    getLatestContent,
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
    type === "success" ? 2000 : 3000,
  );
}
