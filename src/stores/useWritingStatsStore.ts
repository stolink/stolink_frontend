/**
 * 집필 통계 스토어
 *
 * 일일 집필량, 스트릭, 목표 관리 기능을 제공합니다.
 * IndexedDB에 persist하여 영구 저장됩니다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

// 일일 통계 타입
export interface DailyStat {
  date: string; // YYYY-MM-DD
  wordCount: number; // 그날 작성한 단어 수 (순수 증가분)
}

interface WritingStatsStore {
  // 상태
  dailyStats: Record<string, number>; // 날짜: 작성량
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;

  // 액션
  // 활동 기록 (글자 수가 증가했을 때 호출)
  recordActivity: (amount: number) => void;
  // 목표 설정
  setDailyGoal: (goal: number) => void;
  // 오늘의 작성량 조회
  getTodayCount: () => number;
  // 특정 기간 통계 조회 (히트맵용)
  getHistory: (days: number) => DailyStat[];
}

// IndexedDB 스토리지 어댑터
const statsStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// 날짜 유틸리티
const getTodayString = () => new Date().toISOString().split("T")[0];
const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export const useWritingStatsStore = create<WritingStatsStore>()(
  persist(
    immer((set, get) => ({
      dailyStats: {},
      dailyGoal: 1000, // 기본 목표 1000자
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,

      recordActivity: (amount) => {
        if (amount <= 0) return; // 감소하는 경우는 집필량 통계에 포함하지 않음 (선택 사항)

        const today = getTodayString();

        set((draft) => {
          // 일일 통계 업데이트
          if (!draft.dailyStats[today]) {
            draft.dailyStats[today] = 0;
          }
          draft.dailyStats[today] += amount;

          // 스트릭 업데이트 로직
          if (draft.lastActiveDate !== today) {
            const yesterday = getYesterdayString();

            // 어제 활동했으면 스트릭 증가, 아니면 1로 초기화 (오늘 처음 활동)
            if (draft.lastActiveDate === yesterday) {
              draft.currentStreak += 1;
            } else {
              draft.currentStreak = 1;
            }

            // 최장 스트릭 갱신
            if (draft.currentStreak > draft.longestStreak) {
              draft.longestStreak = draft.currentStreak;
            }

            draft.lastActiveDate = today;
          }
        });
      },

      setDailyGoal: (goal) => {
        set((draft) => {
          draft.dailyGoal = goal;
        });
      },

      getTodayCount: () => {
        const today = getTodayString();
        return get().dailyStats[today] || 0;
      },

      getHistory: (days) => {
        const history: DailyStat[] = [];
        const today = new Date();
        const stats = get().dailyStats;

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];

          history.push({
            date: dateStr,
            wordCount: stats[dateStr] || 0,
          });
        }

        return history;
      },
    })),
    {
      name: "sto-link-stats",
      storage: createJSONStorage(() => statsStorage),
    },
  ),
);
