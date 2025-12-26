/**
 * BookReader 테마 상수 및 유틸리티
 * 조건 분기 대신 룩업 테이블로 스타일 관리
 */

export type Theme = "light" | "dark" | "sepia";
export type ViewMode = "scroll" | "book";

export interface ThemeStyle {
  container: string;
  header: string;
  sidebar: string;
  sidebarTitle: string;
  button: string;
  divider: string;
  muted: string;
  activeItem: string;
  hoverItem: string;
  controlBg: string;
  activeControl: string;
  inactiveControl: string;
}

export const THEME_STYLES: Record<Theme, ThemeStyle> = {
  light: {
    container: "bg-white text-stone-800",
    header: "bg-white border-stone-200 text-stone-800",
    sidebar: "bg-stone-50 border-stone-200",
    sidebarTitle: "text-stone-600",
    button: "bg-white border-stone-300",
    divider: "#d6d3d1",
    muted: "text-stone-400",
    activeItem: "bg-sage-100 text-sage-700",
    hoverItem: "text-stone-600 hover:bg-stone-100",
    controlBg: "bg-stone-100",
    activeControl: "bg-white text-stone-800 shadow-sm",
    inactiveControl: "text-stone-500",
  },
  dark: {
    container: "bg-stone-900 text-stone-100",
    header: "bg-stone-900 border-stone-700 text-white",
    sidebar: "bg-stone-800 border-stone-700",
    sidebarTitle: "text-stone-300",
    button: "bg-stone-800 border-stone-600",
    divider: "#44403c",
    muted: "text-stone-500",
    activeItem: "bg-stone-700 text-white",
    hoverItem: "text-stone-300 hover:bg-stone-700",
    controlBg: "bg-stone-800",
    activeControl: "bg-stone-700 text-white",
    inactiveControl: "text-stone-400",
  },
  sepia: {
    container: "bg-amber-50 text-stone-800",
    header: "bg-white border-stone-200 text-stone-800",
    sidebar: "bg-stone-50 border-stone-200",
    sidebarTitle: "text-stone-600",
    button: "bg-amber-100 border-amber-300",
    divider: "#d6d3d1",
    muted: "text-stone-400",
    activeItem: "bg-sage-100 text-sage-700",
    hoverItem: "text-stone-600 hover:bg-stone-100",
    controlBg: "bg-stone-100",
    activeControl: "bg-white text-stone-800 shadow-sm",
    inactiveControl: "text-stone-500",
  },
} as const;

export const THEME_BUTTON_STYLES: Record<Theme, string> = {
  light: "bg-white border-stone-300",
  dark: "bg-stone-800 border-stone-600",
  sepia: "bg-amber-100 border-amber-300",
} as const;

export const getThemeStyle = (theme: Theme): ThemeStyle => THEME_STYLES[theme];

export const getThemeButtonStyle = (theme: Theme): string =>
  THEME_BUTTON_STYLES[theme];
