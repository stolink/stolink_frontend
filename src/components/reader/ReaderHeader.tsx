import { X, Type, Minus, Plus, List, BookOpen, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Theme, ViewMode } from "./theme";
import { getThemeStyle, getThemeButtonStyle } from "./theme";

interface ReaderHeaderProps {
  theme: Theme;
  viewMode: ViewMode;
  bookTitle: string;
  canIncreaseFontSize: boolean;
  canDecreaseFontSize: boolean;
  onClose: () => void;
  onThemeChange: (theme: Theme) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleToc: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

/**
 * 리더 헤더 컴포넌트
 * 테마, 폰트 크기, 뷰 모드 설정 UI
 */
export function ReaderHeader({
  theme,
  viewMode,
  bookTitle,
  canIncreaseFontSize,
  canDecreaseFontSize,
  onClose,
  onThemeChange,
  onViewModeChange,
  onToggleToc,
  onIncreaseFontSize,
  onDecreaseFontSize,
}: ReaderHeaderProps) {
  const styles = getThemeStyle(theme);

  return (
    <header
      className={cn(
        "h-14 px-4 flex items-center justify-between border-b shrink-0 transition-colors",
        styles.header
      )}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">{bookTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <ViewModeToggle
          viewMode={viewMode}
          styles={styles}
          onChange={onViewModeChange}
        />

        {/* TOC Toggle */}
        <Button variant="ghost" size="icon" onClick={onToggleToc}>
          <List className="h-5 w-5" />
        </Button>

        {/* Font Size Controls */}
        <FontSizeControls
          theme={theme}
          canIncrease={canIncreaseFontSize}
          canDecrease={canDecreaseFontSize}
          onIncrease={onIncreaseFontSize}
          onDecrease={onDecreaseFontSize}
        />

        {/* Theme Switcher */}
        <ThemeSwitcher currentTheme={theme} onThemeChange={onThemeChange} />
      </div>
    </header>
  );
}

interface ViewModeToggleProps {
  viewMode: ViewMode;
  styles: ReturnType<typeof getThemeStyle>;
  onChange: (mode: ViewMode) => void;
}

function ViewModeToggle({ viewMode, styles, onChange }: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center rounded-lg p-1", styles.controlBg)}>
      <button
        onClick={() => onChange("book")}
        className={cn(
          "px-3 py-1 rounded-md text-sm flex items-center gap-1.5 transition-colors",
          viewMode === "book" ? styles.activeControl : styles.inactiveControl
        )}
        title="책 모드 (방향키로 이동)"
      >
        <BookOpen className="h-4 w-4" />책
      </button>
      <button
        onClick={() => onChange("scroll")}
        className={cn(
          "px-3 py-1 rounded-md text-sm flex items-center gap-1.5 transition-colors",
          viewMode === "scroll" ? styles.activeControl : styles.inactiveControl
        )}
        title="스크롤 모드"
      >
        <ScrollText className="h-4 w-4" />
        스크롤
      </button>
    </div>
  );
}

interface FontSizeControlsProps {
  theme: Theme;
  canIncrease: boolean;
  canDecrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

function FontSizeControls({
  theme,
  canIncrease,
  canDecrease,
  onIncrease,
  onDecrease,
}: FontSizeControlsProps) {
  const borderColor =
    theme === "dark" ? "border-stone-700" : "border-stone-200";

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 border-l border-r mx-2",
        borderColor
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onDecrease}
        disabled={!canDecrease}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Type className="h-4 w-4" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onIncrease}
        disabled={!canIncrease}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const themes: { key: Theme; title: string }[] = [
    { key: "light", title: "밝은 테마" },
    { key: "sepia", title: "세피아 테마" },
    { key: "dark", title: "어두운 테마" },
  ];

  return (
    <div className="flex items-center gap-1">
      {themes.map(({ key, title }) => (
        <button
          key={key}
          onClick={() => onThemeChange(key)}
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all",
            getThemeButtonStyle(key),
            currentTheme === key && "ring-2 ring-sage-500 ring-offset-2"
          )}
          title={title}
        />
      ))}
    </div>
  );
}
