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
import {
  type CharacterRelation,
  type Character,
  type RelationType,
} from "@/types/character";

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
      type: chapter.type === "chapter" ? "folder" : "text",
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
  }, [project, isDemo]);

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

  const { content: documentContent, saveContent: saveDocumentContent } =
    useDocumentContent(isDemo ? null : selectedSectionId);

  const { document } = useDocument(isDemo ? null : selectedSectionId);

  const { data: characters = [] } = useCharacters(projectId, {
    enabled: !isDemo,
  });

  const graphLinks = useMemo(() => {
    if (isDemo) return [];
    // Import RelationshipLink from types/characterGraph instead of defining locally to avoid mismatch
    interface LocalGraphLink {
      id: string;
      source: string;
      target: string;
      type: RelationType;
      strength: number;
      description: string;
    }
    const links: LocalGraphLink[] = [];
    characters.forEach((char: Character) => {
      char.relations?.graph?.forEach((rel: CharacterRelation) => {
        links.push({
          id: `${char._id}-${rel.target}`,
          source: char._id,
          target: rel.target,
          type: (rel.type as RelationType) || "friendly",
          strength: rel.strength,
          description: rel.description,
        });
      });
    });
    // Cast to unknown first to avoid structural mismatch complaints, though properties align
    // calculateAnalysisDiff expects RelationshipLink[]
    return links as unknown as import("@/types/characterGraph").RelationshipLink[];
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
      if (!selectedSectionId) return;

      try {
        if (isDemo) {
          useDocumentStore.getState()._setContent(selectedSectionId, content);
        } else {
          // Use the hook's saveContent which handles backend sync
          await saveDocumentContent(content);
        }
      } catch (error) {
        console.error("Failed to save content:", error);
      }
    },
    [isDemo, selectedSectionId, saveDocumentContent],
  );

  const saveAndBuffer = useCallback(
    async (content: string) => {
      if (!selectedSectionId) return;
      await saveContent(content);
      if (!isDemo) {
        addToBuffer(selectedSectionId, content);
      }
    },
    [saveContent, selectedSectionId, isDemo, addToBuffer],
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
    saveContent: saveAndBuffer,
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

      <div className="flex flex-1 overflow-hidden">
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
          projectId={projectId}
          sectionTitle={
            documents.find((d) => d.id === selectedSectionId)?.title
          }
          consistencyReport={consistencyReport}
          isAnalyzing={analysisStatus === "analyzing"}
          onRefreshAnalysis={handleManualAnalysis}
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
