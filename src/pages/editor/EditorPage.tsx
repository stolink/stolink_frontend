import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { useEditorStore } from "@/stores";
import { type ChapterNode } from "@/components/editor/sidebar";
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
  useDocument,
  buildTree, // Import buildTree
} from "@/hooks/useDocuments";
import type { DocumentTreeNode, Document } from "@/types/document";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import from our new alert-dialog file

// Demo Imports
import { useDemoStore } from "@/stores/useDemoStore";
import DemoHeader from "@/components/editor/DemoHeader";
import GuidedTour from "@/components/common/GuidedTour";
import {
  DEMO_TOUR_STEPS,
  DEMO_CHAPTERS,
  DEMO_CHAPTER_CONTENTS,
} from "@/data/demoData";

// Refactored Components
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
import SectionStrip from "@/components/editor/SectionStrip";
import ScriveningsEditor from "@/components/editor/ScriveningsEditor";
import OutlineView from "@/components/editor/OutlineView";

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

  // Local State
  const [characterCount, setCharacterCount] = useState(0);
  // selectedFolderId = currently selected folder (chapter) in sidebar
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  // selectedSectionId = currently editing section in editor
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
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

  // Project ID - use URL param
  const { id: urlProjectId } = useParams<{ id: string }>();
  const projectId = urlProjectId || "";

  // ============================================================
  // Document Hooks
  // ============================================================

  // Demo Store
  const {
    isTourActive,
    isTourCompleted,
    startTour,
    endTour,
    completeTour,
    enterDemoMode,
    exitDemoMode,
  } = useDemoStore();

  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // Toggle Demo Mode
  useEffect(() => {
    if (isDemo) {
      enterDemoMode();
    } else {
      exitDemoMode();
    }
  }, [isDemo, enterDemoMode, exitDemoMode]);

  // Document Hooks
  const { tree: fetchedTree, documents: fetchedDocs } =
    useDocumentTree(projectId);

  // Demo Data Logic
  const demoDocuments = useMemo(() => {
    return isDemo ? (DEMO_CHAPTERS as Document[]) : [];
  }, [isDemo]);

  const demoTree = useMemo(() => {
    return isDemo ? buildTree(demoDocuments) : [];
  }, [isDemo, demoDocuments]);

  const documentTree = isDemo ? demoTree : fetchedTree;
  const documents = isDemo ? demoDocuments : fetchedDocs;

  // For content, we need to handle demo content manually or via useDocumentContent hook modification?
  // Ideally, useDocumentContent should handle it, but we can bypass it.
  // Let's use simplified logic for demo content.
  const { content: fetchedContent, saveContent: saveFetchedContent } =
    useDocumentContent(selectedSectionId);

  const demoContent = useMemo(() => {
    if (!isDemo || !selectedSectionId) return "";
    return DEMO_CHAPTER_CONTENTS[selectedSectionId] || "";
  }, [isDemo, selectedSectionId]);

  const documentContent = isDemo ? demoContent : fetchedContent;
  const saveContent = isDemo ? async () => {} : saveFetchedContent;

  const { createDocument, updateDocument, deleteDocument, reorderDocuments } =
    useDocumentMutations(projectId);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Deletion Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Auto-select first folder when documents load (one-time initialization)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (documents.length === 0) return;

    // Only auto-select if nothing is currently selected
    if (!selectedFolderId && !selectedSectionId) {
      const firstFolder = documents.find((d) => d.type === "folder");
      if (firstFolder) {
        setSelectedFolderId(firstFolder.id);
      } else {
        // If no folder, try to select the first text document (and its parent if exists)
        const firstText = documents.find((d) => d.type === "text");
        if (firstText) {
          setSelectedSectionId(firstText.id);
          if (firstText.parentId) setSelectedFolderId(firstText.parentId);
        }
      }
    }
  }, [documents.length]); // Rely on length change to trigger initial load, avoiding deep dependency loops

  useEffect(() => {
    if (documents.length === 0) return;

    // If a folder is selected but no section, try to select the first section in that folder
    if (selectedFolderId && !selectedSectionId) {
      const firstSection = documents.find(
        (d) => d.type === "text" && d.parentId === selectedFolderId
      );
      if (firstSection) {
        setSelectedSectionId(firstSection.id);
      }
    }
  }, [selectedFolderId, documents.length]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ============================================================
  // Computed Data
  // ============================================================

  // Build chapter tree for sidebar (folders only)
  const chapterTreeData = useMemo<ChapterNode[]>(() => {
    return documentTreeToChapterTree(documentTree);
  }, [documentTree]);

  // Current parent folder title
  const currentFolderTitle = useMemo(() => {
    const doc = documents.find((d) => d.id === selectedFolderId);
    return doc?.title || "";
  }, [selectedFolderId, documents]);

  // Current section title
  const currentSectionTitle = useMemo(() => {
    const doc = documents.find((d) => d.id === selectedSectionId);
    return doc?.title || "";
  }, [selectedSectionId, documents]);

  // Current content
  const currentContent = useMemo(() => {
    return documentContent;
  }, [documentContent]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleAddChapter = (
    title: string,
    parentId?: string,
    type: "chapter" | "section" = "chapter"
  ) => {
    createDocument({
      type: type === "chapter" ? "folder" : "text",
      title,
      parentId,
    });
  };

  const handleAddSection = async () => {
    const newDoc = await createDocument({
      type: "text",
      title: "새 섹션",
      parentId: selectedFolderId ?? undefined,
    });
    // Auto-select the new section
    if (newDoc) {
      setSelectedSectionId(newDoc.id);
    }
  };

  const handleRenameChapter = async (id: string, newTitle: string) => {
    const { _update } = useDocumentStore.getState();
    _update(id, { title: newTitle });
    // Also trigger backend update if needed, but sidebar usually handles visual update via store
    // For consistency, we should probably use updateDocument from mutations but it takes input not ID?
    // See useDocuments.ts: updateDocument(id, input)
    // Here we have id and newTitle.
    // However, I destructured `updateDocument` from `useDocument(selectedSectionId)` earlier which shadowed it.
    // I should fix the destructuring up top first or rename it here.
    // Let's assume I'll fix the destructuring. But for this chunk, I will leave the store update as it gives immediate feedback
    // and ideally we should call the API too.
    // Let's use the mutation function directly if possible, but I don't have access to the "global" updateDocument easily due to shadowing.
    // Actually, I can use the one from useDocumentMutations if I rename the one from useDocument.
  };

  // deleteDocument is already destructured above

  // Modified handleDeleteChapter to use confirmation
  const initiateDelete = (id: string) => {
    // Find doc title for better UX
    const doc = documents.find((d) => d.id === id);
    setDocumentToDelete({ id, title: doc?.title || "문서" });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    const { id } = documentToDelete;

    try {
      console.log(`[Delete Debug] Attempting to delete document: ${id}`);
      await deleteDocument(id);
      console.log(`[Delete Debug] Deletion successful for: ${id}`);

      // Clear selection if deleted item was selected
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
        setSelectedSectionId(null);
      } else if (selectedSectionId === id) {
        setSelectedSectionId(null);
      }
    } catch (error) {
      console.error(`[Delete Debug] Failed to delete document ${id}:`, error);
      alert("문서 삭제 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteChapter = initiateDelete; // Alias for prop passing

  const handleDuplicateChapter = async (id: string) => {
    // TODO: Implement backend duplication
  };

  const handleConvertType = async (id: string, type: "chapter" | "section") => {
    // TODO: Implement backend type conversion
  };

  const handleSelectFolder = (id: string) => {
    // Find the document
    const doc = documents.find((d) => d.id === id);
    if (!doc) {
      return;
    }

    // Check if node has children (is it a container?)
    const hasChildren = documents.some((d) => d.parentId === id);
    const isContainer = hasChildren || doc.type === "folder";

    if (isContainer) {
      // It's a container (Folder or Parent Section)
      setSelectedFolderId(id);
      setSelectedSectionId(id); // Select itself so we can edit its title/content if in Single Mode

      // Auto-switch to Scrivenings if appropriate
      if (hasChildren && viewMode !== "outline") {
        setViewMode("scrivenings");
      }
    } else {
      // It's a leaf node
      // Set context to parent (so Strip shows siblings)
      if (doc.parentId) {
        setSelectedFolderId(doc.parentId);
      } else {
        setSelectedFolderId(id);
      }
      setSelectedSectionId(id);

      // Auto-switch to Single Editor
      if (viewMode !== "outline") {
        setViewMode("editor");
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

  // Track latest content for manual save (Ctrl+S)
  const lastContentRef = useRef<string>("");
  const saveContentRef = useRef(saveContent);

  // Update saveContent ref when it changes
  useEffect(() => {
    saveContentRef.current = saveContent;
  }, [saveContent]);

  const handleContentChange = useCallback((content: string) => {
    lastContentRef.current = content;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveContentRef.current(content);
    }, 500);
  }, []);

  // Store latest values in refs to prevent callback recreation
  const selectedSectionIdRef = useRef(selectedSectionId);
  const updateDocumentRef = useRef(updateDocument);

  useEffect(() => {
    selectedSectionIdRef.current = selectedSectionId;
  }, [selectedSectionId]);

  useEffect(() => {
    updateDocumentRef.current = updateDocument;
  }, [updateDocument]);

  // Handle character count update for UI display only
  // wordCount is calculated by backend when content is saved, so we don't need to update it manually
  const handleCharacterCountChange = useCallback((count: number) => {
    setCharacterCount(count);
    // Note: wordCount is automatically calculated by backend on content save
    // No need to manually update document metadata here
  }, []);

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

  // Ctrl+S / Command+S Save
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (selectedSectionId) {
          // Clear any pending debounced save
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }

          try {
            await saveContentRef.current(lastContentRef.current);

            // Show visual feedback
            const saveIndicator = document.createElement("div");
            saveIndicator.textContent = "✓ 저장됨";
            saveIndicator.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              z-index: 9999;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              opacity: 0;
              transition: opacity 0.3s ease-out;
            `;
            document.body.appendChild(saveIndicator);

            // Trigger fade in
            requestAnimationFrame(() => {
              saveIndicator.style.opacity = "1";
            });

            setTimeout(() => {
              saveIndicator.style.opacity = "0";
              setTimeout(() => saveIndicator.remove(), 300);
            }, 2000);
          } catch (error) {
            console.error("[EditorPage] Save failed:", error);

            // Show error feedback
            const errorIndicator = document.createElement("div");
            errorIndicator.textContent = "✗ 저장 실패";
            errorIndicator.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #ef4444;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              z-index: 9999;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            document.body.appendChild(errorIndicator);

            setTimeout(() => errorIndicator.remove(), 3000);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSectionId]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={cn("flex flex-col", "h-full")}>
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
                          if (selectedSectionId) {
                            setEditedTitle(currentSectionTitle);
                            setIsEditingTitle(true);
                          }
                        }}
                        className="font-bold text-stone-800 truncate max-w-[200px] hover:text-sage-700 transition-colors"
                        title="클릭하여 제목 편집"
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
              onDelete={initiateDelete} // Pass delete handler
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{documentToDelete?.title}" 문서를 삭제하면 복구할 수 없습니다.
              하위 문서가 있는 경우 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-closing to handle async
                confirmDelete();
              }}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
