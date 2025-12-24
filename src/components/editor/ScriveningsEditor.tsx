import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SectionDivider } from "./extensions/SectionDivider";
import { CharacterMention } from "./extensions/CharacterMention";
import {
  useChildDocuments,
  useBulkDocumentContent,
} from "@/hooks/useDocuments";
import { EditorToolbar } from "./EditorToolbar";

interface ScriveningsEditorProps {
  folderId: string;
  projectId: string;
  onUpdate?: (totalCount: number) => void;
}

export default function ScriveningsEditor({
  folderId,
  projectId,
  onUpdate,
}: ScriveningsEditorProps) {
  const { children, isLoading } = useChildDocuments(folderId, projectId);
  const { bulkSaveContent } = useBulkDocumentContent();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Combine children content for initial editor state
  const getCombinedContent = useCallback(() => {
    return children
      .map((doc) => {
        const divider = `<div data-type="section-divider" data-document-id="${doc.id}" data-title="${doc.title}"></div>`;
        return `${divider}${doc.content || "<p></p>"}`;
      })
      .join("");
  }, [children]);

  const editor = useEditor({
    extensions: [
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
    ],
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

      // Bulk Save logic
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const dividers = doc.querySelectorAll(
          'div[data-type="section-divider"]'
        );
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
          bulkSaveContent(updates);
        }
      }, 1000);
    },
  });

  // Update editor content if children change (but only if not dirty?)
  // Actually, we should be careful not to overwrite user input.
  // For MVP, we only set content once or when folder changes.
  useEffect(() => {
    if (editor && folderId) {
      editor.commands.setContent(getCombinedContent());
    }
  }, [editor, folderId, getCombinedContent]);

  if (isLoading || !editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 italic">
        문서를 불러오는 중...
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-stone-50/30">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <List className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">
          통합 편집할 섹션이 없습니다
        </h3>
        <p className="text-stone-500 max-w-md">
          왼쪽 사이드바에서 섹션을 추가하거나, 하단의 섹션 스트립에서 '첫 섹션
          만들기'를 클릭하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative group bg-white">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto w-full scrivenings-view">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
