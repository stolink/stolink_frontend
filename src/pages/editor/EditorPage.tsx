import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  Suspense,
  lazy,
} from "react";
import { useParams, useLocation } from "react-router-dom";
import { debounce, throttle } from "lodash-es";
import { useQueryClient } from "@tanstack/react-query";

// Core Components
const EditorContent = lazy(() =>
  import("@/pages/editor/components/EditorContent").then((m) => ({
    default: m.EditorContent,
  })),
);
import type { EditorContentHandle } from "@/pages/editor/components/EditorContent";
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import { EditorToolbar } from "@/pages/editor/components/EditorToolbar";

import { EditorSkeleton as EditorLoadingSkeleton } from "@/components/editor/EditorSkeleton";

// Modals & Overlays
import { CreateSectionModal } from "@/pages/editor/components/CreateSectionModal";

// Lazy load heavy modals for LCP improvement
const ReaderModal = lazy(() =>
  import("@/components/reader/BookReaderModal").then((m) => ({
    default: m.BookReaderModal,
  })),
);
const ExportGatewayModal = lazy(() =>
  import("@/components/editor/ExportGatewayModal").then((m) => ({
    default: m.ExportGatewayModal,
  })),
);

// Hooks
import { useProject } from "@/hooks/useProjects";
import { useCharacters } from "@/hooks/useCharacters";
import {
  useDocumentMutations,
  useDocument,
  useDocumentContent,
  useDocumentTree,
} from "@/hooks/useDocuments";
import { useProjectAnalysis } from "@/hooks/useProjectAnalysis";
import { useEditorHandlers } from "@/pages/editor/hooks/useEditorHandlers";
import { useKeyboardSave } from "@/pages/editor/hooks/useKeyboardSave";
import { useToast } from "@/hooks/useToast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Stores & Repositories
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { useUIStore } from "@/stores/useUIStore";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { useWritingStatsStore } from "@/stores/useWritingStatsStore";

// Types
import type { Document, DocumentTreeNode } from "@/types/document";
import type { AnalysisResultData } from "@/types/analysisResult";
import { type Character } from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";

// Utils & Data
import { buildDocumentTree } from "@/repositories/DocumentRepository";
import { extractRelationshipLinks } from "@/utils/relationshipMapper";

import { DEMO_CHAPTERS } from "@/data/demoData";
import { cn, getPlainTextLength } from "@/lib/utils";

// Constants
const DEMO_PROJECT_ID = "demo";
const DEMO_PROJECT_TITLE = "데모 작품: 잉크의 숲";

interface DemoChapterTreeNode extends DocumentTreeNode {
  children: DemoChapterTreeNode[];
}

function buildDemoChapterTree(
  chapters: typeof DEMO_CHAPTERS,
): DemoChapterTreeNode[] {
  const map = new Map<string, DemoChapterTreeNode>();
  const roots: DemoChapterTreeNode[] = [];

  chapters.forEach((chapter) => {
    map.set(chapter.id, {
      ...chapter,
      children: [],
      synopsis: "",
      metadata: {
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        keywords: [],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
    } as unknown as DemoChapterTreeNode);
  });

  chapters.forEach((chapter) => {
    if (chapter.parentId) {
      const parent = map.get(chapter.parentId);
      const current = map.get(chapter.id);
      if (parent && current) {
        parent.children.push(current);
      }
    } else {
      const current = map.get(chapter.id);
      if (current) {
        roots.push(current);
      }
    }
  });

  return roots;
}

/**
 * Helper to map DocumentTreeNode to ChapterNode for the sidebar
 */
function mapToChapterNodes(
  nodes: DocumentTreeNode[],
): import("@/components/editor/sidebar/types").ChapterNode[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type === "folder" ? "chapter" : "section",
    characterCount: node.metadata.wordCount,
    status:
      node.metadata.status === "final"
        ? "done"
        : node.metadata.status === "revised"
          ? "revised"
          : "inProgress",
    children: node.children ? mapToChapterNodes(node.children) : [],
  }));
}

interface EditorPageProps {
  isDemo?: boolean;
}

export default function EditorPage({ isDemo: isDemoProp }: EditorPageProps) {
  const { id: projectId = "" } = useParams();
  const location = useLocation();
  const isDemo = isDemoProp ?? projectId === DEMO_PROJECT_ID;

  // Project Data

  const [characterCount, setCharacterCount] = useState(0);
  const editorContentRef = useRef<EditorContentHandle>(null);

  const { toast } = useToast();

  // SPA 페이지 제목 (접근성 - KWCAG 2.4.2)
  useDocumentTitle(isDemo ? "데모 에디터" : "에디터");

  const debouncedSetCharacterCount = useMemo(
    () => debounce((count: number) => setCharacterCount(count), 1000),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSetCharacterCount.cancel();
    };
  }, [debouncedSetCharacterCount]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    isDemo ? "chapter-demo-1" : null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : null,
  );
  const [viewMode, setViewMode] = useState<
    "editor" | "scrivenings" | "outline"
  >("editor");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [createSectionModalOpen, setCreateSectionModalOpen] = useState(false);
  /*
  const [renameModal, setRenameModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [splitState, setSplitState] = useState<{
    before: string;
    after: string;
  } | null>(null);
  */

  const typewriterMode = useEditorSettingStore(
    (state) => state.behavior.typewriterMode,
  );
  const setTypewriterMode = useEditorSettingStore(
    (state) => state.setTypewriterMode,
  );
  const isTypewriterMode = typewriterMode !== "off";
  const isFocusMode = useEditorSettingStore(
    (state) => state.behavior.focusMode,
  );
  const setFocusMode = useEditorSettingStore((state) => state.setFocusMode);
  /* performanceMode removed */

  const initialStateFromRedirect = (
    location.state as { selectedSectionId?: string } | null
  )?.selectedSectionId;

  const queryDocumentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("documentId");
  }, [location.search]);

  // ============================================================
  // 1. Core Data Hooks
  // ============================================================
  const { data: project } = useProject(projectId, { enabled: !isDemo });

  // Fetch document tree from backend and sync to Zustand store
  // This hook fetches from API and syncs to useDocumentStore automatically
  useDocumentTree(isDemo ? "" : projectId);

  const allDocuments = useDocumentStore(
    (state) => (state as { documents: Record<string, Document> }).documents,
  );
  const localDocuments = useMemo(
    () =>
      isDemo
        ? []
        : Object.values(allDocuments).filter(
            (doc) => doc.projectId === projectId,
          ),
    [allDocuments, projectId, isDemo],
  );

  const previewChapters = useMemo(() => {
    if (!isDemo) return [];
    return buildDemoChapterTree(DEMO_CHAPTERS);
  }, [isDemo]);

  const projectTitle = useMemo(() => {
    if (isDemo) return DEMO_PROJECT_TITLE;
    if (project?.title) return project.title;
    return "내 작품";
  }, [project, isDemo]);

  const documents = useMemo(
    () => Object.values(localDocuments),
    [localDocuments],
  );

  // 통계 스토어 연결
  const currentTotalChars = useWritingStatsStore((s) => s.currentTotalChars);

  // 통계 스토어 연결
  const updateDocumentCharCount = useWritingStatsStore(
    (s) => s.updateDocumentCharCount,
  );
  const setDocumentCharCounts = useWritingStatsStore(
    (s) => s.setDocumentCharCounts,
  );

  // 스로틀링된 통계 업데이트 함수 (1초에 한 번만 실행하여 렉 방지)
  const throttledUpdateStats = useMemo(
    () =>
      throttle(
        (
          id: string,
          count: number,
          updateFn: (id: string, count: number) => void,
        ) => {
          updateFn(id, count);
        },
        1000,
        { leading: true, trailing: true },
      ),
    [],
  );

  // 스로틀링된 UI 업데이트 함수 (300ms에 한 번만 실행하여 리렌더링 방지)
  const throttledUIUpdate = useMemo(
    () =>
      throttle(
        (
          count: number,
          callback: (
            count: number,
            setState: React.Dispatch<React.SetStateAction<number>>,
          ) => void,
          setter: React.Dispatch<React.SetStateAction<number>>,
        ) => {
          callback(count, setter);
        },
        500,
        { leading: true, trailing: true },
      ),
    [],
  );

  // 초기 로드 시 모든 문서의 글자수를 스토어에 설정
  useEffect(() => {
    if (!isDemo && documents.length > 0) {
      const counts: Record<string, number> = {};
      documents.forEach((doc) => {
        counts[doc.id] = getPlainTextLength(doc.content);
      });
      setDocumentCharCounts(counts);
    }
  }, [documents, isDemo, setDocumentCharCounts]);

  const sidebarChapters = useMemo(() => {
    if (isDemo)
      return previewChapters as unknown as import("@/components/editor/sidebar/types").ChapterNode[];
    return mapToChapterNodes(buildDocumentTree(documents));
  }, [documents, isDemo, previewChapters]);

  const { content: documentContent, saveContent: saveDocumentContent } =
    useDocumentContent(isDemo ? null : selectedSectionId);

  const { document } = useDocument(isDemo ? null : selectedSectionId);

  const { data: characters = [] } = useCharacters(projectId, {
    enabled: !isDemo,
  });

  const graphLinks = useMemo(() => {
    if (isDemo || !characters.length) return [];
    const extracted = extractRelationshipLinks(characters);
    // Ensure source/target are strings for compatibility with other components (e.g. ExportGatewayModal)
    return extracted.map((link) => ({
      ...link,
      source:
        typeof link.source === "string"
          ? link.source
          : (link.source as { id: string }).id,
      target:
        typeof link.target === "string"
          ? link.target
          : (link.target as { id: string }).id,
    }));
  }, [characters, isDemo]);

  // ============================================================
  // Analysis Integration (Polling & Buffer)
  // ============================================================
  // Analysis Integration (Polling & Buffer)
  // ============================================================
  const queryClient = useQueryClient();

  const { addToBuffer, setAnalysisSnapshot, isJobAcknowledged } =
    useAnalysisBufferStore();

  const setPendingAnalysisResult = useAnalysisBufferStore(
    (s) => s.setPendingAnalysisResult,
  );

  const readerChapters = useMemo(() => {
    interface FlatChapter {
      id: string;
      title: string;
      content: string;
    }
    const flat: FlatChapter[] = [];
    const traverse = (nodes: DocumentTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "text" || node.type === "scrivenings") {
          flat.push({
            id: node.id,
            title: node.title,
            content: node.content || "",
          });
        }
        if (node.children) traverse(node.children);
      });
    };
    traverse(buildDocumentTree(documents));
    return flat;
  }, [documents]);

  const {
    flushAndAnalyze,
    isAnalyzing,
    analysisProgress,
    analysisError,

    resetAnalysis,
    lastConsistencyReport, // Added
  } = useProjectAnalysis(projectId, {
    enabled: !!projectId,
    onAnalysisComplete: async (
      _result: AnalysisResultData | null,
      jobId: string,
    ) => {
      // Note: result might be null if job was found completed on mount
      // We still want to set the pending view flag so WorldPage can show the result.

      // Check if this specific jobId is already acknowledged
      const isAck = isJobAcknowledged(jobId);
      if (isAck) return;

      // Analysis complete.
      // We DO NOT calculate diff here anymore. We defer it to WorldPage.
      // Flag that we have a pending view for the user using persistent store.
      if (projectId) {
        setPendingAnalysisResult(projectId, jobId);
      }

      // 토스트 제거: WorldPage에서 모달로 결과를 보여주므로 중복 알림 불필요

      queryClient.invalidateQueries({ queryKey: ["characters", projectId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", projectId] });
    },
  });

  const consistencyReport = lastConsistencyReport; // Alias for compatibility

  const analysisStatus = useMemo(() => {
    if (analysisProgress === 100) return "completed";
    if (isAnalyzing) return "analyzing";
    if (analysisError) return "error";
    return "idle";
  }, [isAnalyzing, analysisError, analysisProgress]);

  const saveContent = useCallback(
    async (content: string) => {
      if (!selectedSectionId || isDemo) return;
      try {
        // Use the hook's saveContent which handles backend sync
        await saveDocumentContent(content);
        // 분석 버퍼에 추가 (자동 분석 트래킹용)
        addToBuffer(selectedSectionId, content);
      } catch (_error) {
        // Failed to save content
      }
    },
    [isDemo, selectedSectionId, saveDocumentContent, addToBuffer],
  );

  const saveWithAnalysis = useCallback(
    async (content: string) => {
      if (!selectedSectionId) return;
      await saveContent(content);
      addToBuffer(selectedSectionId, content);
    },
    [saveContent, selectedSectionId, addToBuffer],
  );

  const handleManualAnalysis = useCallback(() => {
    if (!selectedSectionId || isDemo || isAnalyzing) return;
    const content =
      editorContentRef.current?.getContent() || documentContent || "";
    if (content) {
      // 버퍼에 먼저 추가하여 최신 해시와 비교할 수 있게 함
      addToBuffer(selectedSectionId, content);

      // 변경 사항이 있는지 확인
      const hasChanges = useAnalysisBufferStore
        .getState()
        .hasUnanalyzedChanges();

      if (hasChanges) {
        try {
          flushAndAnalyze();
        } catch (_error) {
          toast({
            variant: "destructive",
            title: "수동 분석 실패",
            description: "분석 요청 중 오류가 발생했습니다.",
          });
        }
      } else {
        toast({
          title: "분석 완료",
          description: "이미 최신 상태로 분석되어 있습니다.",
          variant: "success",
        });
      }
    }
  }, [
    selectedSectionId,
    isDemo,
    isAnalyzing,
    addToBuffer,
    flushAndAnalyze,
    documentContent,
    toast,
  ]);

  // ============================================================
  // Snapshot Diffing Effect (Editor Side)
  // ============================================================
  const snapshotRef = useRef<{
    characters: Character[];
    links: RelationshipLink[];
  } | null>(null);

  // Capture Snapshot when starting analysis
  const handleStartAnalysisWrapper = useCallback(() => {
    // Capture Snapshot before starting
    const snapshot = {
      characters: [...characters],
      links: [...graphLinks],
    };
    snapshotRef.current = snapshot;

    // Persist to store to share with WorldPage (IDB persistence)
    if (projectId) {
      setAnalysisSnapshot(projectId, snapshot);
      // Reset pending view for new session
      setPendingAnalysisResult(projectId, null);
    }

    handleManualAnalysis();
  }, [
    handleManualAnalysis,
    characters,
    graphLinks,
    projectId,
    setAnalysisSnapshot,
    setPendingAnalysisResult,
  ]);

  // ============================================================
  // UI & Modals State
  // ============================================================
  const [showReader, setShowReader] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // ============================================================
  // Editor Handlers & Mutations
  // ============================================================
  const {
    createDocument: createDocumentMutation,
    deleteDocument: deleteDocumentMutation,
    reorderDocuments: reorderDocumentsMutation,
    moveDocument: moveDocumentMutation,
    updateDocument: updateDocumentMutation,
  } = useDocumentMutations(projectId);

  // useEditorHandlers handles character count internally

  const {
    lastContentRef,
    saveContentRef,
    saveTimeoutRef,
    handleSelectSection,
    handleContentChange,
    handleCharacterCountChange,
    handleAddChapter,
    handleAddSection,
    handleRenameChapter,
    handleDeleteChapter,
    handleReorderChapter,
    handleMoveToFolder,
    handleViewModeChange,
  } = useEditorHandlers({
    isDemo,
    documents,
    selectedFolderId,
    selectedSectionId,
    setSelectedFolderId,
    setSelectedSectionId,
    viewMode,
    setViewMode,
    saveContent: saveWithAnalysis,
    updateDocument: (updates) => {
      if (!selectedSectionId) return;
      useDocumentStore.getState()._update(selectedSectionId, updates);
    },
    updateDocumentMutation: async (id, updates) => {
      await updateDocumentMutation(id, updates);
    },
    createDocument: async (data) => {
      return createDocumentMutation(data);
    },
    deleteDocument: async (id) => {
      await deleteDocumentMutation(id);
    },
    reorderDocuments: async (parentId, orderedIds) => {
      await reorderDocumentsMutation(parentId, orderedIds);
    },
    moveDocument: async (itemId, targetFolderId) => {
      await moveDocumentMutation(itemId, targetFolderId);
    },
  });

  const onNavigateToPosition = useCallback(
    (docId: string) => {
      handleSelectSection(docId);
    },
    [handleSelectSection],
  );

  // Modal Handlers
  const handleCreateSection = (title?: string | React.MouseEvent) => {
    // If title is a string (from SlashCommand), create immediately
    if (typeof title === "string") {
      handleAddSection(title);
    } else {
      // Otherwise (from Button click event), open modal
      setCreateSectionModalOpen(true);
    }
  };
  /*
  const handleRenameSection = (id: string, title: string) =>
    setRenameModal({ id, title });
  const handleDeleteSection = (id: string) => setDeleteModalId(id);
  */

  const handleConfirmCreateSection = async (
    title: string,
    type: "chapter" | "section",
  ) => {
    await handleAddChapter(
      title,
      selectedFolderId || undefined,
      type === "chapter" ? "chapter" : "section",
    );
    setCreateSectionModalOpen(false);
  };

  /*
  const handleConfirmRename = async (newTitle: string) => {
    if (renameModal) {
      await handleRenameChapter(renameModal.id, newTitle);
      setRenameModal(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalId) {
      await handleDeleteChapter(deleteModalId);
      setDeleteModalId(null);
    }
  };
  */

  useKeyboardSave({
    isDemo,
    selectedSectionId,
    saveContentRef,
    lastContentRef,
    saveTimeoutRef,
    getLatestContent: () => editorContentRef.current?.getContent() || "",
  });

  useEffect(() => {
    const docId = queryDocumentId || initialStateFromRedirect;
    if (docId) {
      handleSelectSection(docId);
    }
  }, [queryDocumentId, initialStateFromRedirect, handleSelectSection]);

  // Auto-select first text document when documents load and no section is selected
  // Using requestAnimationFrame to defer the setState call and avoid cascading renders
  useEffect(() => {
    if (isDemo) return;
    if (selectedSectionId) return; // Already have a selection
    if (queryDocumentId || initialStateFromRedirect) return; // Will be handled above

    // Find first text document (not folder)
    const firstTextDoc = documents.find((doc) => doc.type === "text");
    if (firstTextDoc) {
      // Defer state update to avoid cascading renders
      requestAnimationFrame(() => {
        setSelectedSectionId(firstTextDoc.id);
      });
    }
  }, [
    documents,
    isDemo,
    selectedSectionId,
    queryDocumentId,
    initialStateFromRedirect,
  ]);

  const isRightSidebarOpen = useUIStore((state) => state.rightSidebarOpen);
  const setIsRightSidebarOpen = useUIStore(
    (state) => state.setRightSidebarOpen,
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-cloud-50/50 text-foreground", // Unified Desk Background
        isDemo ? "h-screen" : "h-full",
      )}
    >
      {isDemo && (
        <header className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-xs text-center p-2 font-semibold">
          데모 버전입니다. 모든 내용은 저장되지 않습니다.
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desk Texture/Gradient Overlay (Optional) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-stone-100/30 pointer-events-none" />

        {/* EditorLeftSidebar - uses internal width transition for CLS prevention */}
        <EditorLeftSidebar
          chapters={sidebarChapters}
          selectedChapterId={selectedSectionId}
          onSelectChapter={handleSelectSection}
          onAddChapter={handleAddChapter}
          onRenameChapter={handleRenameChapter}
          onDeleteChapter={handleDeleteChapter}
          onMoveToFolder={handleMoveToFolder}
          onReorderChapter={handleReorderChapter}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          projectTitle={projectTitle}
          totalChars={currentTotalChars}
        />

        <main
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 relative z-10 min-w-0",
            isTypewriterMode ? "items-center" : "",
            isFocusMode && "bg-cloud-50",
            // Main area is transparent to show Desk, unless Focus Mode
          )}
        >
          <EditorToolbar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarVisible={isSidebarOpen}
            currentFolderTitle={projectTitle}
            currentSectionTitle={document?.title || ""}
            sectionPath={[]} // Need to calculate or add to hook
            isEditingTitle={false} // State needed
            editedTitle={""} // State needed
            onEditedTitleChange={() => {}}
            onStartEditTitle={() => {}}
            onSaveTitle={() => {}}
            onCancelEditTitle={() => {}}
            isDemo={isDemo}
            selectedSectionId={selectedSectionId}
            characterCount={characterCount}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            splitViewEnabled={false}
            onToggleSplitView={() => {}} // TODO: Implement split view state
            onToggleFocusMode={() => setFocusMode(!isFocusMode)}
            isTypewriterMode={isTypewriterMode}
            onToggleTypewriterMode={() =>
              setTypewriterMode(isTypewriterMode ? "off" : "center")
            }
            rightSidebarOpen={isRightSidebarOpen}
            onToggleRightSidebar={() =>
              setIsRightSidebarOpen(!isRightSidebarOpen)
            }
            onExport={() => setShowExport(true)}
            onShowReader={() => setShowReader(true)}
            analysisStatus={analysisStatus}
            analysisProgress={analysisProgress}
            onTriggerAnalysis={handleStartAnalysisWrapper}
            onResetAnalysis={resetAnalysis}
          />

          {/* CLS 방지: flex-1로 높이 고정, skeleton과 content가 동일한 공간 차지 */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Suspense fallback={<EditorLoadingSkeleton />}>
              <EditorContent
                ref={editorContentRef}
                viewMode={viewMode}
                selectedFolderId={selectedFolderId}
                selectedSectionId={selectedSectionId}
                projectId={projectId}
                splitView={{ enabled: false, direction: "vertical" }}
                isFocusMode={isFocusMode}
                currentContent={documentContent}
                currentSectionTitle={document?.title || ""}
                onCharacterCountChange={(count: number) => {
                  // UI 및 로컬 메타데이터 업데이트 (300ms 스로틀링)
                  throttledUIUpdate(
                    count,
                    handleCharacterCountChange,
                    setCharacterCount,
                  );

                  // 현재 문서의 글자수를 스토어에 저장 (실시간 동기화 - 1000ms 스로틀링)
                  if (!isDemo && selectedSectionId) {
                    throttledUpdateStats(
                      selectedSectionId,
                      count,
                      updateDocumentCharCount,
                    );
                  }
                }}
                onContentChange={handleContentChange}
                onCreateSection={handleCreateSection}
                onSelectSection={handleSelectSection}
                documents={documents}
                isDemo={isDemo}
              />
            </Suspense>
          </div>
        </main>

        <EditorRightSidebar
          documentId={selectedSectionId}
          projectId={projectId}
          sectionTitle={
            documents.find((d) => d.id === selectedSectionId)?.title
          }
          consistencyReport={consistencyReport}
          isAnalyzing={analysisStatus === "analyzing"}
          onRefreshAnalysis={handleStartAnalysisWrapper}
          onNavigateToPosition={onNavigateToPosition}
        />
      </div>

      <CreateSectionModal
        isOpen={createSectionModalOpen}
        onClose={() => setCreateSectionModalOpen(false)}
        onCreate={(title) => handleConfirmCreateSection(title, "section")}
      />
      {/* Missing modals commented out to unblock build */}
      {/*
      {renameModal && (
        <RenameSectionModal
          isOpen={!!renameModal}
          onClose={() => setRenameModal(null)}
          onConfirm={handleConfirmRename}
          currentTitle={renameModal.title}
        />
      )}
      {deleteModalId && (
        <DeleteSectionModal
          isOpen={!!deleteModalId}
          onClose={() => setDeleteModalId(null)}
          onConfirm={handleConfirmDelete}
          title={documents.find((d) => d.id === deleteModalId)?.title || ""}
        />
      )}
      <DemoTourModal
        isOpen={showTourPrompt}
        onClose={() => setShowTourPrompt(false)}
      />
      */}

      {/*
         AnalysisSummaryModal Removed from Editor
       */}
      {showReader && (
        <ReaderModal
          isOpen={showReader}
          onClose={() => setShowReader(false)}
          chapters={readerChapters}
        />
      )}
      {showExport && (
        <ExportGatewayModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          documents={documents}
          projectId={projectId}
          projectTitle={projectTitle}
          projectDescription={project?.description}
          projectGenre={project?.genre}
          projectCoverImage={project?.coverImage}
          currentId={selectedSectionId ?? undefined}
          characters={characters}
          links={graphLinks}
        />
      )}
    </div>
  );
}
