/**
 * 분석 버퍼 스토어
 *
 * 사용자의 저장마다 변경분을 IndexedDB에 버퍼링하고,
 * 임계치 도달 또는 페이지 이탈 시 flush하여 분석을 트리거합니다.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { get, set as idbSet, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";
import type { ConsistencyReport } from "@/types/analysisResult";

// IndexedDB 스토리지 어댑터
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// 버퍼 청크 타입
export interface BufferChunk {
  documentId: string;
  content: string;
  charCount: number;
  timestamp: number;
}

// 설정 상수
const MIN_CHARS_FOR_AUTO_FLUSH = 10_000; // 10,000자
const MIN_INTERVAL_MS = 30 * 60 * 1000; // 30분

interface AnalysisBufferStore {
  // 상태
  projectId: string | null;
  buffer: BufferChunk[];
  bufferCharCount: number;
  lastFlushAt: number;
  isAnalyzing: boolean;
  progress: number;
  currentJobId: string | null;
  activeJobs: Record<string, string>; // projectId -> jobId 매핑
  lastAnalyzedHashes: Record<string, string>; // documentId -> contentHash
  lastConsistencyReport: ConsistencyReport | null; // 마지막 분석 결과 (일관성 리포트)

  // 액션
  setProjectId: (projectId: string | null) => void;
  addToBuffer: (documentId: string, content: string) => void;
  removeFromBuffer: (documentId: string) => void;
  flush: () => BufferChunk[];
  clearBuffer: () => void;
  shouldAutoFlush: () => boolean;
  setAnalyzing: (analyzing: boolean) => void;
  setProgress: (progress: number) => void;
  setJobId: (id: string | null) => void;
  setLastAnalyzedHashes: (hashes: Record<string, string>) => void;
  setLastConsistencyReport: (report: ConsistencyReport | null) => void;
  // Job 완료/실패 시 해당 프로젝트의 Job ID 제거
  clearJobId: (projectId: string) => void;
  // 강제 초기화
  resetAnalysis: () => void;

  // 유틸리티
  getBufferSummary: () => { charCount: number; documentCount: number };
}

export const useAnalysisBufferStore = create<AnalysisBufferStore>()(
  persist(
    immer((set, get) => ({
      projectId: null,
      buffer: [],
      bufferCharCount: 0,
      lastFlushAt: Date.now(),
      isAnalyzing: false,
      progress: 0,
      currentJobId: null,
      activeJobs: {}, // 초기화
      lastAnalyzedHashes: {},
      lastConsistencyReport: null,

      setProjectId: (projectId) => {
        set((state) => {
          // 프로젝트가 바뀌면 버퍼 초기화
          if (state.projectId !== projectId) {
            state.projectId = projectId;
            state.buffer = [];
            state.bufferCharCount = 0;
            state.bufferCharCount = 0;
            state.lastConsistencyReport = null; // 프로젝트 변경 시 리포트 초기화
            // state.lastAnalyzedHashes = {}; // 해시 유지 (새로고침/프로젝트 전환 시 재분석 방지)

            if (projectId && state.activeJobs[projectId]) {
              state.currentJobId = state.activeJobs[projectId];
              // Job 상태는 useProjectAnalysis에서 확인 후 업데이트하므로 여기선 기본값 유지
              // state.isAnalyzing = true;
            } else {
              state.currentJobId = null;
              state.isAnalyzing = false;
            }
          }
        });
      },

      addToBuffer: (documentId, content) => {
        const charCount = content.length;

        set((state) => {
          // 같은 문서의 이전 청크가 있으면 교체 (덮어쓰기)
          const existingIndex = state.buffer.findIndex(
            (chunk) => chunk.documentId === documentId
          );

          if (existingIndex >= 0) {
            // 기존 청크의 글자 수 빼고 새 청크로 교체
            const oldCharCount = state.buffer[existingIndex].charCount;
            state.bufferCharCount -= oldCharCount;
            state.buffer[existingIndex] = {
              documentId,
              content,
              charCount,
              timestamp: Date.now(),
            };
          } else {
            // 새 청크 추가
            state.buffer.push({
              documentId,
              content,
              charCount,
              timestamp: Date.now(),
            });
          }

          state.bufferCharCount += charCount;
        });
      },

      removeFromBuffer: (documentId) => {
        set((state) => {
          const index = state.buffer.findIndex(
            (chunk) => chunk.documentId === documentId
          );
          if (index >= 0) {
            state.bufferCharCount -= state.buffer[index].charCount;
            state.buffer.splice(index, 1);
          }
        });
      },

      flush: () => {
        const currentBuffer = [...get().buffer];

        set((state) => {
          state.buffer = [];
          state.bufferCharCount = 0;
          state.lastFlushAt = Date.now();
        });

        return currentBuffer;
      },

      clearBuffer: () => {
        set((state) => {
          state.buffer = [];
          state.bufferCharCount = 0;
        });
      },

      shouldAutoFlush: () => {
        const state = get();
        const hasEnoughContent =
          state.bufferCharCount >= MIN_CHARS_FOR_AUTO_FLUSH;
        const enoughTimePassed =
          Date.now() - state.lastFlushAt > MIN_INTERVAL_MS;

        return (hasEnoughContent || enoughTimePassed) && !state.isAnalyzing;
      },

      setAnalyzing: (analyzing) => {
        set((state) => {
          state.isAnalyzing = analyzing;
        });
      },
      setProgress: (progress) => {
        set((state) => {
          state.progress = progress;
        });
      },

      setJobId: (id) => {
        set((state) => {
          state.currentJobId = id;
          if (id === null) {
            state.progress = 0;
            state.isAnalyzing = false; // Reset analyzing state when jobId is cleared
          }
          if (state.projectId && id) {
            state.activeJobs[state.projectId] = id;
          } else if (state.projectId && id === null) {
            // setJobId(null) 호출 시 activeJobs에서도 제거
            delete state.activeJobs[state.projectId];
          }
        });
      },

      clearJobId: (projectId) => {
        set((state) => {
          delete state.activeJobs[projectId];
          if (state.projectId === projectId) {
            state.currentJobId = null;
            state.isAnalyzing = false;
          }
        });
      },
      setLastAnalyzedHashes: (hashes) => {
        set((state) => {
          state.lastAnalyzedHashes = {
            ...state.lastAnalyzedHashes,
            ...hashes,
          };
        });
      },
      setLastConsistencyReport: (report) => {
        set((state) => {
          state.lastConsistencyReport = report;
        });
      },
      resetAnalysis: () => {
        set((state) => {
          state.currentJobId = null;
          state.isAnalyzing = false;
          state.progress = 0;
          if (state.projectId) {
            delete state.activeJobs[state.projectId];
          }
        });
      },

      getBufferSummary: () => {
        const state = get();
        return {
          charCount: state.bufferCharCount,
          documentCount: state.buffer.length,
        };
      },
    })),
    {
      name: "sto-link-analysis-buffer",
      storage: createJSONStorage(() => storage),
      // 분석 중 상태는 persist하지 않음
      partialize: (state) => ({
        projectId: state.projectId,
        buffer: state.buffer,
        bufferCharCount: state.bufferCharCount,
        lastFlushAt: state.lastFlushAt,
        currentJobId: state.currentJobId,
        activeJobs: state.activeJobs, // 추가
        lastAnalyzedHashes: state.lastAnalyzedHashes,
      }),
    }
  )
);

// 설정 상수 export (테스트 및 UI 표시용)
export const ANALYSIS_BUFFER_CONFIG = {
  MIN_CHARS: MIN_CHARS_FOR_AUTO_FLUSH,
  MIN_INTERVAL_MS,
};
