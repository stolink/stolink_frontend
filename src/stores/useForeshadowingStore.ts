import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Foreshadowing,
  ForeshadowingStatus,
  ForeshadowingImportance,
} from "@/types";

interface ForeshadowingStore {
  // === State ===
  foreshadowings: Record<string, Foreshadowing>;

  // === CRUD ===
  createForeshadowing: (input: CreateForeshadowingInput) => Foreshadowing;
  updateForeshadowing: (id: string, updates: UpdateForeshadowingInput) => void;
  deleteForeshadowing: (id: string) => void;

  // === 조회 ===
  getByProject: (projectId: string) => Foreshadowing[];
  getByStatus: (
    projectId: string,
    status: ForeshadowingStatus,
  ) => Foreshadowing[];
  getByScene: (sceneId: string) => Foreshadowing[];
  getByCharacter: (characterId: string) => Foreshadowing[];
  getUnresolved: (projectId: string) => Foreshadowing[];

  // === 상태 변경 ===
  markAsRecovered: (id: string, sceneId: string) => void;
  markAsIgnored: (id: string) => void;

  // === 등장 관리 ===
  addAppearance: (id: string, appearance: ForeshadowingAppearanceInput) => void;
  removeAppearance: (id: string, sceneId: string) => void;
}

interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
  importance?: ForeshadowingImportance;
  relatedCharacterIds?: string[];
}

interface UpdateForeshadowingInput {
  tag?: string;
  description?: string;
  status?: ForeshadowingStatus;
  importance?: ForeshadowingImportance;
  relatedCharacterIds?: string[];
}

interface ForeshadowingAppearanceInput {
  sceneId: string;
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string;
  isRecovery?: boolean;
}

const generateId = () =>
  `fs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useForeshadowingStore = create<ForeshadowingStore>()(
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

    markAsRecovered: (id, sceneId) => {
      set((state) => {
        if (state.foreshadowings[id]) {
          state.foreshadowings[id].status = "recovered";
          // 마지막 appearance를 회수 지점으로 표시
          const lastAppearanceIndex = state.foreshadowings[
            id
          ].appearances.findIndex((a) => a.sceneId === sceneId);
          if (lastAppearanceIndex !== -1) {
            state.foreshadowings[id].appearances[
              lastAppearanceIndex
            ].isRecovery = true;
          }
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

    removeAppearance: (id, sceneId) => {
      set((state) => {
        if (state.foreshadowings[id]) {
          state.foreshadowings[id].appearances = state.foreshadowings[
            id
          ].appearances.filter((a) => a.sceneId !== sceneId);
          state.foreshadowings[id].updatedAt = new Date().toISOString();
        }
      });
    },
  })),
);
