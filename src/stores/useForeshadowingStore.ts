import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { get, set as idbSet, del } from "idb-keyval";
import type {
  Foreshadowing,
  ForeshadowingStatus,
  ForeshadowingImportance,
} from "@/types";

// Custom storage adapter for IndexedDB
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

interface ForeshadowingStore {
  // === State ===
  foreshadowings: Record<string, Foreshadowing>;

  // === CRUD ===
  createForeshadowing: (input: CreateForeshadowingInput) => Foreshadowing;
  updateForeshadowing: (id: string, updates: UpdateForeshadowingInput) => void;
  deleteForeshadowing: (id: string) => void;
  deleteByDocumentId: (documentId: string) => void; // 섹션 삭제 시 복선 삭제

  // === 조회 ===
  getByProject: (projectId: string) => Foreshadowing[];
  getByStatus: (
    projectId: string,
    status: ForeshadowingStatus,
  ) => Foreshadowing[];
  getByScene: (sceneId: string) => Foreshadowing[];
  getByCharacter: (characterId: string) => Foreshadowing[];
  getUnresolved: (projectId: string) => Foreshadowing[];
  getNextTagNumber: (projectId: string) => number; // "복선 N" 자동 네이밍

  // === 상태 변경 ===
  markAsRecovered: (
    id: string,
    recoveryInfo: ForeshadowingAppearanceInput,
  ) => void;
  markAsPending: (id: string) => void; // 회수 취소
  markAsIgnored: (id: string) => void;

  // === 등장 관리 ===
  addAppearance: (id: string, appearance: ForeshadowingAppearanceInput) => void;
  removeAppearance: (id: string, documentId: string) => void;
}

// 복선 생성 입력 (위치 정보 포함)
interface CreateForeshadowingInput {
  projectId: string;
  title: string;
  description?: string;
  importance?: ForeshadowingImportance;
  relatedCharacterIds?: string[];
  // 새로 추가: 생성 시 위치 정보
  documentId?: string;
  sectionTitle?: string;
  nodePosition?: number;
  line?: number;
}

interface UpdateForeshadowingInput {
  title?: string;
  description?: string;
  status?: ForeshadowingStatus;
  importance?: ForeshadowingImportance;
  relatedCharacterIds?: string[];
}

// 등장 위치 입력 (섹션 정보만 필수)
interface ForeshadowingAppearanceInput {
  sectionTitle: string;
  isRecovery?: boolean;
  documentId?: string; // 레거시 호환
}

const generateId = () =>
  `fs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useForeshadowingStore = create<ForeshadowingStore>()(
  persist(
    immer((set, get) => ({
      foreshadowings: {},

      createForeshadowing: (input) => {
        const newFs: Foreshadowing = {
          id: generateId(),
          projectId: input.projectId,
          tag: input.tag,
          status: "pending",
          description: input.description,
          importance: input.importance || "minor",
          relatedCharacterIds: input.relatedCharacterIds || [],
          appearances: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          state.foreshadowings[newFs.id] = newFs;
        });

        return newFs;
      },

      updateForeshadowing: (id, updates) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            Object.assign(state.foreshadowings[id], updates);
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },

      deleteForeshadowing: (id) => {
        set((state) => {
          delete state.foreshadowings[id];
        });
      },

      // 섹션 삭제 시 해당 섹션의 복선 모두 삭제
      deleteByDocumentId: (documentId) => {
        set((state) => {
          const idsToDelete = Object.values(state.foreshadowings)
            .filter((fs) =>
              fs.appearances.some((a) => a.documentId === documentId),
            )
            .map((fs) => fs.id);

          idsToDelete.forEach((id) => {
            delete state.foreshadowings[id];
          });
        });
      },

      getByProject: (projectId) => {
        return Object.values(get().foreshadowings).filter(
          (fs) => fs.projectId === projectId,
        );
      },

      getByStatus: (projectId, status) => {
        return Object.values(get().foreshadowings).filter(
          (fs) => fs.projectId === projectId && fs.status === status,
        );
      },

      getByScene: (sceneId) => {
        return Object.values(get().foreshadowings).filter((fs) =>
          fs.appearances.some((a) => a.sceneId === sceneId),
        );
      },

      getByCharacter: (characterId) => {
        return Object.values(get().foreshadowings).filter((fs) =>
          fs.relatedCharacterIds?.includes(characterId),
        );
      },

      getUnresolved: (projectId) => {
        return Object.values(get().foreshadowings).filter(
          (fs) => fs.projectId === projectId && fs.status === "pending",
        );
      },

      // "복선 N" 자동 네이밍을 위한 다음 번호 조회
      getNextTagNumber: (projectId) => {
        const existing = Object.values(get().foreshadowings).filter(
          (fs) => fs.projectId === projectId && fs.tag.startsWith("복선 "),
        );

        if (existing.length === 0) return 1;

        const numbers = existing
          .map((fs) => {
            const match = fs.tag.match(/^복선 (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => !isNaN(n));

        return Math.max(0, ...numbers) + 1;
      },

      markAsRecovered: (id, recoveryInfo) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            state.foreshadowings[id].status = "recovered";
            state.foreshadowings[id].appearances.push({
              ...recoveryInfo,
              isRecovery: true,
            });
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },

      // 회수 취소: recovered → pending
      markAsPending: (id) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            state.foreshadowings[id].status = "pending";
            // 회수 지점 appearance 제거
            state.foreshadowings[id].appearances = state.foreshadowings[
              id
            ].appearances.filter((a) => !a.isRecovery);
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },

      markAsIgnored: (id) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            state.foreshadowings[id].status = "ignored";
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },

      addAppearance: (id, appearance) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            state.foreshadowings[id].appearances.push({
              ...appearance,
              isRecovery: appearance.isRecovery || false,
            });
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },

      removeAppearance: (id, documentId) => {
        set((state) => {
          if (state.foreshadowings[id]) {
            state.foreshadowings[id].appearances = state.foreshadowings[
              id
            ].appearances.filter((a) => a.documentId !== documentId);
            state.foreshadowings[id].updatedAt = new Date().toISOString();
          }
        });
      },
    })),
    {
      name: "sto-link-foreshadowing",
      storage: createJSONStorage(() => storage),
    },
  ),
);
