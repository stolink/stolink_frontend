import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

interface ChapterState {
  chapters: Record<string, Chapter>;

  // Actions
  createChapter: (input: CreateChapterInput) => string;
  updateChapter: (id: string, input: UpdateChapterInput) => void;
  deleteChapter: (id: string) => void;
  reorderChapters: (projectId: string, newOrderIds: string[]) => void;

  // Selectors
  getChaptersByProject: (projectId: string) => Chapter[];
}

export const useChapterStore = create<ChapterState>()(
  persist(
    (set, get) => ({
      chapters: {},

      createChapter: (input) => {
        const id = uuidv4();
        const now = new Date().toISOString();

        const existingChapters = Object.values(get().chapters).filter(
          (c) =>
            c.projectId === input.projectId && c.parentId === input.parentId,
        );
        const order = existingChapters.length;

        const newChapter: Chapter = {
          id,
          projectId: input.projectId,
          title: input.title,
          content: "",
          order,
          type: input.type,
          parentId: input.parentId,
          characterCount: 0,
          isPlot: false,
          extras: input.extras,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          chapters: { ...state.chapters, [id]: newChapter },
        }));

        return id;
      },

      updateChapter: (id, input) => {
        set((state) => {
          const chapter = state.chapters[id];
          if (!chapter) return state;

          return {
            chapters: {
              ...state.chapters,
              [id]: {
                ...chapter,
                ...input,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      deleteChapter: (id) => {
        set((state) => {
          const newChapters = Object.fromEntries(
            Object.entries(state.chapters).filter(([key]) => key !== id),
          );
          return { chapters: newChapters };
        });
      },

      reorderChapters: (projectId, newOrderIds) => {
        set((state) => {
          const updatedChapters = { ...state.chapters };
          newOrderIds.forEach((chapterId, index) => {
            if (updatedChapters[chapterId]) {
              updatedChapters[chapterId] = {
                ...updatedChapters[chapterId],
                order: index,
              };
            }
          });
          return { chapters: updatedChapters };
        });
      },

      getChaptersByProject: (projectId) => {
        return Object.values(get().chapters)
          .filter((c) => c.projectId === projectId)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: "sto-link-chapter-storage",
    },
  ),
);
