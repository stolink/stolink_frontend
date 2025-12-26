import { useState, useEffect, useRef, useCallback } from "react";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import type { Document } from "@/types/document";

interface UseEditorDocumentsOptions {
  projectId: string;
  isDemo: boolean;
  documents: Document[];
  saveContent: (content: string) => Promise<void>;
}

/**
 * EditorPage 문서 관리 커스텀 훅
 * 선택/저장/동기화 로직 캡슐화
 */
export function useEditorDocuments({
  projectId,
  isDemo,
  documents,
  saveContent,
}: UseEditorDocumentsOptions) {
  // 선택 상태
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    isDemo ? "chapter-1" : null
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : null
  );

  // Refs for save management
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordCountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const lastContentRef = useRef<string>("");
  const saveContentRef = useRef(saveContent);
  const selectedSectionIdRef = useRef(selectedSectionId);

  // Sync refs
  useEffect(() => {
    saveContentRef.current = saveContent;
  }, [saveContent]);

  useEffect(() => {
    selectedSectionIdRef.current = selectedSectionId;
  }, [selectedSectionId]);

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

  // Select folder handler
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
      } else {
        if (doc.parentId) {
          setSelectedFolderId(doc.parentId);
        } else {
          setSelectedFolderId(id);
        }
        setSelectedSectionId(id);
      }

      return { isContainer, hasChildren };
    },
    [documents, forceSave, isDemo]
  );

  // Select section handler
  const handleSelectSection = useCallback(
    async (id: string) => {
      if (selectedSectionId !== id) {
        await forceSave();
      }
      setSelectedSectionId(id);
    },
    [selectedSectionId, forceSave]
  );

  // Content change handler with debounce
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
    [isDemo]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (wordCountTimeoutRef.current) {
        clearTimeout(wordCountTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    selectedFolderId,
    selectedSectionId,
    setSelectedFolderId,
    setSelectedSectionId,

    // Refs
    lastContentRef,
    saveContentRef,
    wordCountTimeoutRef,

    // Actions
    forceSave,
    handleSelectFolder,
    handleSelectSection,
    handleContentChange,
  };
}

/**
 * 챕터 CRUD 작업 훅
 */
export function useChapterMutations(projectId: string, isDemo: boolean) {
  const handleRenameChapter = useCallback(
    async (id: string, newTitle: string) => {
      if (isDemo) return;
      const { _update } = useDocumentStore.getState();
      _update(id, { title: newTitle });
    },
    [isDemo]
  );

  const handleDeleteChapter = useCallback(
    async (id: string) => {
      if (isDemo) return;
      const { _delete } = useDocumentStore.getState();
      _delete(id);
    },
    [isDemo]
  );

  const handleDuplicateChapter = useCallback(
    async (id: string) => {
      if (isDemo) return;
      const { documents, _create } = useDocumentStore.getState();
      const original = documents[id];
      if (!original) return;

      const now = new Date().toISOString();
      _create({
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        title: `${original.title} (복사본)`,
        createdAt: now,
        updatedAt: now,
      });
    },
    [isDemo]
  );

  const handleConvertType = useCallback(
    async (id: string, type: "chapter" | "section") => {
      if (isDemo) return;
      const { _updateType } = useDocumentStore.getState();
      _updateType(id, type === "chapter" ? "folder" : "text");
    },
    [isDemo]
  );

  return {
    handleRenameChapter,
    handleDeleteChapter,
    handleDuplicateChapter,
    handleConvertType,
  };
}
