import { useCallback, useRef, useEffect } from "react";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import type { Document } from "@/types/document";

interface UseEditorHandlersOptions {
  isDemo: boolean;
  documents: Document[];
  selectedFolderId: string | null;
  selectedSectionId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  setViewMode: (mode: "editor" | "scrivenings" | "outline") => void;
  saveContent: (content: string) => Promise<void>;
  updateDocument: (updates: Partial<Document>) => void;
  updateDocumentMutation: (
    id: string,
    updates: Partial<Document>,
  ) => Promise<unknown>;
  createDocument: (data: {
    type: "folder" | "text";
    title: string;
    parentId?: string;
  }) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  reorderDocuments: (
    parentId: string | null,
    orderedIds: string[],
  ) => Promise<void>;
}

/**
 * EditorPage 핸들러 커스텀 훅
 * 모든 이벤트 핸들러와 관련 로직을 캡슐화
 */
export function useEditorHandlers({
  isDemo,
  documents,
  selectedFolderId,
  selectedSectionId,
  setSelectedFolderId,
  setSelectedSectionId,
  viewMode,
  setViewMode,
  saveContent,
  updateDocument,
  updateDocumentMutation,
  createDocument,
  deleteDocument,
  reorderDocuments,
}: UseEditorHandlersOptions) {
  // Refs for save management
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordCountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastContentRef = useRef<string>("");
  const saveContentRef = useRef(saveContent);
  const selectedSectionIdRef = useRef(selectedSectionId);
  const updateDocumentRef = useRef(updateDocument);

  // Sync refs
  useEffect(() => {
    saveContentRef.current = saveContent;
  }, [saveContent]);

  useEffect(() => {
    selectedSectionIdRef.current = selectedSectionId;
  }, [selectedSectionId]);

  useEffect(() => {
    updateDocumentRef.current = updateDocument;
  }, [updateDocument]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (wordCountTimeoutRef.current)
        clearTimeout(wordCountTimeoutRef.current);
    };
  }, []);

  // Force save current content
  const forceSave = useCallback(async () => {
    if (isDemo || !selectedSectionIdRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (lastContentRef.current && saveContentRef.current) {
      console.log("[EditorPage] Force saving before switch/unmount");
      try {
        await saveContentRef.current(lastContentRef.current);
      } catch (error) {
        console.error("[EditorPage] Force save failed:", error);
      }
    }
  }, [isDemo]);

  // Select folder
  const handleSelectFolder = useCallback(
    async (id: string) => {
      await forceSave();

      const doc = documents.find((d) => d.id === id);
      if (!doc) {
        if (isDemo) {
          setSelectedFolderId(id);
          setSelectedSectionId(id);
        }
        return;
      }

      const hasChildren = documents.some((d) => d.parentId === id);
      const isContainer = hasChildren || doc.type === "folder";

      if (isContainer) {
        setSelectedFolderId(id);
        setSelectedSectionId(id);
        if (hasChildren && viewMode !== "outline") {
          setViewMode("scrivenings");
        }
      } else {
        setSelectedFolderId(doc.parentId || id);
        setSelectedSectionId(id);
        if (viewMode !== "outline") {
          setViewMode("editor");
        }
      }
    },
    [
      documents,
      forceSave,
      isDemo,
      viewMode,
      setViewMode,
      setSelectedFolderId,
      setSelectedSectionId,
    ],
  );

  // Select section
  const handleSelectSection = useCallback(
    async (id: string) => {
      if (selectedSectionId !== id) {
        await forceSave();
      }
      setSelectedSectionId(id);
    },
    [selectedSectionId, forceSave, setSelectedSectionId],
  );

  // Content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      lastContentRef.current = content;
      if (isDemo) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveContentRef.current(content);
      }, 500);
    },
    [isDemo],
  );

  // Character count change with debounce
  const handleCharacterCountChange = useCallback(
    (count: number, setCharacterCount: (c: number) => void) => {
      setCharacterCount(count);

      if (!isDemo && selectedSectionIdRef.current) {
        if (wordCountTimeoutRef.current) {
          clearTimeout(wordCountTimeoutRef.current);
        }
        wordCountTimeoutRef.current = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          updateDocumentRef.current({ metadata: { wordCount: count } as any });
        }, 1000);
      }
    },
    [isDemo],
  );

  // Add chapter
  const handleAddChapter = useCallback(
    (
      title: string,
      parentId?: string,
      type: "chapter" | "section" = "chapter",
    ) => {
      if (isDemo) return;
      createDocument({
        type: type === "chapter" ? "folder" : "text",
        title,
        parentId,
      });
    },
    [isDemo, createDocument],
  );

  // Add section
  const handleAddSection = useCallback(async () => {
    if (isDemo) return;
    const newDoc = await createDocument({
      type: "text",
      title: "새 섹션",
      parentId: selectedFolderId ?? undefined,
    });
    if (newDoc) {
      setSelectedSectionId(newDoc.id);
    }
  }, [isDemo, createDocument, selectedFolderId, setSelectedSectionId]);

  // Rename chapter
  const handleRenameChapter = useCallback(
    async (id: string, newTitle: string) => {
      if (isDemo) return;

      const { _update, documents: currentDocs } = useDocumentStore.getState();
      const previousTitle = currentDocs[id]?.title;

      // 1. Optimistic Update: Update local store immediately for instant UI feedback
      _update(id, { title: newTitle });

      // 2. Sync with Backend
      try {
        await updateDocumentMutation(id, { title: newTitle });
      } catch (error) {
        console.error("Failed to rename chapter:", error);
        // 3. Rollback on failure: Revert to previous title if API fails
        if (previousTitle !== undefined) {
          _update(id, { title: previousTitle });
        }
      }
    },
    [isDemo, updateDocumentMutation],
  );

  // Delete chapter
  const handleDeleteChapter = useCallback(
    async (id: string) => {
      if (isDemo) return;

      // Call backend mutation (which handles local store update and API call)
      await deleteDocument(id);

      // Handle navigation if current selection was deleted
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
        setSelectedSectionId(null);
      } else if (selectedSectionId === id) {
        setSelectedSectionId(null);
      }
    },
    [
      isDemo,
      deleteDocument,
      selectedFolderId,
      selectedSectionId,
      setSelectedFolderId,
      setSelectedSectionId,
    ],
  );

  return {
    // Refs (exposed for keyboard handler)
    lastContentRef,
    saveContentRef,
    saveTimeoutRef,

    // Handlers
    forceSave,
    handleSelectFolder,
    handleSelectSection,
    handleContentChange,
    handleCharacterCountChange,
    handleAddChapter,
    handleAddSection,
    handleRenameChapter,
    handleDeleteChapter,
    handleReorderChapter: reorderDocuments,
  };
}
