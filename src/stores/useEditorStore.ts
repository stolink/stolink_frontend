import { create } from 'zustand';
import type { Chapter, ChapterTreeNode } from '@/types';

interface EditorState {
  // Current editing state
  currentProjectId: string | null;
  currentChapterId: string | null;
  chapters: Chapter[];

  // Editor content
  content: string;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  lastSavedAt: Date | null;

  // Chapter tree
  chapterTree: ChapterTreeNode[];
  expandedNodes: Set<string>;

  // Actions
  setCurrentProject: (projectId: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  setChapters: (chapters: Chapter[]) => void;
  setContent: (content: string) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
  toggleNodeExpanded: (nodeId: string) => void;
  buildChapterTree: (chapters: Chapter[]) => ChapterTreeNode[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentProjectId: null,
  currentChapterId: null,
  chapters: [],
  content: '',
  isSaving: false,
  saveStatus: 'saved',
  lastSavedAt: null,
  chapterTree: [],
  expandedNodes: new Set<string>(),

  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  setCurrentChapter: (chapterId) => {
    const chapter = get().chapters.find(c => c.id === chapterId);
    set({
      currentChapterId: chapterId,
      content: chapter?.content || '',
    });
  },

  setChapters: (chapters) => {
    const tree = get().buildChapterTree(chapters);
    set({ chapters, chapterTree: tree });
  },

  setContent: (content) => set({ content, saveStatus: 'unsaved' }),

  setSaveStatus: (status) => set({
    saveStatus: status,
    lastSavedAt: status === 'saved' ? new Date() : get().lastSavedAt,
  }),

  toggleNodeExpanded: (nodeId) => set((state) => {
    const newExpanded = new Set(state.expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    return { expandedNodes: newExpanded };
  }),

  buildChapterTree: (chapters) => {
    const map = new Map<string, ChapterTreeNode>();
    const roots: ChapterTreeNode[] = [];

    // Create nodes
    chapters.forEach(chapter => {
      map.set(chapter.id, { ...chapter, children: [] });
    });

    // Build tree
    chapters.forEach(chapter => {
      const node = map.get(chapter.id)!;
      if (chapter.parentId && map.has(chapter.parentId)) {
        map.get(chapter.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order
    const sortChildren = (nodes: ChapterTreeNode[]): ChapterTreeNode[] => {
      return nodes
        .sort((a, b) => a.order - b.order)
        .map(node => ({ ...node, children: sortChildren(node.children) }));
    };

    return sortChildren(roots);
  },
}));
