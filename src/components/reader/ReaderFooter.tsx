import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Theme } from "./theme";
import { getThemeStyle } from "./theme";

interface ReaderFooterProps {
  theme: Theme;
  showControls: boolean;
  currentChapterIndex: number;
  totalChapters: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShowControls: () => void;
}

/**
 * 리더 푸터 컴포넌트
 * 책 모드에서의 네비게이션 컨트롤
 */
export function ReaderFooter({
  theme,
  showControls,
  currentChapterIndex,
  totalChapters,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onShowControls,
}: ReaderFooterProps) {
  const styles = getThemeStyle(theme);

  return (
    <>
      {/* 숨겨진 상태에서 하단 호버 영역 */}
      {!showControls && (
        <HoverTrigger theme={theme} onTrigger={onShowControls} />
      )}

      {/* 컨트롤 바 */}
      <footer
        className={cn(
          "px-4 flex items-center justify-between border-t shrink-0 transition-all duration-300",
          styles.header,
          showControls ? "h-14 opacity-100" : "h-0 opacity-0 overflow-hidden"
        )}
        onMouseEnter={onShowControls}
      >
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={!hasPrev}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>

        <div className="flex flex-col items-center">
          <span className={cn("text-sm", styles.muted)}>
            {currentChapterIndex + 1} / {totalChapters}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={onNext}
          disabled={!hasNext}
          className="gap-2"
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </>
  );
}

interface HoverTriggerProps {
  theme: Theme;
  onTrigger: () => void;
}

function HoverTrigger({ theme, onTrigger }: HoverTriggerProps) {
  const bgColor = theme === "dark" ? "bg-stone-700" : "bg-stone-200";

  return (
    <div
      className="h-6 w-full cursor-pointer flex items-center justify-center"
      onMouseEnter={onTrigger}
      onClick={onTrigger}
    >
      <div className={cn("w-12 h-1 rounded-full", bgColor)} />
    </div>
  );
}
