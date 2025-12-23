import { create } from 'zustand';

interface UIState {
  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: 'foreshadowing' | 'ai' | 'consistency';

  // Modal states
  createProjectModalOpen: boolean;
  createChapterModalOpen: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarTab: (tab: 'foreshadowing' | 'ai' | 'consistency') => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setCreateChapterModalOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightSidebarTab: 'foreshadowing',
  createProjectModalOpen: false,
  createChapterModalOpen: false,
  theme: 'light',

  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
  setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
  setCreateChapterModalOpen: (open) => set({ createChapterModalOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
