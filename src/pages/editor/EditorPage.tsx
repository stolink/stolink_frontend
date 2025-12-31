import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores";
import { useDemoStore } from "@/stores/useDemoStore";
import { cn } from "@/lib/utils";
import GuidedTour from "@/components/common/GuidedTour";
import {
  DEMO_TOUR_STEPS,
  DEMO_CHAPTERS,
  DEMO_CHAPTER_CONTENTS,
} from "@/data/demoData";
import { useEditorStore } from "@/stores";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { type ChapterNode } from "@/components/editor/sidebar";
import { BookReaderModal } from "@/components/common/BookReaderModal";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { useProject } from "@/hooks/useProjects";
import type { Document } from "@/types/document";

// New Document-based imports
import {
  useDocumentTree,
  useDocumentContent,
  useDocumentMutations,
  useDocument,
} from "@/hooks/useDocuments";
import type { DocumentTreeNode } from "@/types/document";

import { SAMPLE_PROJECT_ID } from "@/data/sampleDocuments";

// Refactored Components
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import SnapshotPanel from "@/components/editor/SnapshotPanel";
import ExportModal from "@/components/editor/ExportModal";
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

// ============================================================
// Demo Data Utilities (for demo mode only)
// ============================================================

interface DemoChapterTreeNode {
  id: string;
  title: string;
  type: "chapter" | "section"; // chapter = 폴더 역할
  characterCount?: number;
  isPlot?: boolean;
  children?: DemoChapterTreeNode[];
}

function buildDemoChapterTree(
  chapters: typeof DEMO_CHAPTERS,
): DemoChapterTreeNode[] {
  const map = new Map<string, DemoChapterTreeNode>();
  const roots: DemoChapterTreeNode[] = [];

  chapters.forEach((ch) => {
    map.set(ch.id, {
      id: ch.id,
      title: ch.title,
      type: ch.type,
      characterCount: ch.characterCount,
      isPlot: ch.isPlot,
      children: [],
    });
  });

  chapters.forEach((ch) => {
    const node = map.get(ch.id);
    if (!node) return;

    if (ch.parentId) {
      const parent = map.get(ch.parentId);
      if (parent?.children) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const DEMO_CHAPTER_TREE = buildDemoChapterTree(DEMO_CHAPTERS);

// ============================================================
// Types
// ============================================================

interface EditorPageProps {
  isDemo?: boolean;
}

// Convert DocumentTreeNode to ChapterNode for EditorLeftSidebar
function documentTreeToChapterTree(nodes: DocumentTreeNode[]): ChapterNode[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type === "folder" ? "chapter" : "section",
    characterCount: 0,
    isPlot: false,
    children: documentTreeToChapterTree(node.children || []),
  }));
}

// ============================================================
// Main Component
// ============================================================

export default function EditorPage({ isDemo = false }: EditorPageProps) {
  // UI Store
  const {
    rightSidebarOpen,
    toggleRightSidebar,
    rightSidebarTab,
    setRightSidebarTab,
  } = useUIStore();

  // Demo Store
  const { isTourActive, startTour, endTour, completeTour, isTourCompleted } =
    useDemoStore();

  // Local State
  const [characterCount, setCharacterCount] = useState(0);
  const prevCountRef = useRef(0); // 통계용 이전 글자 수
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  // EditorContent ref (통합 뷰 저장 강제 호출용)
  const editorContentRef = useRef<EditorContentHandle>(null);
  // selectedFolderId = currently selected folder (chapter) in sidebar
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    isDemo ? "chapter-1" : null,
  );
  // selectedSectionId = currently editing section in editor
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 복선 생성 후 사이드바 포커스 이동용 상태
  const [newForeshadowingId] = useState<string | null>(null);

  // Editor Store
  const { splitView, toggleSplitView, viewMode, setViewMode } =
    useEditorStore();

  // Editor Setting Store - Typewriter mode & Focus mode
  const typewriterMode = useEditorSettingStore(
    (state) => state.behavior.typewriterMode,
  );
  const toggleTypewriterMode = useEditorSettingStore(
    (state) => state.toggleTypewriterMode,
  );
  const isTypewriterMode = typewriterMode !== "off";

  // Focus mode from settings store
  const isFocusMode = useEditorSettingStore(
    (state) => state.behavior.focusMode,
  );
  const toggleFocusMode = useEditorSettingStore(
    (state) => state.toggleFocusMode,
  );

  // Project ID - use URL param, fallback to SAMPLE_PROJECT_ID for demo/default
  const { id: urlProjectId } = useParams<{ id: string }>();
  const location = useLocation();
  const projectId = isDemo ? "demo-project" : urlProjectId || SAMPLE_PROJECT_ID;

  // Navigation state에서 전달된 섹션 ID (월드 페이지에서 복선 위치 클릭 시)
  const navigationSectionId = (
    location.state as { selectedSectionId?: string } | null
  )?.selectedSectionId;

  // ============================================================
  // 미리보기용 로컬 데이터 가져오기 (실시간 반영)
  // ============================================================
  const [showReader, setShowReader] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showExport, setShowExport] = useState(false);
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
    if (isDemo) return [];
    return (localDocuments ?? [])
      .filter((doc): doc is Document => doc?.type === "text")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content ?? "",
      }));
  }, [localDocuments, isDemo]);

  const projectTitle = useMemo(() => {
    if (isDemo) return "데모 작품";
    if (project?.title) return project.title;
    const folder = localDocuments?.find(
      (doc: Document) => doc.type === "folder",
    );
    return folder?.title || "내 작품";
  }, [project?.title, localDocuments, isDemo]);

  // ============================================================
  // Document Hooks (for non-demo mode)
  // ============================================================

  const { tree: documentTree, documents } = useDocumentTree(projectId);
  const { content: documentContent, saveContent } = useDocumentContent(
    isDemo ? null : selectedSectionId,
  );
  const {
    createDocument,
    updateDocument: updateDocumentMutation,
    deleteDocument,
    reorderDocuments,
    moveDocument,
  } = useDocumentMutations(projectId);
  const { updateDocument } = useDocument(isDemo ? null : selectedSectionId);

  // ============================================================
  // Editor Handlers Hook
  // ============================================================

  const {
    lastContentRef,
    saveContentRef,
    saveTimeoutRef,
    handleSelectFolder,
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
    saveContent,
    updateDocument,
    updateDocumentMutation,
    createDocument,
    deleteDocument,
    reorderDocuments,
    moveDocument,
    // 통합 뷰 저장 콜백: 섹션 클릭 시 저장 후 뷰 전환
    scriveningsSaveAll: useCallback(async () => {
      if (editorContentRef.current) {
        await editorContentRef.current.saveAll();
      }
    }, []),
  });

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // ============================================================
  // Editor Effects Hook
  // ============================================================

  useEditorEffects({
    isDemo,
    documents,
    selectedFolderId,
    selectedSectionId,
    setSelectedFolderId,
    setSelectedSectionId,
    isTourCompleted,
    isTourActive,
    setShowTourPrompt,
  });

  // Navigation state에서 전달된 섹션으로 이동 (월드 페이지에서 복선 위치 클릭 시)
  useEffect(() => {
    if (navigationSectionId && !isDemo) {
      setSelectedSectionId(navigationSectionId);
      // 에디터 뷰 모드로 전환
      if (viewMode !== "editor") {
        setViewMode("editor");
      }
      // state 초기화 (뒤로가기 시 재적용 방지)
      window.history.replaceState({}, document.title);
    }
  }, [navigationSectionId, isDemo, viewMode, setViewMode]);

  // ============================================================
  // Computed Data
  // ============================================================

  // Build chapter tree for sidebar (folders only)
  const chapterTreeData = useMemo<ChapterNode[]>(() => {
    if (isDemo) return DEMO_CHAPTER_TREE;
    return documentTreeToChapterTree(documentTree);
  }, [isDemo, documentTree]);

  // Current parent folder title
  const currentFolderTitle = useMemo(() => {
    if (isDemo) {
      return DEMO_CHAPTERS.find((c) => c.id === selectedFolderId)?.title || "";
    }
    const doc = documents.find((d) => d.id === selectedFolderId);
    return doc?.title || "";
  }, [isDemo, selectedFolderId, documents]);

  // Current section title
  const currentSectionTitle = useMemo(() => {
    if (isDemo) {
      return DEMO_CHAPTERS.find((c) => c.id === selectedSectionId)?.title || "";
    }
    const doc = documents.find((d) => d.id === selectedSectionId);
    return doc?.title || "";
  }, [isDemo, selectedSectionId, documents]);

  // Section breadcrumb path (from root to current section)
  const sectionPath = useMemo(() => {
    if (isDemo || !selectedSectionId) return [];

    const path: Array<{ id: string; title: string }> = [];
    let currentId: string | null = selectedSectionId;

    // Traverse from current section to root
    while (currentId) {
      const doc = documents.find((d) => d.id === currentId);
      if (!doc) break;

      path.unshift({ id: doc.id, title: doc.title });
      currentId = doc.parentId || null;
    }

    return path;
  }, [isDemo, selectedSectionId, documents]);

  // Current content
  const currentContent = useMemo(() => {
    if (isDemo && selectedSectionId) {
      return DEMO_CHAPTER_CONTENTS[selectedSectionId] || "";
    }
    return documentContent;
  }, [isDemo, selectedSectionId, documentContent]);

  // ============================================================
  // Local Helpers (not in hook)
  // ============================================================

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const isSidebarVisible = isSidebarOpen && !isFocusMode;

  // Wrapper for handleCharacterCountChange to include setCharacterCount
  const onCharacterCountChange = useCallback(
    (count: number) => {
      // 집필 통계 기록 (Delta > 0 이고 100자 미만일 때만 - 로딩/붙여넣기 제외)
      const delta = count - prevCountRef.current;
      if (delta > 0 && delta < 100) {
        import("@/stores/useWritingStatsStore").then(
          ({ useWritingStatsStore }) => {
            useWritingStatsStore.getState().recordActivity(delta);
          },
        );
      }
      prevCountRef.current = count;

      handleCharacterCountChange(count, setCharacterCount);
    },
    [handleCharacterCountChange],
  );

  // ============================================================
  // Effects
  // ============================================================

  // Tour Prompt removed (moved to useEditorEffects hook)

  // Ctrl+S / Command+S Save (extracted to hook)
  useKeyboardSave({
    isDemo,
    selectedSectionId,
    saveContentRef,
    lastContentRef,
    saveTimeoutRef,
  });

  // Split & Create Section Logic
  // ============================================================
  // editorContentRef는 상단에서 이미 선언됨 (통합 뷰 저장 강제 호출용)
  const { bulkSaveContent } = useBulkDocumentContent();
  const [createSectionModalOpen, setCreateSectionModalOpen] = useState(false);
  const [splitState, setSplitState] = useState<{
    before: string;
    after: string;
    parentId?: string;
    order?: number;
    title?: string;
    targetDocId?: string;
  } | null>(null);

  const handleRequestAddSection = useCallback(
    (title?: string) => {
      // 1. Split 동작 수행 (Single & Scrivenings)
      if (editorContentRef.current) {
        const split = editorContentRef.current.getSplitContent();

        // 2. 커서 위치 기반 분할 가능 여부 확인
        if (split) {
          // viewMode에 따라 대상 ID 결정
          const targetId = split.targetDocId || selectedSectionId;

          if (targetId) {
            const currentDoc = documents.find((d) => d.id === targetId);
            if (currentDoc) {
              const parentId = currentDoc.parentId ?? undefined;
              const insertAfterOrder = currentDoc.order;

              setSplitState({
                before: split.before,
                after: split.after,
                parentId,
                order:
                  insertAfterOrder !== undefined
                    ? insertAfterOrder + 1
                    : undefined,
                title,
                targetDocId: targetId,
              });
              setCreateSectionModalOpen(true);
              return;
            }
          }
        }
      }

      // 3. Fallback: 분할 불가능하거나 다른 모드일 경우 일반 생성 (모달 오픈)
      setSplitState(null); // 일반 생성 모드
      setCreateSectionModalOpen(true);
    },
    [selectedSectionId, documents],
  );

  const handleConfirmCreateSection = async (title: string) => {
    // 1. Split 모드
    if (splitState) {
      const { before, after, parentId, order, targetDocId } = splitState;
      const updateId = targetDocId || selectedSectionId;

      if (updateId) {
        // Auto-save 타이머 클리어 (경쟁 상태 방지)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // 현재 문서 내용 수동 업데이트 (Before Part) - Single View용 체크
        if (updateId === selectedSectionId) {
          lastContentRef.current = before;
        }

        // 새 문서 생성
        const newDoc = await createDocument({
          type: "text",
          title,
          parentId,
          order,
        });

        if (newDoc) {
          // Bulk Update: 현재 문서(Before) + 새 문서(After)
          await bulkSaveContent({
            [updateId]: before,
            [newDoc.id]: after,
          });

          // 새 문서로 이동 (Scrivenings에서도 강조 표시를 위해 선택)
          setSelectedSectionId(newDoc.id);
        }
      }
    }
    // 2. 일반 생성 모드
    else {
      await handleAddSection(title);
    }

    setCreateSectionModalOpen(false);
    setSplitState(null);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        isDemo ? "h-screen" : "h-full",
      )}
    >
      {/* Demo Header */}
      {isDemo && (
        <DemoHeader isTourCompleted={isTourCompleted} onStartTour={startTour} />
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
            onToggle={toggleSidebar}
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
            />
          )}

          {/* Focus Mode Exit Button */}
          {isFocusMode && (
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={toggleFocusMode}
                className="bg-sage-600 hover:bg-sage-700 shadow-lg border border-sage-500 px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2 transition-all hover:scale-105"
                title="집중 모드 종료 (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
                집중 모드 종료
              </button>
            </div>
          )}

          {/* Editor Content */}
          {/* Editor Content */}
          <div className="flex-1 overflow-hidden relative">
            <EditorContent
              viewMode={viewMode}
              selectedFolderId={selectedFolderId}
              selectedSectionId={selectedSectionId}
              projectId={projectId}
              splitView={splitView}
              isFocusMode={isFocusMode}
              currentContent={currentContent}
              currentSectionTitle={currentSectionTitle}
              onCharacterCountChange={onCharacterCountChange}
              onContentChange={handleContentChange}
              ref={editorContentRef}
              onCreateSection={handleRequestAddSection}
              onSelectSection={(id) => {
                setSelectedSectionId(id);
                setViewMode("editor");
              }}
              onSynopsisUpdate={async (id, synopsis) => {
                await updateDocumentMutation(id, { synopsis });
              }}
              documents={documents}
              isDemo={isDemo}
            />
          </div>

          {/* Section Strip removed - use left sidebar for section navigation
              to minimize distractions and maintain writer focus */}
        </main>

        {/* Right Sidebar - Hidden in focus mode */}
        {!isFocusMode && (
          <EditorRightSidebar
            isOpen={rightSidebarOpen}
            onClose={toggleRightSidebar}
            activeTab={rightSidebarTab}
            onTabChange={setRightSidebarTab}
            documentId={selectedSectionId}
            sectionTitle={currentSectionTitle}
            newForeshadowingId={newForeshadowingId}
            onNavigateToPosition={(docId) => {
              // 해당 섹션으로 이동 (섹션 단위 네비게이션)
              if (docId && docId !== selectedSectionId) {
                setSelectedSectionId(docId);
                // 에디터 뷰 모드로 전환 (통합 뷰에서 단일 뷰로)
                if (viewMode !== "editor") {
                  setViewMode("editor");
                }
              }
            }}
          />
        )}

        {/* Snapshot Panel */}
        <SnapshotPanel
          documentId={selectedSectionId}
          currentContent={currentContent}
          documentTitle={currentSectionTitle}
          onRestore={(content) => {
            handleContentChange(content);
          }}
          isOpen={showSnapshot}
          onClose={() => setShowSnapshot(false)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          content={currentContent}
          title={currentSectionTitle}
        />

        {/* Right Sidebar Toggle removed - already handled in EditorToolbar */}
      </div>

      {/* Tour Prompt */}
      {showTourPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-xl font-bold mb-2">StoLink 둘러보기</h2>
              <p className="text-muted-foreground">
                AI 기반 스토리 관리 플랫폼의 주요 기능을 안내해드릴게요. 약 1분
                정도 소요됩니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTourPrompt(false)}
              >
                나중에 할게요
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowTourPrompt(false);
                  startTour();
                }}
              >
                시작하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      <GuidedTour
        steps={DEMO_TOUR_STEPS}
        isOpen={isTourActive}
        onClose={endTour}
        onComplete={completeTour}
      />

      {/* Book Reader Modal - 로컬 데이터 실시간 반영 */}
      {!isDemo && (
        <BookReaderModal
          isOpen={showReader}
          onClose={() => setShowReader(false)}
          chapters={previewChapters}
          bookTitle={projectTitle}
        />
      )}

      {/* Create Section Modal (Split UI) */}
      <CreateSectionModal
        isOpen={createSectionModalOpen}
        onClose={() => {
          setCreateSectionModalOpen(false);
          setSplitState(null);
        }}
        onCreate={handleConfirmCreateSection}
        defaultTitle={splitState?.title}
      />
    </div>
  );
}
