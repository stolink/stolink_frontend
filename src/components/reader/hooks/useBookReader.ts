import { useState, useCallback, useEffect, useRef } from "react";
import type { Theme, ViewMode } from "../theme";

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface UseBookReaderOptions {
  chapters: Chapter[];
  initialChapterId?: string;
  isOpen: boolean;
  onClose: () => void;
  onScrollReset?: () => void;
}

interface UseBookReaderReturn {
  // State
  currentChapter: Chapter;
  currentChapterIndex: number;
  theme: Theme;
  fontSize: number;
  showToc: boolean;
  viewMode: ViewMode;
  showControls: boolean;
  hasPrev: boolean;
  hasNext: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setShowToc: React.Dispatch<React.SetStateAction<boolean>>;
  setViewMode: (mode: ViewMode) => void;
  goToPrev: () => void;
  goToNext: () => void;
  goToChapter: (index: number) => void;
  showControlsTemporarily: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleToc: () => void;

  // Computed
  canIncreaseFontSize: boolean;
  canDecreaseFontSize: boolean;
}

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_STEP = 2;
const CONTROLS_TIMEOUT_MS = 3000;

/**
 * BookReader 상태 관리 커스텀 훅
 * 모든 뷰어 상태와 사이드이펙트를 캡슐화
 */
export function useBookReader({
  chapters,
  initialChapterId,
  isOpen,
  onClose,
  onScrollReset,
}: UseBookReaderOptions): UseBookReaderReturn {
  // 초기 챕터 인덱스 계산
  const getInitialIndex = useCallback(() => {
    if (!initialChapterId) return 0;
    const index = chapters.findIndex((ch) => ch.id === initialChapterId);
    return index >= 0 ? index : 0;
  }, [chapters, initialChapterId]);

  // 상태
  const [currentChapterIndex, setCurrentChapterIndex] =
    useState(getInitialIndex);
  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState(18);
  const [showToc, setShowToc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("book");
  const [showControls, setShowControls] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 파생 상태
  const currentChapter = chapters[currentChapterIndex] || chapters[0];
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < chapters.length - 1;

  // 네비게이션
  const goToPrev = useCallback(() => {
    if (hasPrev) setCurrentChapterIndex((prev) => prev - 1);
  }, [hasPrev]);

  const goToNext = useCallback(() => {
    if (hasNext) setCurrentChapterIndex((prev) => prev + 1);
  }, [hasNext]);

  const goToChapter = useCallback((index: number) => {
    setCurrentChapterIndex(index);
    setShowToc(false);
  }, []);

  // 컨트롤 자동 숨김
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_TIMEOUT_MS);
  }, []);

  // 폰트 사이즈 조절
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(FONT_SIZE_MAX, prev + FONT_SIZE_STEP));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(FONT_SIZE_MIN, prev - FONT_SIZE_STEP));
  }, []);

  // TOC 토글
  const toggleToc = useCallback(() => {
    setShowToc((prev) => !prev);
  }, []);

  // 키보드 네비게이션 이펙트
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === "book") {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goToPrev();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          goToNext();
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, viewMode, goToPrev, goToNext, onClose]);

  // 바디 스크롤 제어 이펙트
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 챕터 변경 시 스크롤 리셋 이펙트
  useEffect(() => {
    if (viewMode === "book" && onScrollReset) {
      onScrollReset();
    }
  }, [currentChapterIndex, viewMode, onScrollReset]);

  // 타임아웃 클린업
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    currentChapter,
    currentChapterIndex,
    theme,
    fontSize,
    showToc,
    viewMode,
    showControls,
    hasPrev,
    hasNext,

    // Actions
    setTheme,
    setShowToc,
    setViewMode,
    goToPrev,
    goToNext,
    goToChapter,
    showControlsTemporarily,
    increaseFontSize,
    decreaseFontSize,
    toggleToc,

    // Computed
    canIncreaseFontSize: fontSize < FONT_SIZE_MAX,
    canDecreaseFontSize: fontSize > FONT_SIZE_MIN,
  };
}
