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
import EditorContent, {
  type EditorContentHandle,
} from "@/pages/editor/components/EditorContent";
import EditorLeftSidebar from "@/pages/editor/components/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import { EditorToolbar } from "@/pages/editor/components/EditorToolbar";
import { EditorLoadingSkeleton } from "@/pages/editor/components/EditorLoadingSkeleton";

// Modals & Overlays
import { CreateSectionModal } from "@/pages/editor/components/modals/CreateSectionModal";
import { RenameSectionModal } from "@/pages/editor/components/modals/RenameSectionModal";
import { DeleteSectionModal } from "@/pages/editor/components/modals/DeleteSectionModal";
import { DemoTourModal } from "@/pages/editor/components/DemoTourModal";
import { AnalysisSummaryModal } from "@/components/CharacterGraph/AnalysisSummaryModal";
import { ReaderModal } from "@/components/reader/ReaderModal";
import { ExportModal } from "@/pages/editor/components/modals/ExportModal";

// Hooks
import { useProject } from "@/hooks/useProjects";
import { useCharacters } from "@/hooks/useCharacters";
import { useRelationships } from "@/hooks/useRelationships";
import { useDocumentMutations, useDocument } from "@/hooks/useDocuments";
import { useProjectAnalysis } from "@/hooks/useProjectAnalysis";
import useEditorHandlers from "@/pages/editor/hooks/useEditorHandlers";
import useKeyboardSave from "@/pages/editor/hooks/useKeyboardSave";

// Stores
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { useDocumentStore } from "@/stores/useDocumentStore";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

// Types
import type { Document, DocumentTreeNode } from "@/types/document";
import type {
  AnalysisDiff,
  AnalysisResultData,
  ConsistencyReport,
} from "@/types/analysisResult";

// Utils & Data
import { buildDocumentTree } from "@/lib/tree-utils";
import { calculateAnalysisDiff } from "@/lib/analysis-diff";
import { DEMO_PROJECT_ID, DEMO_CHAPTERS } from "@/data/demoData";
import { type CharacterRelationship } from "@/types/character";
import { cn } from "@/lib/utils";

// Constants
const DEMO_PROJECT_TITLE = "데모 작품: 잉크의 숲";

interface DemoChapterTreeNode extends DocumentTreeNode {
  children?: DemoChapterTreeNode[];
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
    });
  });

  chapters.forEach((chapter) => {
    if (chapter.parentId) {
      map.get(chapter.parentId)?.children?.push(map.get(chapter.id)!);
    } else {
      roots.push(map.get(chapter.id)!);
    }
  });

  return roots;
}

export default function EditorPage({ isDemo = false }) {
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);
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

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [createSectionModalOpen, setCreateSectionModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [splitState, setSplitState] = useState<{
    before: string;
    after: string;
  } | null>(null);

  const typewriterMode = useEditorSettingStore(
    (state) => state.behavior.typewriterMode,
  );
  const isTypewriterMode = typewriterMode !== "off";
  const isFocusMode = useEditorSettingStore(
    (state) => state.behavior.focusMode,
  );
  const performanceMode = useEditorSettingStore(
    (state) => state.behavior.performanceMode,
  );

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
  const allDocuments = useDocumentStore((state) => state.documents);
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

  const documentTree = useMemo(() => {
    if (isDemo) return previewChapters;
    return buildDocumentTree(localDocuments);
  }, [localDocuments, isDemo, previewChapters]);

  const projectTitle = useMemo(() => {
    if (isDemo) return DEMO_PROJECT_TITLE;
    if (project?.title) return project.title;
    return "내 작품";
  }, [project?.title, isDemo]);

  const documents = useMemo(() => {
    return isDemo
      ? (DEMO_CHAPTERS as Document[])
      : (localDocuments as Document[]);
  }, [isDemo, localDocuments]);

  const { data: documentContent, isPending: isDocumentLoading } = useDocument(
    isDemo ? null : selectedSectionId,
  );

  const { data: characters = [] } = useCharacters(projectId, {
    enabled: !isDemo,
  });
  const { data: relationships = [] } = useRelationships(projectId, {
    enabled: !isDemo,
  });

  const graphLinks = useMemo(() => {
    if (isDemo) return [];
    const links: CharacterRelationship[] = relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      type: rel.type,
      strength: rel.strength,
      description: rel.description,
    }));
    return links;
  }, [relationships, isDemo]);

  // ============================================================
  // Analysis Integration (Polling & Buffer)
  // ============================================================
  const queryClient = useQueryClient();
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  const [analysisDiff, setAnalysisDiff] = useState<AnalysisDiff | null>(null);
  const [consistencyReport, setConsistencyReport] =
    useState<ConsistencyReport | null>(null);
  const addToBuffer = useAnalysisBufferStore((state) => state.addToBuffer);

  const handleAnalysisComplete = useCallback(
    (result: AnalysisResultData) => {
      const diff = calculateAnalysisDiff(
        characters,
        graphLinks as CharacterRelationship[],
        result,
      );

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

  const { flushAndAnalyze, analysisStatus } = useProjectAnalysis(
    isDemo ? null : projectId,
    {
      enabled: !isDemo,
      onAnalysisComplete: handleAnalysisComplete,
    },
  );

  const saveContent = useCallback(
    async (content: string) => {
      if (!selectedSectionId || isDemo) return;
      setIsSaving(true);
      try {
        await useDocumentStore
          .getState()
          .updateDocument(selectedSectionId, { content });
      } catch (error) {
        console.error("Failed to save content:", error);
      } finally {
        setTimeout(() => setIsSaving(false), 1000); // UI feedback
      }
    },
    [selectedSectionId, isDemo],
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
  const { createDocument, deleteDocument, reorderDocuments, moveDocument } =
    useDocumentMutations(projectId);

  const onCharacterCountChange = useCallback(
    (count: number) => {
      if (performanceMode) {
        debouncedSetCharacterCount(count);
      } else {
        setCharacterCount(count);
      }
    },
    [debouncedSetCharacterCount, performanceMode],
  );

  const {
    handleSelectSection,
    handleCreateSection,
    handleConfirmCreateSection,
    handleRenameSection,
    handleConfirmRename,
    handleDeleteSection,
    handleConfirmDelete,
    handleMove,
    handleReorder,
    handleContentChange,
    handleSave,
  } = useEditorHandlers({
    documents,
    selectedSectionId,
    setSelectedSectionId,
    createDocument,
    deleteDocument,
    reorderDocuments,
    moveDocument,
    editorContentRef,
    setCreateSectionModalOpen,
    setRenameModal,
    setDeleteModalId,
    setSplitState,
    onSave: saveWithAnalysis,
  });

  useKeyboardSave(handleSave);

  useEffect(() => {
    const docId = queryDocumentId || initialStateFromRedirect;
    if (docId) {
      handleSelectSection(docId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {isSidebarOpen && (
            <EditorLeftSidebar
              projectTitle={projectTitle}
              documents={documentTree}
              selectedSectionId={selectedSectionId}
              onSelectSection={handleSelectSection}
              onCreateSection={handleCreateSection}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
              onMove={handleMove}
              onReorder={handleReorder}
              onClose={() => setIsSidebarOpen(false)}
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
            isSidebarOpen={isSidebarOpen}
            characterCount={characterCount}
            isSaving={isSaving}
            onSave={handleSave}
            onExport={() => setShowExport(true)}
            onReader={() => setShowReader(true)}
            isFocusMode={isFocusMode}
            analysisStatus={analysisStatus}
            onManualAnalysis={handleManualAnalysis}
          />

          <Suspense fallback={<EditorLoadingSkeleton />}>
            <EditorContent
              ref={editorContentRef}
              key={selectedSectionId}
              isLoading={isDocumentLoading && !isDemo}
              content={documentContent}
              onCharacterCountChange={onCharacterCountChange}
              onContentChange={handleContentChange}
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
        onConfirm={handleConfirmCreateSection}
        isSplitMode={!!splitState}
      />
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
          projectId={projectId}
          isDemo={isDemo}
        />
      )}
      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
