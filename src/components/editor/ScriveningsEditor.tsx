import { useEditor, EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionDivider } from "./extensions/SectionDivider";
import { CharacterMention } from "./extensions/CharacterMention";
import { SlashCommandExtension } from "./extensions/SlashCommand";
import {
  useDescendantDocumentsWithLevel,
  useBulkDocumentContent,
  useDocument,
} from "@/hooks/useDocuments";
import { useEditorStore } from "@/stores/useEditorStore";
import { EditorToolbar } from "./EditorToolbar";

export interface ScriveningsEditorProps {
  folderId: string | null;
  projectId: string;
  onUpdate?: (totalCount: number) => void;
  onCreateSection?: (title: string) => void;
}

export interface ScriveningsEditorHandle {
  getSplitContent: () => {
    before: string;
    after: string;
    targetDocId: string;
  } | null;
  saveAll: () => Promise<void>; // 외부에서 저장 강제 호출용
}

const ScriveningsEditor = forwardRef<
  ScriveningsEditorHandle,
  ScriveningsEditorProps
>(({ folderId, projectId, onUpdate, onCreateSection }, ref) => {
  // Get folder info
  const { document: folderDoc } = useDocument(folderId);

  // Get all descendant documents recursively (재귀적 통합 편집)
  const { documents, isLoading } = useDescendantDocumentsWithLevel(
    folderId,
    projectId,
    { textOnly: true }
  );
  const { bulkSaveContent } = useBulkDocumentContent();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCreateSectionRef = useRef(onCreateSection);
  const saveAllRef = useRef<() => Promise<void>>();

  // 저장 상태 관리 (단일 뷰와 동일)
  const setSaveStatus = useEditorStore((state) => state.setSaveStatus);

  useEffect(() => {
    onCreateSectionRef.current = onCreateSection;
  }, [onCreateSection]);

  // Combine content for initial editor state
  const getCombinedContent = useCallback(() => {
    return documents
      .map((doc) => {
        // Include level information for hierarchical display
        const divider = `<div data-type="section-divider" data-document-id="${doc.id}" data-title="${doc.title}" data-level="${doc.level}"></div>`;
        return `${divider}${doc.content || "<p></p>"}`;
      })
      .join("");
  }, [documents]);

  // Memoize extensions to prevent duplicate registration
  const extensions = useMemo(
    () => [
      StarterKit,
      SectionDivider,
      Placeholder.configure({
        placeholder: "마크다운(#, ##, > 등)으로 자유롭게 내용을 입력하세요...",
      }),
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      CharacterMention,
      SlashCommandExtension.configure({
        onCreateSection: (title: string) => onCreateSectionRef.current?.(title),
      }),
    ],
    [] // Empty deps - extensions are static
  );

  const editor = useEditor(
    {
      extensions,
      content: getCombinedContent(),
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-stone prose-lg max-w-none focus:outline-none min-h-[500px] px-12 py-8"
          ),
          spellcheck: "false",
        },
      },
      onUpdate: ({ editor }) => {
        if (onUpdate) {
          onUpdate(editor.storage.characterCount.characters());
        }

        // 편집 중 상태 표시 (단일 뷰와 동일)
        setSaveStatus("unsaved");

        // Bulk Save logic - 1초 후 자동 저장
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveAllRef.current?.(), 1000);
      },
    },
    [extensions] // Add dependency array to prevent recreation
  );

  useImperativeHandle(ref, () => ({
    // 외부에서 통합 뷰 저장 강제 호출
    saveAll: async () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      await saveAllRef.current?.();
    },
    getSplitContent: () => {
      if (!editor) return null;

      // Auto-save 타이머 클리어 (경쟁 상태 방지)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const { from } = editor.state.selection;
      let docId: string | null = null;
      let startPos = 0;

      // 1. Find the document "container" (current section)
      editor.state.doc.nodesBetween(0, from, (node, pos) => {
        if (node.type.name === "sectionDivider") {
          docId = node.attrs.documentId;
          startPos = pos + node.nodeSize;
        }
      });

      if (!docId) return null;

      // 2. Find the END of this document
      let endPos = editor.state.doc.content.size;
      editor.state.doc.nodesBetween(from, endPos, (node, pos) => {
        if (node.type.name === "sectionDivider") {
          endPos = pos;
          return false;
        }
      });

      // 3. Extract and Split
      // Note: slice return a Slice object, we need to convert to JSON or use temporary editor
      const slice = editor.state.doc.slice(startPos, endPos);
      const json = slice.toJSON(); // Should be a valid doc content (Content Match?)
      // Actually slice.toJSON() returns { content: [...], openStart, openEnd } if Slice?
      // No, slice.toJSON() returns json of slice.
      // But creating Editor with 'content: json' might expect Doc structure.
      // We should check if 'json' is { type: 'doc', content: [...] } or just content array.
      // Tiptap Slice.toJSON() returns { content: [...] } usually.

      const tempEditor = new Editor({
        extensions,
        content: { type: "doc", content: json?.content || [] },
      });

      const relativeFrom = from - startPos;
      const totalSize = tempEditor.state.doc.content.size;

      // Split logic
      tempEditor.commands.deleteRange({ from: 0, to: relativeFrom });
      const after = tempEditor.getHTML();

      tempEditor.commands.setContent({
        type: "doc",
        content: json?.content || [],
      });
      tempEditor.commands.deleteRange({ from: relativeFrom, to: totalSize });
      const before = tempEditor.getHTML();

      tempEditor.destroy();

      return { before, after, targetDocId: docId! };
    },
  }));

  const saveAll = useCallback(async () => {
    if (!editor) return;
    try {
      const html = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const dividers = doc.querySelectorAll('div[data-type="section-divider"]');
      const updates: Record<string, string> = {};

      dividers.forEach((divider) => {
        const docId = divider.getAttribute("data-document-id");
        if (!docId) return;

        let content = "";
        let next = divider.nextElementSibling;
        while (next && next.getAttribute("data-type") !== "section-divider") {
          content += next.outerHTML;
          next = next.nextElementSibling;
        }
        updates[docId] = content;
      });

      if (Object.keys(updates).length > 0) {
        await bulkSaveContent(updates);
      }
    } catch (error) {
      console.error("[ScriveningsEditor] Failed to save content:", error);
    }
  }, [editor, bulkSaveContent]);

  // saveAllRef 업데이트 - useEditor에서 안전하게 참조하기 위함
  useEffect(() => {
    saveAllRef.current = saveAll;
  }, [saveAll]);

  // Ctrl+S Manual Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveAll]);

  // Update editor content when hierarchy changes

  const documentIds = useMemo(
    () => documents.map((c) => c.id).join(","),
    [documents]
  );

  useEffect(() => {
    if (editor && folderId && documents.length > 0) {
      const newContent = getCombinedContent();
      // Only set content if it's different to prevent resetting cursor/state
      if (editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent);
      }
    }
    // documentIds는 documents 변경 감지용 (getCombinedContent, documents.length 포함)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, folderId, documentIds]);

  if (isLoading || !editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground italic">
        문서를 불러오는 중...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/50/30">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Folder className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          통합 편집할 섹션이 없습니다
        </h3>
        <p className="text-muted-foreground max-w-md">
          왼쪽 사이드바에서 섹션을 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative group bg-card">
      <EditorToolbar editor={editor} />

      {/* Folder Title Header - 통합뷰 최상단 챕터 제목 */}
      {folderDoc && (
        <div className="border-b border-mocha-200/50 bg-gradient-to-b from-cloud-50 to-white px-12 py-8 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-mocha-400/20 flex items-center justify-center">
              <Folder className="w-5 h-5 text-mocha-700" />
            </div>
            <div>
              <div className="text-xs font-semibold text-mocha-700 uppercase tracking-wider mb-1">
                {folderDoc.type === "folder" ? "챕터" : "섹션"}
              </div>
              <h1 className="text-2xl font-bold text-espresso-900">
                {folderDoc.title}
              </h1>
            </div>
          </div>
          {folderDoc.synopsis && (
            <p className="text-sm text-foreground italic pl-13">
              {folderDoc.synopsis}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-3 pl-13">
            {documents.length}개 섹션 통합 편집 중
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto w-full scrivenings-view">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

ScriveningsEditor.displayName = "ScriveningsEditor";
export default ScriveningsEditor;
