import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Scene,
  CreateSceneInput,
  UpdateSceneInput,
  SceneMetadata,
} from "@/types";

interface SceneStore {
  // === State ===
  scenes: Record<string, Scene>;

  // === Actions ===
  // CRUD
  createScene: (input: CreateSceneInput) => Scene;
  updateScene: (id: string, updates: UpdateSceneInput) => void;
  deleteScene: (id: string) => void;

  // 조회
  getScenesByChapter: (chapterId: string) => Scene[];
  getScenesByProject: (projectId: string) => Scene[];

  // 캐릭터 연결
  addCharacterToScene: (sceneId: string, characterId: string) => void;
  removeCharacterFromScene: (sceneId: string, characterId: string) => void;
  getScenesWithCharacter: (characterId: string) => Scene[];

  // 복선 연결
  addForeshadowingToScene: (sceneId: string, foreshadowingId: string) => void;
  removeForeshadowingFromScene: (
    sceneId: string,
    foreshadowingId: string,
  ) => void;

  // 정렬
  reorderScenes: (chapterId: string, sceneIds: string[]) => void;
}

const generateId = () =>
  `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultMetadata = (): SceneMetadata => ({
  status: "draft",
  keywords: [],
  synopsis: "",
  notes: "",
  wordCount: 0,
  includeInCompile: true,
});

export const useSceneStore = create<SceneStore>()(
  immer((set, get) => ({
    scenes: {},

    createScene: (input) => {
      const newScene: Scene = {
        id: generateId(),
        chapterId: input.chapterId,
        projectId: input.projectId,
        title: input.title,
        content: "",
        order: Object.values(get().scenes).filter(
          (s) => s.chapterId === input.chapterId,
        ).length,
        metadata: {
          ...createDefaultMetadata(),
          synopsis: input.synopsis || "",
        },
        characterIds: input.characterIds || [],
        foreshadowingIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => {
        state.scenes[newScene.id] = newScene;
      });

      return newScene;
    },

    updateScene: (id, updates) => {
      set((state) => {
        if (state.scenes[id]) {
          if (updates.title !== undefined)
            state.scenes[id].title = updates.title;
          if (updates.content !== undefined) {
            state.scenes[id].content = updates.content;
            state.scenes[id].metadata.wordCount = updates.content.length;
          }
          if (updates.order !== undefined)
            state.scenes[id].order = updates.order;
          if (updates.metadata) {
            state.scenes[id].metadata = {
              ...state.scenes[id].metadata,
              ...updates.metadata,
            };
          }
          if (updates.characterIds !== undefined)
            state.scenes[id].characterIds = updates.characterIds;
          if (updates.foreshadowingIds !== undefined)
            state.scenes[id].foreshadowingIds = updates.foreshadowingIds;
          state.scenes[id].updatedAt = new Date().toISOString();
        }
      });
    },

    deleteScene: (id) => {
      set((state) => {
        delete state.scenes[id];
      });
    },

    getScenesByChapter: (chapterId) => {
      return Object.values(get().scenes)
        .filter((scene) => scene.chapterId === chapterId)
        .sort((a, b) => a.order - b.order);
    },

    getScenesByProject: (projectId) => {
      return Object.values(get().scenes).filter(
        (scene) => scene.projectId === projectId,
      );
    },

    addCharacterToScene: (sceneId, characterId) => {
      set((state) => {
        if (
          state.scenes[sceneId] &&
          !state.scenes[sceneId].characterIds.includes(characterId)
        ) {
          state.scenes[sceneId].characterIds.push(characterId);
          state.scenes[sceneId].updatedAt = new Date().toISOString();
        }
      });
    },

    removeCharacterFromScene: (sceneId, characterId) => {
      set((state) => {
        if (state.scenes[sceneId]) {
          state.scenes[sceneId].characterIds = state.scenes[
            sceneId
          ].characterIds.filter((id) => id !== characterId);
          state.scenes[sceneId].updatedAt = new Date().toISOString();
        }
      });
    },

    getScenesWithCharacter: (characterId) => {
      return Object.values(get().scenes).filter((scene) =>
        scene.characterIds.includes(characterId),
      );
    },

    addForeshadowingToScene: (sceneId, foreshadowingId) => {
      set((state) => {
        if (
          state.scenes[sceneId] &&
          !state.scenes[sceneId].foreshadowingIds.includes(foreshadowingId)
        ) {
          state.scenes[sceneId].foreshadowingIds.push(foreshadowingId);
          state.scenes[sceneId].updatedAt = new Date().toISOString();
        }
      });
    },

    removeForeshadowingFromScene: (sceneId, foreshadowingId) => {
      set((state) => {
        if (state.scenes[sceneId]) {
          state.scenes[sceneId].foreshadowingIds = state.scenes[
            sceneId
          ].foreshadowingIds.filter((id) => id !== foreshadowingId);
          state.scenes[sceneId].updatedAt = new Date().toISOString();
        }
      });
    },

    reorderScenes: (chapterId, sceneIds) => {
      set((state) => {
        sceneIds.forEach((sceneId, index) => {
          if (
            state.scenes[sceneId] &&
            state.scenes[sceneId].chapterId === chapterId
          ) {
            state.scenes[sceneId].order = index;
          }
        });
      });
    },
  })),
);
