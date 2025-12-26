import { forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme, ViewMode } from "./theme";
import { getThemeStyle } from "./theme";
import type { Chapter } from "./hooks/useBookReader";

interface ReaderContentProps {
  chapters: Chapter[];
  currentChapter: Chapter;
  theme: Theme;
  viewMode: ViewMode;
  fontSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * 리더 본문 컴포넌트
 * 책 모드와 스크롤 모드를 분기하여 렌더링
 */
export const ReaderContent = forwardRef<HTMLDivElement, ReaderContentProps>(
  function ReaderContent(
    {
      chapters,
      currentChapter,
      theme,
      viewMode,
      fontSize,
      hasPrev,
      hasNext,
      onPrev,
      onNext,
    },
    ref
  ) {
    const styles = getThemeStyle(theme);

    return (
      <main
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto transition-colors relative",
          styles.container,
          viewMode === "book" && "cursor-pointer select-none"
        )}
      >
        {viewMode === "scroll" ? (
          <ScrollModeContent
            chapters={chapters}
            theme={theme}
            fontSize={fontSize}
          />
        ) : (
          <BookModeContent
            currentChapter={currentChapter}
            theme={theme}
            fontSize={fontSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={onPrev}
            onNext={onNext}
            styles={styles}
          />
        )}
      </main>
    );
  }
);

interface ScrollModeContentProps {
  chapters: Chapter[];
  theme: Theme;
  fontSize: number;
}

function ScrollModeContent({
  chapters,
  theme,
  fontSize,
}: ScrollModeContentProps) {
  const titleColor = theme === "dark" ? "text-white" : "text-stone-800";
  const dividerColor =
    theme === "dark" ? "border-stone-700" : "border-stone-200";

  return (
    <div
      className="max-w-2xl mx-auto px-8 py-12"
      style={{ fontSize: `${fontSize}px` }}
    >
      {chapters.map((chapter, idx) => (
        <article key={chapter.id} className="mb-16 last:mb-0">
          <h2
            className={cn(
              "text-2xl font-heading font-bold mb-8 text-center",
              titleColor
            )}
          >
            {chapter.title}
          </h2>
          <div
            className="font-body leading-relaxed"
            style={{ lineHeight: "1.9" }}
            dangerouslySetInnerHTML={{
              __html: chapter.content.replace(/\n/g, "<br/><br/>"),
            }}
          />
          {idx < chapters.length - 1 && (
            <div className={cn("mt-16 border-t pt-16", dividerColor)} />
          )}
        </article>
      ))}
    </div>
  );
}

interface BookModeContentProps {
  currentChapter: Chapter;
  theme: Theme;
  fontSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  styles: ReturnType<typeof getThemeStyle>;
}

function BookModeContent({
  currentChapter,
  theme,
  fontSize,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  styles,
}: BookModeContentProps) {
  const arrowColor = theme === "dark" ? "text-stone-600" : "text-stone-300";

  return (
    <div className="h-full flex flex-col overflow-hidden p-8">
      {/* 챕터 헤더 */}
      <div className="text-center mb-6 shrink-0">
        <div
          className={cn("text-xs uppercase tracking-wider mb-2", styles.muted)}
        >
          {currentChapter.title}
        </div>
      </div>

      {/* 2단 페이지 영역 */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          columnCount: 2,
          columnGap: "3rem",
          columnRule: `1px solid ${styles.divider}`,
          fontSize: `${fontSize}px`,
          lineHeight: "1.8",
        }}
      >
        {/* 좌측 클릭 영역 */}
        <ClickableZone
          position="left"
          hasAction={hasPrev}
          arrowColor={arrowColor}
          onClick={onPrev}
        />

        {/* 우측 클릭 영역 */}
        <ClickableZone
          position="right"
          hasAction={hasNext}
          arrowColor={arrowColor}
          onClick={onNext}
        />

        {/* 콘텐츠 (자동으로 좌→우 흐름) */}
        <div
          className="font-body h-full"
          dangerouslySetInnerHTML={{
            __html: currentChapter.content.replace(/\n/g, "<br/><br/>"),
          }}
        />
      </div>
    </div>
  );
}

interface ClickableZoneProps {
  position: "left" | "right";
  hasAction: boolean;
  arrowColor: string;
  onClick: () => void;
}

function ClickableZone({
  position,
  hasAction,
  arrowColor,
  onClick,
}: ClickableZoneProps) {
  const isLeft = position === "left";
  const Arrow = isLeft ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-1/2 cursor-pointer z-10",
        "hover:bg-black/5 transition-colors",
        isLeft ? "left-0" : "right-0"
      )}
      onClick={onClick}
    >
      {hasAction && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity",
            arrowColor,
            isLeft ? "left-4" : "right-4"
          )}
        >
          <Arrow className="h-12 w-12" />
        </div>
      )}
    </div>
  );
}
