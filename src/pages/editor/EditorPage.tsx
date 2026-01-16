import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useParams, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { debounce } from "lodash-es";
import { useQueryClient } from "@tanstack/react-query";

// Core Components
import {
  EditorContent,
  type EditorContentHandle,
} from "@/pages/editor/components/EditorContent";
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import { EditorToolbar } from "@/pages/editor/components/EditorToolbar";
import { EditorSkeleton as EditorLoadingSkeleton } from "@/components/editor/EditorSkeleton";

// Modals & Overlays
import { CreateSectionModal } from "@/pages/editor/components/CreateSectionModal";
// import { RenameSectionModal } from "@/pages/editor/components/modals/RenameSectionModal";
// import { DeleteSectionModal } from "@/pages/editor/components/modals/DeleteSectionModal";
// import { DemoTourModal } from "@/pages/editor/components/DemoTourModal";
// import { AnalysisSummaryModal } from "@/components/CharacterGraph/AnalysisSummaryModal"; // Removed from Editor
import { BookReaderModal as ReaderModal } from "@/components/reader/BookReaderModal";
import { ExportGatewayModal } from "@/components/editor/ExportGatewayModal";

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

// Stores & Repositories
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { useUIStore } from "@/stores/useUIStore";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

// Types
import type { Document, DocumentTreeNode } from "@/types/document";
import type { AnalysisResultData } from "@/types/analysisResult";
import {
  type CharacterRelation,
  type Character,
  type RelationType,
} from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";

// Utils & Data
import { buildDocumentTree } from "@/repositories/DocumentRepository";

import { DEMO_CHAPTERS } from "@/data/demoData";
import { cn } from "@/lib/utils";

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
  const isTypewriterMode = typewriterMode !== "off";
  const isFocusMode = useEditorSettingStore(
    (state) => state.behavior.focusMode,
  );
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
    if (isDemo) return [];
    interface GraphLink {
      id: string;
      source: string;
      target: string;
      type: RelationType;
      strength: number;
      description: string;
    }
    const links: GraphLink[] = [];
    characters.forEach((char: Character) => {
      char.relations?.graph?.forEach((rel: CharacterRelation) => {
        links.push({
          id: `${char._id}-${rel.target}`,
          source: char._id,
          target: rel.target,
          type: rel.type as RelationType,
          strength: rel.strength,
          description: rel.description,
        });
      });
    });
    return links;
  }, [characters, isDemo]);

  // ============================================================
  // Analysis Integration (Polling & Buffer)
  // ============================================================
  // Analysis Integration (Polling & Buffer)
  // ============================================================
  const queryClient = useQueryClient();
  // const [showAnalysisSummary, setShowAnalysisSummary] = useState(false); // Moved to World
  // const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);

  // consistencyReport state removed in favor of store persistence
  const {
    addToBuffer,
    setPendingViewJobId,
    setAnalysisSnapshot,
    isJobAcknowledged,
  } = useAnalysisBufferStore();

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
        setPendingViewJobId(jobId);
      }

      toast({
        title: "분석 완료",
        description: "세계관 탭에서 결과를 확인해주세요.",
        variant: "success",
      });

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
      setPendingViewJobId(null);
    }

    handleManualAnalysis();
  }, [
    handleManualAnalysis,
    characters,
    graphLinks,
    projectId,
    setAnalysisSnapshot,
    setPendingViewJobId,
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
  const handleCreateSection = () => setCreateSectionModalOpen(true);
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

        <AnimatePresence>
          {isSidebarOpen && (
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
              onToggle={() => setIsSidebarOpen(false)}
              projectTitle={projectTitle}
              totalChars={
                Object.values(documents).reduce(
                  (acc, doc) => acc + (doc.content?.length || 0),
                  0,
                ) || 0
              }
            />
          )}
        </AnimatePresence>

        <main
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 relative z-10",
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
            onToggleSplitView={() => {}}
            onToggleFocusMode={() => {}}
            isTypewriterMode={isTypewriterMode}
            onToggleTypewriterMode={() => {}}
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
              onCharacterCountChange={(count: number) =>
                handleCharacterCountChange(count, setCharacterCount)
              }
              onContentChange={handleContentChange}
              onCreateSection={handleCreateSection}
              onSelectSection={handleSelectSection}
              documents={documents}
              isDemo={isDemo}
            />
          </Suspense>
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
