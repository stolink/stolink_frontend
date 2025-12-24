import { create } from "zustand";
import type { Chapter, ChapterTreeNode } from "@/types";

interface EditorState {
  // Current editing state
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  currentProjectId: string | null;
  currentChapterId: string | null;
  currentSceneId: string | null;
  chapters: Chapter[];

  // Editor content
  content: string;
  isSaving: boolean;
  saveStatus: "saved" | "saving" | "unsaved";
  lastSavedAt: Date | null;

  // Chapter tree
  chapterTree: ChapterTreeNode[];
  expandedNodes: string[]; // Changed from Set<string> for serialization

  // Split view (Phase 2)
  splitView: {
    enabled: boolean;
    direction: "horizontal" | "vertical";
    secondaryDocumentId: string | null;
  };

  // UX Features
  isFocusMode: boolean;

  // Actions
  setCurrentProject: (projectId: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  setCurrentScene: (sceneId: string) => void;
  setChapters: (chapters: Chapter[]) => void;
  setContent: (content: string) => void;
  setSaveStatus: (status: "saved" | "saving" | "unsaved") => void;
  toggleNodeExpanded: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;
  buildChapterTree: (chapters: Chapter[]) => ChapterTreeNode[];

  // Split view actions
  toggleSplitView: () => void;
  setSplitDirection: (direction: "horizontal" | "vertical") => void;
  setSecondaryDocument: (docId: string | null) => void;
  toggleFocusMode: () => void;
  setViewMode: (mode: "editor" | "scrivenings" | "outline" | "corkboard") => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentProjectId: null,
  viewMode: "editor" as const,
  currentChapterId: null,
  currentSceneId: null,
  chapters: [],
  content: "",
  isSaving: false,
  saveStatus: "saved",
  lastSavedAt: null,
  chapterTree: [],
  expandedNodes: [],

  // Split view initial state
  splitView: {
    enabled: false,
    direction: "vertical",
    secondaryDocumentId: null,
  },

  isFocusMode: false,

  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  setCurrentChapter: (chapterId) => {
    const chapter = get().chapters.find((c) => c.id === chapterId);
    set({
      currentChapterId: chapterId,
      currentSceneId: null, // 챕터 변경 시 씬 선택 초기화
      content: chapter?.content || "",
    });
  },

  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),

  setChapters: (chapters) => {
    const tree = get().buildChapterTree(chapters);
    set({ chapters, chapterTree: tree });
  },

  setContent: (content) => set({ content, saveStatus: "unsaved" }),

  setSaveStatus: (status) =>
    set({
      saveStatus: status,
      lastSavedAt: status === "saved" ? new Date() : get().lastSavedAt,
    }),

  // Fixed: Using array instead of Set for serialization compatibility
  toggleNodeExpanded: (nodeId) =>
    set((state) => {
      const index = state.expandedNodes.indexOf(nodeId);
      if (index > -1) {
        return {
          expandedNodes: state.expandedNodes.filter((id) => id !== nodeId),
        };
      } else {
        return { expandedNodes: [...state.expandedNodes, nodeId] };
      }
    }),

  // Helper to check if node is expanded
  isNodeExpanded: (nodeId) => get().expandedNodes.includes(nodeId),

  buildChapterTree: (chapters) => {
    const map = new Map<string, ChapterTreeNode>();
    const roots: ChapterTreeNode[] = [];

    // Create nodes
    chapters.forEach((chapter) => {
      map.set(chapter.id, { ...chapter, children: [] });
    });

    // Build tree with defensive checks (Fixed: removed non-null assertions)
    chapters.forEach((chapter) => {
      const node = map.get(chapter.id);
      if (!node) return; // Defensive check

      if (chapter.parentId) {
        const parent = map.get(chapter.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by order
    const sortChildren = (nodes: ChapterTreeNode[]): ChapterTreeNode[] => {
      return nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => ({ ...node, children: sortChildren(node.children) }));
    };

    return sortChildren(roots);
  },

  // Split view actions
  toggleSplitView: () =>
    set((state) => ({
      splitView: {
        ...state.splitView,
        enabled: !state.splitView.enabled,
      },
    })),

  setSplitDirection: (direction) =>
    set((state) => ({
      splitView: {
        ...state.splitView,
        direction,
      },
    })),

  setSecondaryDocument: (docId) =>
    set((state) => ({
      splitView: {
        ...state.splitView,
        secondaryDocumentId: docId,
      },
    })),

  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
