import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { Editor } from "@tiptap/core";
import {
  ForeshadowingSuggestList,
  type ForeshadowingSuggestListProps,
} from "./ForeshadowingSuggestList";
import type { ForeshadowingSuggestListRef } from "./ForeshadowingSuggestList";
import { useForeshadowingStore } from "@/stores";

// ForeshadowingSuggest 확장 정의
// projectId와 documentId는 TiptapEditor에서 configure 시 전달
export const ForeshadowingSuggest = Mention.extend({
  name: "foreshadowingSuggest",

  addOptions() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(this.parent?.() as any),
      HTMLAttributes: {
        class: "foreshadowing-tag",
      },
      renderLabel: ({
        node,
      }: {
        node: { attrs: { label?: string; id?: string } };
      }) => {
        return `#${node.attrs.label ?? node.attrs.id}`;
      },
      suggestion: {
        char: "#",
        deleteTriggerWithBackspace: true,
        items: ({ query, editor }: { query: string; editor: Editor }) => {
          // Access options from the extension itself
          const options = editor.extensionManager.extensions.find(
            (e: { name: string }) => e.name === "foreshadowingSuggest",
          )?.options;
          const projectId = options?.projectId;

          if (!projectId) return [];

          const unresolved = useForeshadowingStore
            .getState()
            .getUnresolved(projectId);
          return unresolved.filter((item) =>
            item.tag.toLowerCase().includes(query.toLowerCase()),
          );
        },
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: { from: number; to: number };
          props: { id: string; label: string };
        }) => {
          const { id, label } = props;

          // Access options from the extension itself
          const options = editor.extensionManager.extensions.find(
            (e: { name: string }) => e.name === "foreshadowingSuggest",
          )?.options;
          const projectId = options?.projectId;
          const documentId = options?.documentId;

          // Mark as recovered in the store
          if (id && projectId) {
            // sectionTitle과 documentId를 옵션에서 가져옴 (TiptapEditor에서 전달)
            const sectionTitle = options?.sectionTitle || "알 수 없음";

            useForeshadowingStore.getState().markAsRecovered(id, {
              documentId: documentId || "unknown", // documentId 추가
              sectionTitle,
              isRecovery: true,
            });
          }

          // Insert the node
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: "foreshadowingSuggest",
                attrs: { id, label },
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        render: () => {
          let component: ReactRenderer<
            ForeshadowingSuggestListRef,
            ForeshadowingSuggestListProps
          >;
          let popup: TippyInstance[];

          return {
            onStart: (props: {
              editor: Editor;
              clientRect?: (() => DOMRect) | null;
            }) => {
              component = new ReactRenderer(ForeshadowingSuggestList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect as
                  | (() => DOMRect)
                  | null,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate(props: { clientRect?: (() => DOMRect) | null }) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect as
                  | (() => DOMRect)
                  | null,
              });
            },

            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props) || false;
            },

            onExit() {
              if (popup && popup[0]) {
                popup[0].destroy();
              }
              if (component) {
                component.destroy();
              }
            },
          };
        },
      },
      // Custom options for project context
      projectId: null as string | null,
      documentId: null as string | null,
      sectionTitle: null as string | null, // 섹션 제목 (복선 위치 표시용)
    };
  },
});
