/**
 * BookReader 컴포넌트 모듈
 * Barrel export for backward compatibility
 */

// Types
export type { Theme, ViewMode, ThemeStyle } from "./theme";
export type { Chapter } from "./hooks/useBookReader";

// Hook
export { useBookReader } from "./hooks/useBookReader";

// Theme utilities
export {
  getThemeStyle,
  getThemeButtonStyle,
  THEME_STYLES,
  THEME_BUTTON_STYLES,
} from "./theme";

// Components
export { ReaderHeader } from "./ReaderHeader";
export { ReaderFooter } from "./ReaderFooter";
export { ReaderContent } from "./ReaderContent";
export { TableOfContents } from "./TableOfContents";
export { BookReaderModal } from "./BookReaderModal";
