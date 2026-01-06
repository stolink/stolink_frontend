import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface NotificationSettings {
  goalNotification: boolean;
  foreshadowingNotification: boolean;
  aiSuggestionNotification: boolean;
}

interface NotificationStore extends NotificationSettings {
  setGoalNotification: (enabled: boolean) => void;
  setForeshadowingNotification: (enabled: boolean) => void;
  setAiSuggestionNotification: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const defaultSettings: NotificationSettings = {
  goalNotification: true,
  foreshadowingNotification: true,
  aiSuggestionNotification: false,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    immer((set) => ({
      ...defaultSettings,

      setGoalNotification: (enabled) =>
        set((state) => {
          state.goalNotification = enabled;
        }),

      setForeshadowingNotification: (enabled) =>
        set((state) => {
          state.foreshadowingNotification = enabled;
        }),

      setAiSuggestionNotification: (enabled) =>
        set((state) => {
          state.aiSuggestionNotification = enabled;
        }),

      resetToDefaults: () => set(() => ({ ...defaultSettings })),
    })),
    {
      name: "stolink-notification-settings",
      version: 1,
    },
  ),
);
