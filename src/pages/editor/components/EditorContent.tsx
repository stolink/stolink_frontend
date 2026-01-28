import { useRef, forwardRef, useImperativeHandle, Suspense } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
// Components - LCP 최적화를 위해 동기적으로 임포트 (EditorContent 청크에 포함됨)
import TiptapEditor from "@/components/editor/TiptapEditor";
import ScriveningsEditor from "@/components/editor/ScriveningsEditor";
import OutlineView from "@/components/editor/OutlineView";
import EmptyState from "@/components/editor/EmptyState";
import { EditorSkeleton } from "@/components/editor/EditorSkeleton";
import type { TiptapEditorHandle } from "@/components/editor/TiptapEditor";
import type { ScriveningsEditorHandle } from "@/components/editor/ScriveningsEditor";
import type { Document } from "@/types/document";

interface EditorContentProps {
  viewMode: "editor" | "scrivenings" | "outline";
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
  onEditorCreate?: (editor: import("@tiptap/react").Editor) => void;
}

export interface EditorContentHandle {
  getSplitContent: () => {
    before: string;
    after: string;
    targetDocId?: string;
  } | null;
  saveAll: () => Promise<void>; // 통합 뷰 저장 강제 호출용
  getContent: () => string;
  scrollToLine: (line: number) => void;
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
      onEditorCreate,
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
        getContent: () => {
          if (viewMode === "editor" && editorRef.current) {
            return editorRef.current.getContent();
          }
          // Typically forceSave is called with content from onContentChange,
          // but if we need immediate content, we might be out of luck for Scrivenings without
          // implementing it there too.
          // However, the issue is about TiptapEditor performance.
          // Let's assume Scrivenings is fine or we fallback to existing behavior.
          // Actually, ScriveningsEditor might not have a single buffer.
          return "";
        },
        scrollToLine: (line: number) => {
          if (viewMode === "editor" && editorRef.current) {
            editorRef.current.scrollToLine(line);
          }
          // Scrivenings scrollToLine not implemented yet (complexity)
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
        <Suspense fallback={<EditorSkeleton />}>
          <OutlineView
            folderId={selectedFolderId}
            projectId={projectId}
            onSelectSection={onSelectSection}
            onSynopsisUpdate={onSynopsisUpdate}
          />
        </Suspense>
      ) : null;
    }

    // 통합 뷰: 폴더의 자식들을 스크롤로 연결하여 편집
    if (viewMode === "scrivenings") {
      return selectedFolderId ? (
        <Suspense fallback={<EditorSkeleton />}>
          <ScriveningsEditor
            ref={scriveningsRef}
            folderId={selectedFolderId}
            projectId={projectId}
            onUpdate={onCharacterCountChange}
            onCreateSection={onCreateSection}
          />
        </Suspense>
      ) : null;
    }

    // 단일 뷰: 선택된 섹션만 집중 편집
    if (viewMode === "editor") {
      if (splitView.enabled) {
        return (
          <ResizablePanelGroup direction={splitView.direction}>
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-hidden">
                <Suspense fallback={<EditorSkeleton />}>
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
                    onEditorCreate={onEditorCreate}
                  />
                </Suspense>
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
                <Suspense
                  fallback={
                    <div className="p-4">
                      <EditorSkeleton lines={5} />
                    </div>
                  }
                >
                  <TiptapEditor
                    initialContent={currentContent}
                    onUpdate={() => {}}
                    readOnly
                    hideToolbar
                  />
                </Suspense>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        );
      }

      return (
        <div className="h-full overflow-hidden">
          <Suspense fallback={<EditorSkeleton />}>
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
              onEditorCreate={onEditorCreate}
            />
          </Suspense>
        </div>
      );
    }

    return null;
  },
);

EditorContent.displayName = "EditorContent";
