import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PanelLeft,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Columns,
  Settings,
  Layout,
  List,
  TableProperties,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores";
import { useDemoStore } from "@/stores/useDemoStore";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/editor/TiptapEditor";
import GuidedTour from "@/components/common/GuidedTour";
import {
  DEMO_TOUR_STEPS,
  DEMO_CHAPTERS,
  DEMO_CHAPTER_CONTENTS,
} from "@/data/demoData";
import { useEditorStore } from "@/stores";
import { type ChapterNode } from "@/components/editor/ChapterTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// New Document-based imports
import {
  useDocumentTree,
  useDocumentContent,
  useDocumentMutations,
  useChildDocuments,
  useDocument,
} from "@/hooks/useDocuments";
import {
  SAMPLE_PROJECT_ID,
  initializeSampleDocuments,
} from "@/data/sampleDocuments";

// Refactored Components
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import DemoHeader from "@/components/editor/DemoHeader";
import SectionStrip from "@/components/editor/SectionStrip";
import ScriveningsEditor from "@/components/editor/ScriveningsEditor";
import OutlineView from "@/components/editor/OutlineView";

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
function documentTreeToChapterTree(
  nodes: {
    id: string;
    title: string;
    type: string;
    children: {
      id: string;
      title: string;
      type: string;
      children: unknown[];
    }[];
  }[]
): ChapterNode[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type === "folder" ? "chapter" : "section",
    characterCount: 0,
    isPlot: false,
    children: documentTreeToChapterTree(node.children as typeof nodes),
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
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    isDemo ? "chapter-1" : "doc-chapter-1"
  );
  // selectedSectionId = currently editing section in editor
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    isDemo ? "chapter-1-1" : "doc-sample-1-1"
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

  // Project ID
  const projectId = isDemo ? "demo-project" : SAMPLE_PROJECT_ID;

  // ============================================================
  // Document Hooks (for non-demo mode)
  // ============================================================

  const { tree: documentTree, documents } = useDocumentTree(projectId);
  const { content: documentContent, saveContent } = useDocumentContent(
    isDemo ? null : selectedSectionId
  );
  const { createDocument } = useDocumentMutations(projectId);
  const { updateDocument } = useDocument(isDemo ? null : selectedSectionId);
  // Get child sections of the selected folder
  const { children: sectionDocuments } = useChildDocuments(
    selectedFolderId,
    projectId
  );

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // ============================================================
  // Initialize Sample Data
  // ============================================================

  useEffect(() => {
    if (!isDemo) {
      initializeSampleDocuments();
    }
  }, [isDemo]);

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
  // Handlers
  // ============================================================

  const handleAddChapter = (title: string, parentId?: string) => {
    if (isDemo) return;
    createDocument({
      type: "folder",
      title,
      parentId,
    });
  };

  const handleAddSection = async () => {
    if (isDemo) return;
    const newDoc = await createDocument({
      type: "text",
      title: "새 섹션",
      parentId: selectedFolderId,
    });
    // Auto-select the new section
    if (newDoc) {
      setSelectedSectionId(newDoc.id);
    }
  };

  const handleSelectFolder = (id: string) => {
    // Check if it's a text document (section) - if so, select both folder and section
    const doc = documents.find((d) => d.id === id);
    if (doc?.type === "text" && doc.parentId) {
      setSelectedFolderId(doc.parentId);
      setSelectedSectionId(id);
    } else {
      setSelectedFolderId(id);
      // Auto-select first section if available
      const firstSection = sectionDocuments.find((s) => s.type === "text");
      if (firstSection) {
        setSelectedSectionId(firstSection.id);
      }
    }
  };

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
  };

  // Debounced content saving to reduce latency
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordCountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (isDemo) return;

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 500ms
      saveTimeoutRef.current = setTimeout(() => {
        saveContent(content);
      }, 500);
    },
    [isDemo, saveContent]
  );

  // Store latest values in refs to prevent callback recreation
  const selectedSectionIdRef = useRef(selectedSectionId);
  const updateDocumentRef = useRef(updateDocument);

  useEffect(() => {
    selectedSectionIdRef.current = selectedSectionId;
  }, [selectedSectionId]);

  useEffect(() => {
    updateDocumentRef.current = updateDocument;
  }, [updateDocument]);

  // Handle character count update and sync to document metadata
  // Using refs to prevent callback recreation on every section change
  const handleCharacterCountChange = useCallback(
    (count: number) => {
      setCharacterCount(count);

      // Update document wordCount with debounce (1s to avoid too many updates)
      if (!isDemo && selectedSectionIdRef.current) {
        if (wordCountTimeoutRef.current) {
          clearTimeout(wordCountTimeoutRef.current);
        }
        wordCountTimeoutRef.current = setTimeout(() => {
          updateDocumentRef.current({ metadata: { wordCount: count } });
        }, 1000);
      }
    },
    [isDemo] // Minimal dependencies - use refs for changing values
  );

  // Cleanup timeout on unmount
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isSidebarVisible = isSidebarOpen && !isFocusMode;

  // ============================================================
  // Effects
  // ============================================================

  // Tour Prompt
  useEffect(() => {
    if (isDemo && !isTourCompleted && !isTourActive) {
      const timer = setTimeout(() => setShowTourPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, isTourCompleted, isTourActive]);

  // Ctrl+S Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        console.log("저장됨 (Ctrl+S)");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          isOpen={isSidebarVisible}
          onToggle={toggleSidebar}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Toolbar */}
          {!isFocusMode && (
            <div className="h-12 border-b flex items-center justify-between px-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {!isSidebarVisible && (
                  <button
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors mr-2"
                    title="사이드바 열기"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Breadcrumb Style Title */}
                <div className="flex items-center gap-2 text-sm overflow-hidden bg-stone-50/50 px-3 py-1.5 rounded-full border border-stone-200/50 shadow-sm">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="font-medium truncate max-w-[120px]">
                      {currentFolderTitle || "챕터"}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={() => {
                          if (
                            editedTitle.trim() &&
                            editedTitle !== currentSectionTitle
                          ) {
                            updateDocument({ title: editedTitle.trim() });
                          }
                          setIsEditingTitle(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (
                              editedTitle.trim() &&
                              editedTitle !== currentSectionTitle
                            ) {
                              updateDocument({ title: editedTitle.trim() });
                            }
                            setIsEditingTitle(false);
                          }
                          if (e.key === "Escape") {
                            setIsEditingTitle(false);
                          }
                        }}
                        autoFocus
                        className="font-bold text-stone-800 bg-transparent focus:outline-none min-w-[150px]"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          if (!isDemo && selectedSectionId) {
                            setEditedTitle(currentSectionTitle);
                            setIsEditingTitle(true);
                          }
                        }}
                        className="font-bold text-stone-800 truncate max-w-[200px] hover:text-sage-700 transition-colors"
                        title={isDemo ? "데모 모드" : "클릭하여 제목 편집"}
                      >
                        {currentSectionTitle || "섹션을 선택하세요"}
                      </button>
                    )}
                  </div>
                </div>
                {characterCount > 0 && (
                  <span className="text-xs text-stone-400">
                    ({characterCount.toLocaleString()}자)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-stone-100/80 p-1 rounded-xl border border-stone-200 shadow-inner">
                  <button
                    onClick={() => setViewMode("editor")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold",
                      viewMode === "editor"
                        ? "bg-white text-sage-600 shadow-sm ring-1 ring-black/5"
                        : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
                    )}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>단일</span>
                  </button>
                  <button
                    onClick={() => setViewMode("scrivenings")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold",
                      viewMode === "scrivenings"
                        ? "bg-white text-sage-600 shadow-sm ring-1 ring-black/5"
                        : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>통합</span>
                  </button>
                  <button
                    onClick={() => setViewMode("outline")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold",
                      viewMode === "outline"
                        ? "bg-white text-sage-600 shadow-sm ring-1 ring-black/5"
                        : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
                    )}
                  >
                    <TableProperties className="w-3.5 h-3.5" />
                    <span>개요</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-stone-200 mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSplitView}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      splitView.enabled
                        ? "bg-sage-100 text-sage-700"
                        : "hover:bg-stone-100 text-stone-500"
                    )}
                    title="분할 화면"
                  >
                    <Columns className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFocusMode}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
                    title="집중 모드"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-stone-200 mx-1" />
                <button
                  onClick={toggleRightSidebar}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    rightSidebarOpen
                      ? "bg-sage-100 text-sage-700"
                      : "hover:bg-stone-100 text-stone-500"
                  )}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
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
          <div className="flex-1 overflow-hidden relative">
            {viewMode === "outline" ? (
              <OutlineView folderId={selectedFolderId} projectId={projectId} />
            ) : viewMode === "scrivenings" ? (
              <ScriveningsEditor
                folderId={selectedFolderId}
                projectId={projectId}
                onUpdate={handleCharacterCountChange}
              />
            ) : splitView.enabled ? (
              <ResizablePanelGroup direction={splitView.direction}>
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-y-auto">
                    <TiptapEditor
                      onUpdate={handleCharacterCountChange}
                      onContentChange={handleContentChange}
                      initialContent={currentContent}
                      hideToolbar={isFocusMode}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-y-auto bg-stone-50/50 border-l border-stone-100 flex flex-col">
                    <div className="h-10 border-b flex items-center px-4 bg-stone-50 text-xs text-muted-foreground shrink-0">
                      <span className="font-medium mr-2">참조 화면</span>
                      <span className="text-stone-400">|</span>
                      <span className="ml-2 truncate">
                        {currentSectionTitle}
                      </span>
                    </div>
                    <TiptapEditor
                      initialContent={currentContent}
                      onUpdate={() => {}}
                      readOnly
                      hideToolbar
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full overflow-y-auto">
                <TiptapEditor
                  onUpdate={handleCharacterCountChange}
                  onContentChange={handleContentChange}
                  initialContent={currentContent}
                  hideToolbar={isFocusMode}
                />
              </div>
            )}
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
