import { cn } from "@/lib/utils";
import type { Theme } from "./theme";
import { getThemeStyle } from "./theme";
import type { Chapter } from "./hooks/useBookReader";

interface TableOfContentsProps {
  chapters: Chapter[];
  currentIndex: number;
  theme: Theme;
  onSelectChapter: (index: number) => void;
}

/**
 * 목차 사이드바 컴포넌트
 * 챕터 리스트와 네비게이션
 */
export function TableOfContents({
  chapters,
  currentIndex,
  theme,
  onSelectChapter,
}: TableOfContentsProps) {
  const styles = getThemeStyle(theme);

  return (
    <aside
      className={cn(
        "w-64 border-r shrink-0 overflow-y-auto transition-colors",
        styles.sidebar
      )}
    >
      <div className="p-4">
        <h2 className={cn("text-sm font-medium mb-3", styles.sidebarTitle)}>
          목차
        </h2>
        <ul className="space-y-1">
          {chapters.map((chapter, idx) => (
            <li key={chapter.id}>
              <button
                onClick={() => onSelectChapter(idx)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  idx === currentIndex ? styles.activeItem : styles.hoverItem
                )}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
