import { useRef, forwardRef, useImperativeHandle } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import TiptapEditor, {
  type TiptapEditorHandle,
} from "@/components/editor/TiptapEditor";
import ScriveningsEditor, {
  type ScriveningsEditorHandle,
} from "@/components/editor/ScriveningsEditor";
import OutlineView from "@/components/editor/OutlineView";
import CorkboardView from "@/components/editor/CorkboardView";
import EmptyState from "@/components/editor/EmptyState";
import type { Document } from "@/types/document";

interface EditorContentProps {
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  selectedFolderId: string | null;
  selectedSectionId: string | null; // 섹션 전환 시 에디터 재생성용 key
  projectId: string;
  splitView: { enabled: boolean; direction: "horizontal" | "vertical" };
  isFocusMode: boolean;
  currentContent: string;
  currentSectionTitle: string;
  onCharacterCountChange: (count: number) => void;
  onContentChange: (content: string) => void;
  onCreateSection?: (title: string) => void; // 슬래시 커맨드로 섹션 생성
  onSelectSection?: (id: string) => void; // 개요 뷰에서 섹션 선택
  onSynopsisUpdate?: (id: string, synopsis: string) => void; // 개요 뷰에서 시놉시스 편집
  documents: Document[];
  isDemo: boolean;
  // Infinite Scroll Props
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export interface EditorContentHandle {
  getSplitContent: () => {
    before: string;
    after: string;
    targetDocId?: string;
  } | null;
  saveAll: () => Promise<void>; // 통합 뷰 저장 강제 호출용
}

/**
 * 에디터 메인 콘텐츠 영역 컴포넌트 (Scrivener 방식)
 *
 * 뷰 모드별 역할:
 * - 단일(editor): 하나의 섹션만 집중 편집
 * - 통합(scrivenings): 폴더의 자식들을 스크롤로 연결하여 편집
 * - 개요(outline): 폴더의 자식들을 테이블로 표시
 * - 코르크보드(corkboard): 폴더의 자식들을 인덱스 카드로 표시
 */
export const EditorContent = forwardRef<
  EditorContentHandle,
  EditorContentProps
>(
  (
    {
      viewMode,
      selectedFolderId,
      selectedSectionId,
      projectId,
      splitView,
      isFocusMode,
      currentContent,
      currentSectionTitle,
      onCharacterCountChange,
      onContentChange,
      onCreateSection,
      onSelectSection,
      onSynopsisUpdate,
      documents,
      isDemo,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    },
    ref,
  ) => {
    const editorRef = useRef<TiptapEditorHandle>(null);
    const scriveningsRef = useRef<ScriveningsEditorHandle>(null);

    useImperativeHandle(
      ref,
      () => ({
        getSplitContent: () => {
          if (viewMode === "editor" && editorRef.current) {
            return editorRef.current.getSplitContent();
          }
          if (viewMode === "scrivenings" && scriveningsRef.current) {
            return scriveningsRef.current.getSplitContent();
          }
          return null;
        },
        // 통합 뷰 저장 강제 호출 (섹션 클릭 전 저장용)
        saveAll: async () => {
          if (viewMode === "scrivenings" && scriveningsRef.current) {
            await scriveningsRef.current.saveAll();
          }
        },
      }),
      [viewMode],
    ); // viewMode 의존성 추가

    // Empty State
    if (documents.length === 0 && !isDemo) {
      return <EmptyState />;
    }

    // 개요 뷰: 폴더의 자식들을 테이블로 표시
    if (viewMode === "outline") {
      return selectedFolderId ? (
        <OutlineView
          folderId={selectedFolderId}
          projectId={projectId}
          onSelectSection={onSelectSection}
          onSynopsisUpdate={onSynopsisUpdate}
        />
      ) : null;
    }

    // 코르크보드 뷰: 폴더의 자식들을 인덱스 카드로 표시
    if (viewMode === "corkboard") {
      return selectedFolderId ? (
        <CorkboardView
          folderId={selectedFolderId}
          projectId={projectId}
          onSelectSection={onSelectSection}
        />
      ) : null;
    }

    // 통합 뷰: 폴더의 자식들을 스크롤로 연결하여 편집
    if (viewMode === "scrivenings") {
      return selectedFolderId ? (
        <ScriveningsEditor
          ref={scriveningsRef}
          folderId={selectedFolderId}
          projectId={projectId}
          onUpdate={onCharacterCountChange}
          onCreateSection={onCreateSection}
        />
      ) : null;
    }

    // 단일 뷰: 선택된 섹션만 집중 편집
    if (viewMode === "editor") {
      if (splitView.enabled) {
        return (
          <ResizablePanelGroup direction={splitView.direction}>
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-hidden">
                <TiptapEditor
                  key={selectedSectionId || "default"}
                  ref={editorRef}
                  onUpdate={onCharacterCountChange}
                  onContentChange={onContentChange}
                  onCreateSection={onCreateSection}
                  initialContent={currentContent}
                  documentId={selectedSectionId}
                  sectionTitle={currentSectionTitle}
                  hideToolbar={isFocusMode}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-hidden bg-cloud-50/50 border-l border-cloud-100 flex flex-col">
                <div className="h-10 border-b flex items-center px-4 bg-cloud-50 text-xs text-muted-foreground shrink-0">
                  <span className="font-medium mr-2">참조 화면</span>
                  <span className="text-mocha-400">|</span>
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
        <div className="h-full overflow-hidden">
          <TiptapEditor
            key={selectedSectionId ?? "empty"}
            ref={editorRef}
            onUpdate={onCharacterCountChange}
            onContentChange={onContentChange}
            onCreateSection={onCreateSection}
            initialContent={currentContent}
            documentId={selectedSectionId}
            sectionTitle={currentSectionTitle}
            hideToolbar={isFocusMode}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      );
    }

    return null;
  },
);

EditorContent.displayName = "EditorContent";
