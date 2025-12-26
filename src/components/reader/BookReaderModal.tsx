import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useBookReader } from "./hooks/useBookReader";
import { getThemeStyle } from "./theme";
import { ReaderHeader } from "./ReaderHeader";
import { ReaderFooter } from "./ReaderFooter";
import { ReaderContent } from "./ReaderContent";
import { TableOfContents } from "./TableOfContents";
import type { Chapter } from "./hooks/useBookReader";

interface BookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  initialChapterId?: string;
  bookTitle?: string;
}

/**
 * 책 읽기 모달 컴포넌트
 *
 * 리팩토링 후 구조:
 * - useBookReader: 상태 및 로직 관리
 * - ReaderHeader: 설정 UI (테마, 폰트, 뷰모드)
 * - ReaderContent: 본문 렌더링 (책/스크롤 모드)
 * - TableOfContents: 목차 사이드바
 * - ReaderFooter: 네비게이션 컨트롤
 *
 * @example
 * ```tsx
 * <BookReaderModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   chapters={chapters}
 *   bookTitle="나의 소설"
 * />
 * ```
 */
export function BookReaderModal({
  isOpen,
  onClose,
  chapters,
  initialChapterId,
  bookTitle = "미리보기",
}: BookReaderModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const reader = useBookReader({
    chapters,
    initialChapterId,
    isOpen,
    onClose,
    onScrollReset: () => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    },
  });

  // Early return for closed state or empty chapters
  if (!isOpen || chapters.length === 0) return null;

  const styles = getThemeStyle(reader.theme);

  return (
    <div
      className={cn("fixed inset-0 z-[200] flex flex-col", styles.container)}
    >
      <ReaderHeader
        theme={reader.theme}
        viewMode={reader.viewMode}
        bookTitle={bookTitle}
        canIncreaseFontSize={reader.canIncreaseFontSize}
        canDecreaseFontSize={reader.canDecreaseFontSize}
        onClose={onClose}
        onThemeChange={reader.setTheme}
        onViewModeChange={reader.setViewMode}
        onToggleToc={reader.toggleToc}
        onIncreaseFontSize={reader.increaseFontSize}
        onDecreaseFontSize={reader.decreaseFontSize}
      />

      <div className="flex-1 flex overflow-hidden">
        {reader.showToc && (
          <TableOfContents
            chapters={chapters}
            currentIndex={reader.currentChapterIndex}
            theme={reader.theme}
            onSelectChapter={reader.goToChapter}
          />
        )}

        <ReaderContent
          ref={contentRef}
          chapters={chapters}
          currentChapter={reader.currentChapter}
          theme={reader.theme}
          viewMode={reader.viewMode}
          fontSize={reader.fontSize}
          hasPrev={reader.hasPrev}
          hasNext={reader.hasNext}
          onPrev={reader.goToPrev}
          onNext={reader.goToNext}
        />
      </div>

      {reader.viewMode === "book" && (
        <ReaderFooter
          theme={reader.theme}
          showControls={reader.showControls}
          currentChapterIndex={reader.currentChapterIndex}
          totalChapters={chapters.length}
          hasPrev={reader.hasPrev}
          hasNext={reader.hasNext}
          onPrev={reader.goToPrev}
          onNext={reader.goToNext}
          onShowControls={reader.showControlsTemporarily}
        />
      )}
    </div>
  );
}
