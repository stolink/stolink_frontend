/**
 * 집필 통계 스토어
 *
 * 일일 집필량, 스트릭, 목표 관리 기능을 제공합니다.
 * IndexedDB에 persist하여 영구 저장됩니다.
 *
 * 새로운 방식: 하루 시작 시 총 글자수(baseline)를 저장하고,
 * 현재 총 글자수와 비교하여 일일 진행률 계산
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
  wordCount: number; // 그날 순변화량 (현재 - baseline)
}

interface WritingStatsStore {
  // 상태
  dailyBaselines: Record<string, number>; // 날짜: 그날 시작 총 글자수
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  // 히스토리 (하루 끝 총 글자수 기록용)
  dailyEndTotals: Record<string, number>; // 날짜: 그날 마지막 총 글자수
  // 현재 총 글자수 (에디터와 분석 페이지 간 동기화용)
  currentTotalChars: number;
  // 각 문서별 글자수 (실시간 동기화용)
  documentCharCounts: Record<string, number>; // documentId: charCount

  // 액션
  // 현재 총 글자수 업데이트 (에디터에서 호출)
  updateTotalChars: (totalChars: number) => void;
  // 특정 문서의 글자수 업데이트 (에디터에서 호출)
  updateDocumentCharCount: (documentId: string, charCount: number) => void;
  // 여러 문서의 글자수 일괄 설정 (초기화용)
  setDocumentCharCounts: (counts: Record<string, number>) => void;
  // 오늘의 진행률 (스토어에서 직접 계산)
  getTodayProgress: () => number;
  // 목표 설정
  setDailyGoal: (goal: number) => void;
  // 특정 기간 통계 조회 (히트맵용)
  getHistory: (days: number) => DailyStat[];
  // 통계 초기화
  resetStats: () => void;
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
      dailyBaselines: {},
      dailyEndTotals: {},
      dailyGoal: 1000, // 기본 목표 1000자
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      currentTotalChars: 0,
      documentCharCounts: {}, // 각 문서별 글자수

      updateTotalChars: (totalChars) => {
        const today = getTodayString();

        set((draft) => {
          // 현재 총 글자수 업데이트 (항상)
          draft.currentTotalChars = totalChars;

          // 오늘 baseline이 없으면 현재 총 글자수를 baseline으로 설정
          if (draft.dailyBaselines[today] === undefined) {
            draft.dailyBaselines[today] = totalChars;
          }

          // 오늘 마지막 총 글자수 업데이트 (히스토리용)
          draft.dailyEndTotals[today] = totalChars;

          // 스트릭 업데이트 (글자수가 증가했을 때만)
          const todayProgress = totalChars - draft.dailyBaselines[today];
          if (todayProgress > 0 && draft.lastActiveDate !== today) {
            const yesterday = getYesterdayString();

            if (draft.lastActiveDate === yesterday) {
              draft.currentStreak += 1;
            } else {
              draft.currentStreak = 1;
            }

            if (draft.currentStreak > draft.longestStreak) {
              draft.longestStreak = draft.currentStreak;
            }

            draft.lastActiveDate = today;
          }
        });
      },

      updateDocumentCharCount: (documentId, charCount) => {
        set((draft) => {
          draft.documentCharCounts[documentId] = charCount;
          // 총 글자수도 업데이트
          const totalChars = Object.values(draft.documentCharCounts).reduce(
            (acc, count) => acc + count,
            0
          );
          draft.currentTotalChars = totalChars;

          // baseline 및 히스토리 업데이트
          const today = getTodayString();
          if (draft.dailyBaselines[today] === undefined) {
            draft.dailyBaselines[today] = totalChars;
          }
          draft.dailyEndTotals[today] = totalChars;

          // 스트릭 업데이트
          const todayProgress = totalChars - draft.dailyBaselines[today];
          if (todayProgress > 0 && draft.lastActiveDate !== today) {
            const yesterday = getYesterdayString();
            if (draft.lastActiveDate === yesterday) {
              draft.currentStreak += 1;
            } else {
              draft.currentStreak = 1;
            }
            if (draft.currentStreak > draft.longestStreak) {
              draft.longestStreak = draft.currentStreak;
            }
            draft.lastActiveDate = today;
          }
        });
      },

      setDocumentCharCounts: (counts) => {
        set((draft) => {
          draft.documentCharCounts = counts;
          const totalChars = Object.values(counts).reduce(
            (acc, count) => acc + count,
            0
          );
          draft.currentTotalChars = totalChars;

          const today = getTodayString();
          if (draft.dailyBaselines[today] === undefined) {
            draft.dailyBaselines[today] = totalChars;
          }
          draft.dailyEndTotals[today] = totalChars;
        });
      },

      getTodayProgress: () => {
        const today = getTodayString();
        const state = get();
        const baseline = state.dailyBaselines[today];
        const current = state.currentTotalChars;

        if (baseline === undefined || current === 0) {
          return 0;
        }

        return Math.max(0, current - baseline);
      },

      setDailyGoal: (goal) => {
        set((draft) => {
          draft.dailyGoal = goal;
        });
      },

      getHistory: (days) => {
        const history: DailyStat[] = [];
        const state = get();
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];

          const baseline = state.dailyBaselines[dateStr] || 0;
          const endTotal = state.dailyEndTotals[dateStr] || baseline;

          history.push({
            date: dateStr,
            wordCount: Math.max(0, endTotal - baseline),
          });
        }

        return history;
      },

      resetStats: () => {
        // dailyGoal은 사용자 영구 설정값이므로 초기화에서 제외
        set((draft) => {
          draft.dailyBaselines = {};
          draft.dailyEndTotals = {};
          draft.currentStreak = 0;
          draft.lastActiveDate = null;
          draft.currentTotalChars = 0;
          draft.documentCharCounts = {};
        });
      },
    })),
    {
      name: "sto-link-stats-v4", // 새 버전으로 마이그레이션
      storage: createJSONStorage(() => statsStorage),
      partialize: (state) => ({
        // documentCharCounts와 currentTotalChars는 persist하지 않음 (세션마다 새로 계산)
        dailyBaselines: state.dailyBaselines,
        dailyEndTotals: state.dailyEndTotals,
        dailyGoal: state.dailyGoal,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
      }),
      // persist에서 로드 시 누락된 필드에 기본값 적용
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<WritingStatsStore>),
        // 이 필드들은 항상 기본값으로 시작
        currentTotalChars: 0,
        documentCharCounts: {},
      }),
    }
  )
);
