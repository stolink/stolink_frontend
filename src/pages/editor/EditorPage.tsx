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
import { AnalysisSummaryModal } from "@/components/CharacterGraph/AnalysisSummaryModal";
import { BookReaderModal as ReaderModal } from "@/components/reader/BookReaderModal";
import ExportModal from "@/components/editor/ExportModal";

// Hooks
import { useProject } from "@/hooks/useProjects";
import { useCharacters } from "@/hooks/useCharacters";
import {
  useDocumentMutations,
  useDocument,
  useDocumentContent,
} from "@/hooks/useDocuments";
import { useProjectAnalysis } from "@/hooks/useProjectAnalysis";
import { useEditorHandlers } from "@/pages/editor/hooks/useEditorHandlers";
import { useKeyboardSave } from "@/pages/editor/hooks/useKeyboardSave";

// Refactored Components
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import SnapshotPanel from "@/components/editor/SnapshotPanel";
import ExportGatewayModal from "@/components/editor/ExportGatewayModal";
import DemoHeader from "@/components/editor/DemoHeader";
// SectionStrip removed - minimizing distractions for writer focus
// ScriveningsEditor & OutlineView removed (moved to EditorContent)
// EditorSettingsPanel removed (not currently used)

// Refactored Hooks
import { useEditorHandlers } from "./hooks/useEditorHandlers";
import { useKeyboardSave } from "./hooks/useKeyboardSave";
import { useEditorEffects } from "./hooks/useEditorEffects";

// Refactored Components
import { EditorToolbar } from "./components/EditorToolbar";
import {
  EditorContent,
  type EditorContentHandle,
} from "./components/EditorContent";
import { CreateSectionModal } from "./components/CreateSectionModal";
import { useBulkDocumentContent } from "@/hooks/useDocuments";
import { useCharacters } from "@/hooks/useCharacters";
import { useProjectSSE } from "@/hooks/useProjectSSE";
// Stores & Repositories
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

// Types
import type { Document, DocumentTreeNode } from "@/types/document";
import type {
  AnalysisResultData,
  ConsistencyReport,
} from "@/types/analysisResult";
import type { AnalysisDiff } from "@/types/analysisTypes";
import { type CharacterRelation, type Character } from "@/types/character";

// Utils & Data
import { buildDocumentTree } from "@/repositories/DocumentRepository";
import { calculateAnalysisDiff } from "@/utils/analysisUtils";
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
    } as DemoChapterTreeNode);
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

export default function EditorPage({ isDemo = false }) {
  const [characterCount, setCharacterCount] = useState(0);
  const editorContentRef = useRef<EditorContentHandle>(null);

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
    "editor" | "scrivenings" | "outline" | "corkboard"
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

  const { id: projectIdFromParams } = useParams<{ id: string }>();
  const projectId = isDemo
    ? DEMO_PROJECT_ID
    : (projectIdFromParams ?? DEMO_PROJECT_ID);

  const location = useLocation();
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { flushAndAnalyze, isAnalyzing: _isAnalyzing } = useProjectSSE(
    isDemo ? null : projectId,
    { enabled: !isDemo },
  );
  // TODO: 저장 흐름에 addToBuffer 연결 (useEditorHandlers 확장 필요)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _addToBuffer = useAnalysisBufferStore((state) => state.addToBuffer);

  // 페이지 이탈/브라우저 종료 시 버퍼 flush
  useEffect(() => {
    if (isDemo) return;

    const handleBeforeUnload = () => {
      flushAndAnalyze();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // 컴포넌트 언마운트 시에도 flush
      flushAndAnalyze();
    };
  }, [isDemo, flushAndAnalyze]);

  // ============================================================
  // 미리보기용 로컬 데이터 가져오기 (실시간 반영)
  // ============================================================
  const [showReader, setShowReader] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  // Export & Publish State
  const [showExport, setShowExport] = useState(false);

  const { data: project } = useProject(projectId, { enabled: !isDemo });
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

  // documentTree removed as it was unused and mapToChapterNodes handles it

  const projectTitle = useMemo(() => {
    if (isDemo) return DEMO_PROJECT_TITLE;
    if (project?.title) return project.title;
    return "내 작품";
  }, [project?.title, isDemo]);

  const documents = useMemo(() => {
    return isDemo
      ? (DEMO_CHAPTERS as unknown as Document[])
      : Object.values(localDocuments);
  }, [isDemo, localDocuments]);

  const sidebarChapters = useMemo(() => {
    if (isDemo)
      return previewChapters as unknown as import("@/components/editor/sidebar/types").ChapterNode[];
    return mapToChapterNodes(buildDocumentTree(documents));
  }, [documents, isDemo, previewChapters]);

  const { content: documentContent } = useDocumentContent(
    isDemo ? null : selectedSectionId,
  );

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
      type: string;
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
          type: rel.type,
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
  const queryClient = useQueryClient();
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);
  const [consistencyReport, setConsistencyReport] =
    useState<ConsistencyReport | null>(null);
  const addToBuffer = useAnalysisBufferStore(
    (state) =>
      (state as { addToBuffer: (projectId: string, content: string) => void })
        .addToBuffer,
  );

  const handleAnalysisComplete = useCallback(
    (result: AnalysisResultData) => {
      const diff = calculateAnalysisDiff(characters, graphLinks, result);

      setAnalysisDiff(diff);
      setShowAnalysisSummary(true);

      if (result.consistencyReport) {
        setConsistencyReport(result.consistencyReport);
      }

      queryClient.invalidateQueries({ queryKey: ["characters", projectId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", projectId] });
    },
    [characters, graphLinks, projectId, queryClient],
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

  const { flushAndAnalyze, isAnalyzing, analysisProgress, analysisError } =
    useProjectAnalysis(isDemo ? null : projectId, {
      enabled: !isDemo,
      onAnalysisComplete: handleAnalysisComplete,
    });

  const analysisStatus = useMemo(() => {
    if (isAnalyzing) return "analyzing";
    if (analysisError) return "error";
    if (analysisProgress === 100) return "completed";
    return "idle";
  }, [isAnalyzing, analysisError, analysisProgress]);

  const saveContent = useCallback(
    async (content: string) => {
      if (!selectedSectionId || isDemo) return;
      try {
        useDocumentStore.getState()._setContent(selectedSectionId, content);
      } catch (error) {
        console.error("Failed to save content:", error);
      } finally {
        // setIsSaving removed
      }
    },
    [isDemo, selectedSectionId],
  );

  const saveWithAnalysis = useCallback(
    async (content: string) => {
      if (!selectedSectionId) return;
      await saveContent(content);
      if (!isDemo) {
        addToBuffer(selectedSectionId, content);
        flushAndAnalyze();
      }
    },
    [saveContent, selectedSectionId, isDemo, addToBuffer, flushAndAnalyze],
  );

  const handleManualAnalysis = useCallback(() => {
    if (!selectedSectionId || isDemo) return;
    const content =
      editorContentRef.current?.getContent() || documentContent || "";
    if (content) {
      addToBuffer(selectedSectionId, content);
      flushAndAnalyze();
    }
  }, [
    selectedSectionId,
    isDemo,
    addToBuffer,
    flushAndAnalyze,
    documentContent,
  ]);

  useEffect(() => {
    if (isDemo) return;
    const handleBeforeUnload = () => {
      flushAndAnalyze();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDemo, flushAndAnalyze]);

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
      await updateDocumentMutation.mutateAsync({
        id,
        payload: updates,
      });
    },
    createDocument: async (data) => {
      return createDocumentMutation.mutateAsync(data);
    },
    deleteDocument: async (id) => {
      await deleteDocumentMutation.mutateAsync(id);
    },
    reorderDocuments: async (parentId, orderedIds) => {
      await reorderDocumentsMutation.mutateAsync({
        parentId,
        orderedIds,
      });
    },
    moveDocument: async (itemId, targetFolderId) => {
      await moveDocumentMutation.mutateAsync({
        itemId,
        targetFolderId,
      });
    },
  });

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
  }, [queryDocumentId, initialStateFromRedirect]);

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        isDemo ? "h-screen" : "h-full",
      )}
    >
      {isDemo && (
        <header className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-xs text-center p-2 font-semibold">
          데모 버전입니다. 모든 내용은 저장되지 않습니다.
        </header>
      )}

      {/* Project Header moved to ProjectLayout for global consistency */}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - In focus mode, hover trigger on left edge */}
        {isFocusMode ? (
          <div
            className="group absolute left-0 top-0 bottom-0 z-40"
            style={{ width: "8px" }}
          >
            {/* Hover trigger zone */}
            <div className="absolute inset-0 hover:cursor-pointer" />
            {/* Sidebar appears on hover - with focus mode styling to hide drag handles */}
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-card/95 backdrop-blur-sm border-r border-border shadow-2xl transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out overflow-hidden focus-mode-sidebar">
              <EditorLeftSidebar
                chapters={chapterTreeData}
                selectedChapterId={selectedSectionId || selectedFolderId}
                onSelectChapter={handleSelectFolder}
                onAddChapter={handleAddChapter}
                onRenameChapter={handleRenameChapter}
                onDeleteChapter={handleDeleteChapter}
                onReorderChapter={handleReorderChapter}
                onMoveToFolder={handleMoveToFolder}
                isOpen={true}
              />
            </div>
          </div>
        ) : (
          <EditorLeftSidebar
            chapters={chapterTreeData}
            selectedChapterId={selectedSectionId || selectedFolderId}
            onSelectChapter={handleSelectFolder}
            onAddChapter={handleAddChapter}
            onRenameChapter={handleRenameChapter}
            onDeleteChapter={handleDeleteChapter}
            onReorderChapter={handleReorderChapter}
            onMoveToFolder={handleMoveToFolder}
            isOpen={isSidebarVisible}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-card">
          {/* Toolbar */}
          {/* Toolbar */}
          {!isFocusMode && (
            <EditorToolbar
              isSidebarVisible={isSidebarVisible}
              onToggleSidebar={toggleSidebar}
              currentFolderTitle={currentFolderTitle}
              currentSectionTitle={currentSectionTitle}
              sectionPath={sectionPath}
              isEditingTitle={isEditingTitle}
              editedTitle={editedTitle}
              onEditedTitleChange={setEditedTitle}
              onStartEditTitle={() => {
                if (!isDemo && selectedSectionId) {
                  setEditedTitle(currentSectionTitle);
                  setIsEditingTitle(true);
                }
              }}
              onSaveTitle={() => {
                if (editedTitle.trim() && editedTitle !== currentSectionTitle) {
                  if (selectedSectionId) {
                    updateDocument({
                      title: editedTitle.trim(),
                    });
                  }
                }
                setIsEditingTitle(false);
              }}
              onCancelEditTitle={() => setIsEditingTitle(false)}
              isDemo={isDemo}
              selectedSectionId={selectedSectionId}
              characterCount={characterCount}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              splitViewEnabled={splitView.enabled}
              onToggleSplitView={toggleSplitView}
              onToggleFocusMode={toggleFocusMode}
              isTypewriterMode={isTypewriterMode}
              onToggleTypewriterMode={toggleTypewriterMode}
              rightSidebarOpen={rightSidebarOpen}
              onToggleRightSidebar={toggleRightSidebar}
              onShowReader={isDemo ? undefined : () => setShowReader(true)}
              onToggleSnapshot={() => setShowSnapshot(true)}
              onExport={() => setShowExport(true)}
              analysisStatus={analysisDisplayStatus}
            />
          )}
        </AnimatePresence>

        <main
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isTypewriterMode ? "items-center" : "",
            isFocusMode && "bg-stone-50",
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
            rightSidebarOpen={false}
            onToggleRightSidebar={() => {}}
            onExport={() => setShowExport(true)}
            onShowReader={() => setShowReader(true)}
            analysisStatus={analysisStatus}
            onTriggerAnalysis={handleManualAnalysis}
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
          isOpen={true} // Simplified, always open on larger screens
          onClose={() => {}} // Placeholder
          activeTab="ai" // Default tab
          onTabChange={() => {}} // Placeholder
          documentId={selectedSectionId}
          currentContent={currentContent}
          documentTitle={currentSectionTitle}
          onRestore={(content) => {
            handleContentChange(content);
          }}
          isOpen={showSnapshot}
          onClose={() => setShowSnapshot(false)}
        />

        {/* Export Gateway Modal - 파일 다운로드 / 커뮤니티 배포 선택 */}
        <ExportGatewayModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          currentId={selectedSectionId || undefined}
          characters={characters}
          links={graphLinks}
          documents={documents}
          projectId={projectId}
          projectTitle={project?.title}
          projectDescription={project?.description}
          projectGenre={project?.genre}
          projectCoverImage={project?.coverImage}
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
      {analysisDiff && (
        <AnalysisSummaryModal
          isOpen={showAnalysisSummary}
          onClose={() => setShowAnalysisSummary(false)}
          diff={analysisDiff}
        />
      )}
      {showReader && (
        <ReaderModal
          isOpen={showReader}
          onClose={() => setShowReader(false)}
          chapters={readerChapters}
        />
      )}
      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          projectId={projectId}
          content={documentContent}
          title={document?.title || ""}
          documents={documents}
          characters={characters}
        />
      )}
    </div>
  );
}
