import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import ScriveningsEditor from "@/components/editor/ScriveningsEditor";
import OutlineView from "@/components/editor/OutlineView";
import EmptyState from "@/components/editor/EmptyState";
import type { Document } from "@/types/document";

interface EditorContentProps {
  viewMode: "editor" | "scrivenings" | "outline";
  selectedFolderId: string | null;
  projectId: string;
  splitView: { enabled: boolean; direction: "horizontal" | "vertical" };
  isFocusMode: boolean;
  currentContent: string;
  currentSectionTitle: string;
  onCharacterCountChange: (count: number) => void;
  onContentChange: (content: string) => void;
  documents: Document[];
  isDemo: boolean;
}

/**
 * 에디터 메인 콘텐츠 영역 컴포넌트
 * 뷰 모드(단일/통합/개요) 및 분할 화면에 따른 렌더링 분기 처리
 */
export function EditorContent({
  viewMode,
  selectedFolderId,
  projectId,
  splitView,
  isFocusMode,
  currentContent,
  currentSectionTitle,
  onCharacterCountChange,
  onContentChange,
  documents,
  isDemo,
}: EditorContentProps) {
  // Empty State
  if (documents.length === 0 && !isDemo) {
    return <EmptyState />;
  }

  // Outline View
  if (viewMode === "outline") {
    return selectedFolderId ? (
      <OutlineView folderId={selectedFolderId} projectId={projectId} />
    ) : null;
  }

  // Scrivenings View
  if (viewMode === "scrivenings") {
    return selectedFolderId ? (
      <ScriveningsEditor
        folderId={selectedFolderId}
        projectId={projectId}
        onUpdate={onCharacterCountChange}
      />
    ) : null;
  }

  // Single Editor View (with Split option)
  if (viewMode === "editor" || !selectedFolderId) {
    if (splitView.enabled) {
      return (
        <ResizablePanelGroup direction={splitView.direction}>
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto">
              <TiptapEditor
                onUpdate={onCharacterCountChange}
                onContentChange={onContentChange}
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
                <span className="ml-2 truncate">{currentSectionTitle}</span>
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
      );
    }

    return (
      <div className="h-full overflow-y-auto">
        <TiptapEditor
          onUpdate={onCharacterCountChange}
          onContentChange={onContentChange}
          initialContent={currentContent}
          hideToolbar={isFocusMode}
        />
      </div>
    );
  }

  return null;
}
