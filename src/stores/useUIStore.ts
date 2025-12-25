import { create } from "zustand";

interface UIState {
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: "foreshadowing" | "ai" | "consistency";

  // Modal states

  createChapterModalOpen: boolean;

  // Theme
  theme: "light" | "dark";

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarTab: (tab: "foreshadowing" | "ai" | "consistency") => void;

  setCreateChapterModalOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightSidebarTab: "foreshadowing",

  createChapterModalOpen: false,
  theme: "light",

  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

  setCreateChapterModalOpen: (open) => set({ createChapterModalOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
