import { create } from "zustand";

interface UIState {
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: "inspector" | "foreshadowing" | "ai" | "consistency";

  // Modal states

  createChapterModalOpen: boolean;

  // Theme
  theme: "light" | "dark";

  // AI Chat Redirection
  pendingAIChatMessage: string | null;

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  setRightSidebarTab: (
    tab: "inspector" | "foreshadowing" | "ai" | "consistency",
  ) => void;

  setCreateChapterModalOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setPendingAIChatMessage: (msg: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightSidebarTab: "inspector",

  createChapterModalOpen: false,
  theme: "light",
  pendingAIChatMessage: null,

  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

  setCreateChapterModalOpen: (open) => set({ createChapterModalOpen: open }),
  setTheme: (theme) => set({ theme }),
  setPendingAIChatMessage: (msg) => set({ pendingAIChatMessage: msg }),
}));
