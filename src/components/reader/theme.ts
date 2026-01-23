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
    container: "bg-white text-espresso-900",
    header: "bg-white border-input text-espresso-900",
    sidebar: "bg-cloud-50 border-input",
    sidebarTitle: "text-muted-foreground",
    button: "bg-white border-input",
    divider: "#d6d3d1",
    muted: "text-muted-foreground",
    activeItem: "bg-mocha-400/20 text-mocha-700",
    hoverItem: "text-espresso-900 hover:bg-cloud-50",
    controlBg: "bg-cloud-50",
    activeControl: "bg-white text-espresso-900 shadow-sm",
    inactiveControl: "text-muted-foreground",
  },
  dark: {
    container: "bg-espresso-900 text-cloud-100",
    header: "bg-espresso-900 border-espresso-700 text-white",
    sidebar: "bg-espresso-800 border-espresso-700",
    sidebarTitle: "text-espresso-300",
    button: "bg-espresso-800 border-espresso-600",
    divider: "#44403c",
    muted: "text-espresso-500",
    activeItem: "bg-espresso-700 text-white",
    hoverItem: "text-espresso-300 hover:bg-espresso-700",
    controlBg: "bg-espresso-800",
    activeControl: "bg-espresso-700 text-white",
    inactiveControl: "text-espresso-400",
  },
  sepia: {
    container: "bg-amber-50 text-espresso-900",
    header: "bg-white border-input text-espresso-900",
    sidebar: "bg-cloud-50 border-input",
    sidebarTitle: "text-muted-foreground",
    button: "bg-amber-100 border-amber-300",
    divider: "#d6d3d1",
    muted: "text-muted-foreground",
    activeItem: "bg-mocha-400/20 text-mocha-700",
    hoverItem: "text-espresso-900 hover:bg-cloud-50",
    controlBg: "bg-cloud-50",
    activeControl: "bg-white text-espresso-900 shadow-sm",
    inactiveControl: "text-muted-foreground",
  },
} as const;

export const THEME_BUTTON_STYLES: Record<Theme, string> = {
  light: "bg-white border-cloud-300",
  dark: "bg-espresso-800 border-espresso-600",
  sepia: "bg-amber-100 border-amber-300",
} as const;

export const getThemeStyle = (theme: Theme): ThemeStyle => THEME_STYLES[theme];

export const getThemeButtonStyle = (theme: Theme): string =>
  THEME_BUTTON_STYLES[theme];
