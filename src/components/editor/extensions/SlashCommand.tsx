import { Extension, Editor } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { CommandList } from "./CommandList";
import type { CommandListRef } from "./CommandList";
import type {
  SlashCommandItem,
  SlashCommandParams,
} from "./slashCommand.types";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  FilePlus,
} from "lucide-react";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      onCreateSection: null as ((title: string) => void) | null,
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: SlashCommandParams["editor"];
          range: SlashCommandParams["range"];
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const getSuggestionItems = ({
  query,
}: {
  query: string;
  editor: Editor;
}): SlashCommandItem[] => {
  const items: SlashCommandItem[] = [
    {
      title: "새 섹션",
      icon: <FilePlus className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        const onCreateSection = editor.extensionManager.extensions.find(
          (ext) => ext.name === "slashCommand"
        )?.options?.onCreateSection;

        if (onCreateSection) {
          // Delete the slash command text
          editor.chain().focus().deleteRange(range).run();
          // Call the callback to create a new section (sibling)
          onCreateSection("새 섹션", false);
        }
      },
    },
    {
      title: "제목 1",
      icon: <Heading1 className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "제목 2",
      icon: <Heading2 className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "제목 3",
      icon: <Heading3 className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "목록",
      icon: <List className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "번호 매기기",
      icon: <ListOrdered className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "인용구",
      icon: <Quote className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "구분선",
      icon: <Minus className="w-4 h-4" />,
      command: ({ editor, range }: SlashCommandParams) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];

  return items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const SlashCommandExtension = SlashCommand.configure({
  suggestion: {
    items: getSuggestionItems,
    render: () => {
      let component: ReactRenderer<CommandListRef>;
      let popup: TippyInstance[];

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(CommandList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as (() => DOMRect) | null,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect as (() => DOMRect) | null,
          });
        },

        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props) || false;
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  },
});
