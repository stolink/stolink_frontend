import { useCallback, useRef, useEffect } from "react";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { useEditorStore } from "@/stores";
import type { Document } from "@/types/document";

interface UseEditorHandlersOptions {
  isDemo: boolean;
  documents: Document[];
  selectedFolderId: string | null;
  selectedSectionId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  viewMode: "editor" | "scrivenings" | "outline";
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
    order?: number;
  }) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  reorderDocuments: (
    parentId: string | null,
    orderedIds: string[],
  ) => Promise<void>;
  moveDocument: (
    itemId: string,
    targetFolderId: string | null,
  ) => Promise<void>;
  // 통합 뷰 저장 콜백 (섹션 클릭 전 저장용)
  scriveningsSaveAll?: () => Promise<void>;
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
  moveDocument,
  scriveningsSaveAll,
}: UseEditorHandlersOptions) {
  // Refs for save management
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordCountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastContentRef = useRef<{
    documentId: string | null;
    content: string;
  }>({ documentId: null, content: "" });
  const saveContentRef = useRef(saveContent);
  const selectedSectionIdRef = useRef(selectedSectionId);

  // 🔴 Fix: selector로 setSaveStatus 가져와서 ref에 저장 (React 렌더링 사이클 호환)
  const setSaveStatus = useEditorStore((state) => state.setSaveStatus);
  const setSaveStatusRef = useRef(setSaveStatus);
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

  // Sync setSaveStatus ref
  useEffect(() => {
    setSaveStatusRef.current = setSaveStatus;
  }, [setSaveStatus]);

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
    if (isDemo) return;

    // Cancel any pending auto-save timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Save using the stored document ID (not current selection)
    const { documentId, content } = lastContentRef.current;
    if (documentId && content && saveContentRef.current) {
      try {
        await saveContentRef.current(content);
        console.log(`[forceSave] Saved content for document: ${documentId}`);
      } catch (error) {
        console.error("[EditorPage] Force save failed:", error);
      }
    }
  }, [isDemo]);

  // Select folder (Scrivener 방식: 선택만, 뷰 모드는 사용자가 결정)
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
      const isFolder = doc.type === "folder";

      if (isFolder || hasChildren) {
        // 폴더 선택: selectedFolderId만 업데이트
        setSelectedFolderId(id);

        // 단일 뷰일 경우: 첫 번째 자식 섹션 자동 선택
        if (viewMode === "editor" && hasChildren) {
          const firstChild = documents
            .filter((d) => d.parentId === id && d.type === "text")
            .sort((a, b) => a.order - b.order)[0];

          if (firstChild) {
            setSelectedSectionId(firstChild.id);
          } else {
            setSelectedSectionId(id); // 자식 없으면 폴더 자체
          }
        } else {
          setSelectedSectionId(id);
        }
      } else {
        // 섹션(text) 선택: 그 섹션만 선택하고 단일 뷰로 전환
        // 통합 뷰에서 섹션 클릭 시 저장 후 전환 (데이터 손실 방지)
        if (viewMode === "scrivenings" && scriveningsSaveAll) {
          await scriveningsSaveAll();
        }

        setSelectedFolderId(doc.parentId || id);
        setSelectedSectionId(id);
        // 섹션 클릭 시 단일 뷰로 자동 전환
        if (viewMode !== "editor") {
          setViewMode("editor");
        }
      }
    },
    [
      documents,
      forceSave,
      isDemo,
      viewMode,
      setSelectedFolderId,
      setSelectedSectionId,
      setViewMode,
      scriveningsSaveAll,
    ],
  );

  // Select section
  const handleSelectSection = useCallback(
    async (id: string) => {
      if (selectedSectionId !== id) {
        // Cancel any pending auto-save timer before switching
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        // Force save content to the ORIGINAL document (not new selection)
        await forceSave();

        // Reset content ref for new document
        lastContentRef.current = { documentId: null, content: "" };
      }
      setSelectedSectionId(id);
    },
    [selectedSectionId, forceSave, setSelectedSectionId],
  );

  // Content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      // Store both document ID and content together
      const currentDocId = selectedSectionIdRef.current;
      lastContentRef.current = {
        documentId: currentDocId,
        content: content,
      };

      if (isDemo) return;

      // 🔴 Fix: ref를 통해 setSaveStatus 호출 (React 렌더링 사이클 호환)
      setSaveStatusRef.current("unsaved");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        // Validate: only save if still on the same document
        const savedDocId = lastContentRef.current.documentId;
        const nowDocId = selectedSectionIdRef.current;

        if (savedDocId !== nowDocId) {
          console.log(
            `[Auto-save] Cancelled: Document changed from ${savedDocId} to ${nowDocId}`,
          );
          return; // Don't save to wrong document!
        }

        setSaveStatusRef.current("saving");
        try {
          await saveContentRef.current(content);
          setSaveStatusRef.current("saved");
        } catch (error) {
          console.error("[EditorPage] Auto-save failed:", error);
          setSaveStatusRef.current("unsaved");
        }
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
          // Get current metadata and update only wordCount
          const currentDoc = documents.find(
            (d) => d.id === selectedSectionIdRef.current,
          );
          if (currentDoc) {
            const updates: Partial<Document> = {
              metadata: { ...currentDoc.metadata, wordCount: count },
            };
            updateDocumentRef.current(updates);
          }
        }, 1000);
      }
    },
    [isDemo, documents],
  );

  // Add chapter
  const handleAddChapter = useCallback(
    async (
      title: string,
      parentId?: string,
      type: "chapter" | "section" = "chapter",
    ) => {
      if (isDemo) return null;
      return createDocument({
        type: type === "chapter" ? "folder" : "text",
        title,
        parentId,
      });
    },
    [isDemo, createDocument],
  );

  // Add section (형제 섹션만 생성 가능 - 하위 섹션 제거됨)
  const handleAddSection = useCallback(
    async (title?: string) => {
      if (isDemo) return;

      // 1. 섹션 전환 전 현재 콘텐츠 저장 (데이터 손실 방지)
      try {
        // Cancel any pending timer and force save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        await forceSave();
      } catch (error) {
        console.error(
          "[handleAddSection] Failed to save before creating section:",
          error,
        );
        // 저장 실패해도 섹션 생성은 계속 진행 (사용자 경험 우선)
      }

      let parentId: string | null | undefined = selectedFolderId ?? undefined;
      let insertAfterOrder: number | undefined;

      // 형제 섹션: 현재 섹션과 같은 레벨의 다음 위치에 생성
      if (selectedSectionId) {
        const currentDoc = documents.find((d) => d.id === selectedSectionId);
        if (currentDoc) {
          parentId = currentDoc.parentId ?? undefined; // 같은 부모
          insertAfterOrder = currentDoc.order; // 현재 섹션 다음
        }
      }

      const newDoc = await createDocument({
        type: "text",
        title: title || "새 섹션",
        parentId,
        order:
          insertAfterOrder !== undefined ? insertAfterOrder + 1 : undefined,
      });
      if (newDoc) {
        // 2. 새 문서 전환 시 lastContentRef 초기화 (이전 콘텐츠 오염 방지)
        lastContentRef.current = { documentId: null, content: "" };
        setSelectedSectionId(newDoc.id);
      }
      return newDoc;
    },
    [
      isDemo,
      createDocument,
      selectedFolderId,
      selectedSectionId,
      documents,
      setSelectedSectionId,
      forceSave,
    ],
  );

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

  // Move item to different folder (uses optimistic update)
  const handleMoveToFolder = useCallback(
    async (itemId: string, targetFolderId: string | null) => {
      if (isDemo) return;
      await moveDocument(itemId, targetFolderId);
    },
    [isDemo, moveDocument],
  );

  // View mode change with auto-save and state synchronization
  const handleViewModeChange = useCallback(
    async (
      newMode: "editor" | "scrivenings" | "outline",
      currentMode: "editor" | "scrivenings" | "outline",
    ) => {
      // 1. 전환 전 자동 저장
      await forceSave();

      // 통합 뷰에서 전환 시 전체 저장 강제 호출 (데이터 손실 방지)
      if (currentMode === "scrivenings" && scriveningsSaveAll) {
        await scriveningsSaveAll();
      }

      // 2. 뷰 모드별 상태 동기화
      if (newMode === "editor") {
        // 단일 뷰로 전환: 폴더의 첫 번째 섹션 선택
        if (
          (currentMode === "scrivenings" || currentMode === "outline") &&
          selectedFolderId
        ) {
          const firstChild = documents
            .filter((d) => d.parentId === selectedFolderId && d.type === "text")
            .sort((a, b) => a.order - b.order)[0];

          if (firstChild) {
            setSelectedSectionId(firstChild.id);
          } else {
            // 섹션 없으면 폴더 자체 선택
            setSelectedSectionId(selectedFolderId);
          }
        }
      } else if (newMode === "scrivenings" || newMode === "outline") {
        // 통합/개요 뷰로 전환: 현재 섹션의 부모 폴더 선택
        if (currentMode === "editor" && selectedSectionId) {
          const currentDoc = documents.find((d) => d.id === selectedSectionId);
          if (currentDoc?.parentId) {
            setSelectedFolderId(currentDoc.parentId);
          }
        }

        // 폴더 미선택 시 첫 번째 폴더 선택
        if (!selectedFolderId) {
          const firstFolder = documents
            .filter((d) => d.type === "folder" && !d.parentId)
            .sort((a, b) => a.order - b.order)[0];

          if (firstFolder) {
            setSelectedFolderId(firstFolder.id);
          }
        }
      }

      // 3. 뷰 모드 변경
      setViewMode(newMode);
    },
    [
      forceSave,
      selectedFolderId,
      selectedSectionId,
      documents,
      setSelectedFolderId,
      setSelectedSectionId,
      setViewMode,
      scriveningsSaveAll,
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
    handleMoveToFolder,
    handleViewModeChange,
  };
}
