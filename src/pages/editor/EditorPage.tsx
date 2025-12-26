import { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PanelRightOpen, Minimize2 } from "lucide-react";

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
import { type ChapterNode } from "@/components/editor/sidebar";

// New Document-based imports
import {
  useDocumentTree,
  useDocumentContent,
  useDocumentMutations,
  useDocument,
} from "@/hooks/useDocuments";
import type { DocumentTreeNode } from "@/types/document";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { SAMPLE_PROJECT_ID } from "@/data/sampleDocuments";

// Refactored Components
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import DemoHeader from "@/components/editor/DemoHeader";
import SectionStrip from "@/components/editor/SectionStrip";
// ScriveningsEditor & OutlineView removed (moved to EditorContent)

// Refactored Hooks
import { useEditorHandlers } from "./hooks/useEditorHandlers";
import { useKeyboardSave } from "./hooks/useKeyboardSave";
import { useEditorEffects } from "./hooks/useEditorEffects";

// Refactored Components
import { EditorToolbar } from "./components/EditorToolbar";
import { EditorContent } from "./components/EditorContent";

// ============================================================
// Demo Data Utilities (for demo mode only)
// ============================================================

interface DemoChapterTreeNode {
  id: string;
  title: string;
  type: "part" | "chapter" | "section";
  characterCount?: number;
  isPlot?: boolean;
  children?: DemoChapterTreeNode[];
}

function buildDemoChapterTree(
  chapters: typeof DEMO_CHAPTERS
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
  // Navigation hook
  useNavigate();

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
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  // selectedFolderId = currently selected folder (chapter) in sidebar
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    isDemo ? "chapter-1" : null
  );
  // selectedSectionId = currently editing section in editor
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Editor Store
  const {
    splitView,
    toggleSplitView,
    isFocusMode,
    toggleFocusMode,
    viewMode,
    setViewMode,
  } = useEditorStore();

  // Project ID - use URL param, fallback to SAMPLE_PROJECT_ID for demo/default
  const { id: urlProjectId } = useParams<{ id: string }>();
  const projectId = isDemo ? "demo-project" : urlProjectId || SAMPLE_PROJECT_ID;

  // ============================================================
  // Document Hooks (for non-demo mode)
  // ============================================================

  const { tree: documentTree, documents } = useDocumentTree(projectId);
  const { content: documentContent, saveContent } = useDocumentContent(
    isDemo ? null : selectedSectionId
  );
  const { createDocument } = useDocumentMutations(projectId);
  const { updateDocument } = useDocument(isDemo ? null : selectedSectionId);

  // ============================================================
  // Editor Handlers Hook
  // ============================================================

  const {
    lastContentRef,
    saveContentRef,
    saveTimeoutRef,
    forceSave,
    handleSelectFolder,
    handleSelectSection,
    handleContentChange,
    handleCharacterCountChange,
    handleAddChapter,
    handleAddSection,
    handleRenameChapter,
    handleDeleteChapter,
    handleDuplicateChapter,
    handleConvertType,
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
    createDocument,
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

  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-enable react-hooks/set-state-in-effect */

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
      handleCharacterCountChange(count, setCharacterCount);
    },
    [handleCharacterCountChange]
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

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={cn("flex flex-col", isDemo ? "h-screen" : "h-full")}>
      {/* Demo Header */}
      {isDemo && (
        <DemoHeader isTourCompleted={isTourCompleted} onStartTour={startTour} />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <EditorLeftSidebar
          chapters={chapterTreeData}
          selectedChapterId={selectedSectionId || selectedFolderId}
          onSelectChapter={handleSelectFolder}
          onAddChapter={handleAddChapter}
          onRenameChapter={handleRenameChapter}
          onDeleteChapter={handleDeleteChapter}
          onDuplicateChapter={handleDuplicateChapter}
          onConvertType={handleConvertType}
          isOpen={isSidebarVisible}
          onToggle={toggleSidebar}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Toolbar */}
          {/* Toolbar */}
          {!isFocusMode && (
            <EditorToolbar
              isSidebarVisible={isSidebarVisible}
              onToggleSidebar={toggleSidebar}
              currentFolderTitle={currentFolderTitle}
              currentSectionTitle={currentSectionTitle}
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
              onViewModeChange={setViewMode}
              splitViewEnabled={splitView.enabled}
              onToggleSplitView={toggleSplitView}
              onToggleFocusMode={toggleFocusMode}
              rightSidebarOpen={rightSidebarOpen}
              onToggleRightSidebar={toggleRightSidebar}
            />
          )}

          {/* Focus Mode Exit Button */}
          {isFocusMode && (
            <div className="absolute top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={toggleFocusMode}
                className="bg-white/90 shadow-md border px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 backdrop-blur-sm"
              >
                <Minimize2 className="w-3.5 h-3.5" />
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
              projectId={projectId}
              splitView={splitView}
              isFocusMode={isFocusMode}
              currentContent={currentContent}
              currentSectionTitle={currentSectionTitle}
              onCharacterCountChange={onCharacterCountChange}
              onContentChange={handleContentChange}
              documents={documents}
              isDemo={isDemo}
            />
          </div>

          {/* Section Strip (Bottom) */}
          {!isFocusMode && (
            <SectionStrip
              selectedFolderId={selectedFolderId}
              selectedSectionId={selectedSectionId}
              onSelect={handleSelectSection}
              onAdd={handleAddSection}
              projectId={projectId}
              isDemo={isDemo}
              liveWordCount={characterCount}
            />
          )}
        </main>

        {/* Right Sidebar */}
        <EditorRightSidebar
          isOpen={rightSidebarOpen}
          onClose={toggleRightSidebar}
          activeTab={rightSidebarTab}
          onTabChange={setRightSidebarTab}
        />

        {/* Right Sidebar Toggle (when closed) */}
        {!rightSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightSidebar}
            className="absolute right-2 top-2 z-10"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tour Prompt */}
      {showTourPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
    </div>
  );
}
