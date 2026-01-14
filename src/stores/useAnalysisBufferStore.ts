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
import { calculateContentHash } from "@/utils/hashUtils";

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
const MIN_CHARS_FOR_AUTO_FLUSH = 5_000; // 5,000자
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
  currentJobType: "analysis" | "image" | null;
  currentJobTargetId: string | null; // Added to track specific character/document
  activeJobs: Record<string, string[]>; // projectId -> jobIds 배열 (모든 작업)
  activeAnalysisJobs: Record<string, string[]>; // projectId -> analysisJobIds 배열 (분석 작업만)
  lastAnalyzedHashes: Record<string, string>; // documentId -> contentHash
  pendingDocuments: Record<string, string>; // 분석 요청된 문서: documentId -> contentHash (분석 완료 전까지 유지)
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
  setJobId: (
    id: string | null,
    type?: "analysis" | "image",
    targetId?: string | null,
  ) => void;
  addJobId: (
    projectId: string,
    id: string,
    type?: "analysis" | "image",
    targetId?: string | null,
  ) => void;
  removeJobId: (projectId: string, id: string) => void;
  setLastAnalyzedHashes: (hashes: Record<string, string>) => void;
  setLastConsistencyReport: (report: ConsistencyReport | null) => void;
  // 분석 요청된 문서 트래킹
  setPendingDocuments: (docs: Record<string, string>) => void;
  clearPendingDocuments: () => void;
  // 변경된 문서만 추출 (해시 비교)
  getChangedDocuments: () => BufferChunk[];
  // Job 완료/실패 시 해당 프로젝트의 모든 Job ID 제거 (이미지 포함)
  clearJobs: (projectId: string) => void;
  // 분석 작업만 제거 (이미지 생성 유지)
  clearAnalysisJobs: (projectId: string) => void;
  // 강제 초기화
  resetAnalysis: () => void;

  // 유틸리티
  getBufferSummary: () => { charCount: number; documentCount: number };
  hasUnanalyzedChanges: () => boolean; // 버퍼에 분석 안 된 변경이 있는지
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
      currentJobType: null,
      currentJobTargetId: null,
      activeJobs: {}, // 초기화
      activeAnalysisJobs: {}, // 분석 작업 전용
      lastAnalyzedHashes: {},
      pendingDocuments: {}, // 분석 요청된 문서 트래킹
      lastConsistencyReport: null,

      setProjectId: (projectId) => {
        set((state) => {
          // 프로젝트가 바뀌면 버퍼 초기화
          if (state.projectId !== projectId) {
            state.projectId = projectId;
            state.buffer = [];
            state.bufferCharCount = 0;
            state.lastConsistencyReport = null; // 프로젝트 변경 시 리포트 초기화
            // state.lastAnalyzedHashes = {}; // 해시 유지 (새로고침/프로젝트 전환 시 재분석 방지)

            if (projectId && state.activeJobs[projectId]?.length > 0) {
              const jobs = state.activeJobs[projectId];
              state.currentJobId = jobs[jobs.length - 1]; // 가장 최신 Job을 일단 표시
              state.currentJobType = "analysis"; // Default to analysis on reload if unknown
            } else {
              state.currentJobId = null;
              state.currentJobType = null;
              state.currentJobTargetId = null;
            }
            // isAnalyzing은 persist에서 복원되어도 useProjectAnalysis의 mount status check 결과를 따르도록 함
            state.isAnalyzing = false;
          }
        });
      },

      addToBuffer: (documentId, content) => {
        const charCount = content.length;

        set((state) => {
          // 같은 문서의 이전 청크가 있으면 교체 (덮어쓰기)
          const existingIndex = state.buffer.findIndex(
            (chunk) => chunk.documentId === documentId,
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
            (chunk) => chunk.documentId === documentId,
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

      shouldAutoFlush: () => false, // Always false as auto-flush is disabled

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

      setJobId: (id, type, targetId) => {
        set((state) => {
          state.currentJobId = id;
          state.currentJobType = id ? (type ?? null) : null;
          state.currentJobTargetId = id ? (targetId ?? null) : null;
          if (id === null) {
            state.progress = 0;
            state.isAnalyzing = false;
            if (state.projectId) {
              delete state.activeJobs[state.projectId];
            }
          } else {
            state.isAnalyzing = true;
            if (state.projectId) {
              state.activeJobs[state.projectId] = [id];
            }
          }
        });
      },

      addJobId: (projectId, id, type = "analysis", targetId = null) => {
        set((state) => {
          // 모든 작업은 activeJobs에 추가
          if (!state.activeJobs[projectId]) {
            state.activeJobs[projectId] = [];
          }
          if (!state.activeJobs[projectId].includes(id)) {
            state.activeJobs[projectId].push(id);
          }

          // 분석 작업만 activeAnalysisJobs에 추가 (SSE 트리거용)
          if (type === "analysis") {
            if (!state.activeAnalysisJobs[projectId]) {
              state.activeAnalysisJobs[projectId] = [];
            }
            if (!state.activeAnalysisJobs[projectId].includes(id)) {
              state.activeAnalysisJobs[projectId].push(id);
            }
          }

          state.currentJobId = id;
          state.currentJobType = type;
          state.currentJobTargetId = targetId;
          state.isAnalyzing = true;
        });
      },

      removeJobId: (projectId, id) => {
        set((state) => {
          // activeJobs에서 제거
          if (state.activeJobs[projectId]) {
            state.activeJobs[projectId] = state.activeJobs[projectId].filter(
              (jobId) => jobId !== id,
            );
            if (state.activeJobs[projectId].length === 0) {
              delete state.activeJobs[projectId];
              if (state.currentJobId === id) {
                state.currentJobId = null;
                state.currentJobType = null;
                state.currentJobTargetId = null;
              }
            } else if (state.currentJobId === id) {
              state.currentJobId =
                state.activeJobs[projectId][
                  state.activeJobs[projectId].length - 1
                ];
            }
          }

          // activeAnalysisJobs에서도 제거
          if (state.activeAnalysisJobs[projectId]) {
            state.activeAnalysisJobs[projectId] = state.activeAnalysisJobs[
              projectId
            ].filter((jobId) => jobId !== id);
            if (state.activeAnalysisJobs[projectId].length === 0) {
              delete state.activeAnalysisJobs[projectId];
            }
          }
        });
      },

      clearJobs: (projectId) => {
        set((state) => {
          delete state.activeJobs[projectId];
          delete state.activeAnalysisJobs[projectId];
          if (state.projectId === projectId) {
            state.currentJobId = null;
            state.currentJobType = null;
            state.currentJobTargetId = null;
            state.isAnalyzing = false;
            state.progress = 0;
          }
        });
      },

      clearAnalysisJobs: (projectId) => {
        set((state) => {
          // 이미지 작업 등 다른 작업은 유지하고 분석 작업만 제거
          delete state.activeAnalysisJobs[projectId];

          // 현재 보고 있는 작업이 분석 작업이면 상태 초기화
          if (
            state.projectId === projectId &&
            state.currentJobType === "analysis"
          ) {
            state.currentJobId = null;
            state.currentJobType = null;
            state.currentJobTargetId = null;
            state.isAnalyzing = false;
            state.progress = 0;
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

      setPendingDocuments: (docs) => {
        set((state) => {
          state.pendingDocuments = { ...state.pendingDocuments, ...docs };
        });
      },

      clearPendingDocuments: () => {
        set((state) => {
          state.pendingDocuments = {};
        });
      },

      resetAnalysis: () => {
        set((state) => {
          state.currentJobId = null;
          state.currentJobType = null;
          state.currentJobTargetId = null;
          state.isAnalyzing = false;
          state.progress = 0;
          state.pendingDocuments = {};
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

      getChangedDocuments: () => {
        const state = get();
        const { buffer, lastAnalyzedHashes, pendingDocuments } = state;

        return buffer.filter((chunk) => {
          if (pendingDocuments[chunk.documentId]) {
            return false;
          }

          const contentHash = calculateContentHash(chunk.content);
          return lastAnalyzedHashes[chunk.documentId] !== contentHash;
        });
      },

      hasUnanalyzedChanges: () => {
        const state = get();
        const { buffer, lastAnalyzedHashes, pendingDocuments } = state;

        return buffer.some((chunk) => {
          if (pendingDocuments[chunk.documentId]) {
            return false;
          }

          const contentHash = calculateContentHash(chunk.content);
          return lastAnalyzedHashes[chunk.documentId] !== contentHash;
        });
      },
    })),
    {
      name: "sto-link-analysis-buffer",
      storage: createJSONStorage(() => storage),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          return {
            ...(persistedState as object),
            activeAnalysisJobs: {},
          };
        }
        return persistedState as AnalysisBufferStore;
      },
      partialize: (state) => ({
        projectId: state.projectId,
        buffer: state.buffer,
        bufferCharCount: state.bufferCharCount,
        lastFlushAt: state.lastFlushAt,
        progress: state.progress,
        currentJobId: state.currentJobId,
        currentJobType: state.currentJobType,
        currentJobTargetId: state.currentJobTargetId,
        activeJobs: state.activeJobs,
        activeAnalysisJobs: state.activeAnalysisJobs,
        lastAnalyzedHashes: state.lastAnalyzedHashes,
        pendingDocuments: state.pendingDocuments,
        lastConsistencyReport: state.lastConsistencyReport,
      }),
      // 기존 저장 상태에 새 필드가 없을 때 기본값 적용
      merge: (persistedState, currentState) => {
        const ps = persistedState as Partial<AnalysisBufferStore> | null;
        return {
          ...currentState,
          ...(ps || {}),
          // Ensure new fields have defaults if missing in older persisted state
          activeAnalysisJobs:
            ps?.activeAnalysisJobs ?? currentState.activeAnalysisJobs,
        } as AnalysisBufferStore;
      },
    },
  ),
);

// 설정 상수 export (테스트 및 UI 표시용)
export const ANALYSIS_BUFFER_CONFIG = {
  MIN_CHARS: MIN_CHARS_FOR_AUTO_FLUSH,
  MIN_INTERVAL_MS,
};
