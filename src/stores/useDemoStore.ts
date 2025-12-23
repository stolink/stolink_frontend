import { create } from 'zustand';

interface DemoState {
  // 데모 모드 여부
  isDemoMode: boolean;
  // 가이드 투어 진행 중
  isTourActive: boolean;
  // 투어 완료 여부
  isTourCompleted: boolean;

  // Actions
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  startTour: () => void;
  endTour: () => void;
  completeTour: () => void;
}

export const useDemoStore = create<DemoState>()((set) => ({
  isDemoMode: false,
  isTourActive: false,
  isTourCompleted: false,

  enterDemoMode: () => set({ isDemoMode: true }),
  exitDemoMode: () => set({ isDemoMode: false, isTourActive: false }),
  startTour: () => set({ isTourActive: true }),
  endTour: () => set({ isTourActive: false }),
  completeTour: () => set({ isTourActive: false, isTourCompleted: true }),
}));
