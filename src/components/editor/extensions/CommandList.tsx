import { forwardRef, useImperativeHandle, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { cn } from "@/lib/utils";

export interface CommandItemProps {
  title: string;
  icon: React.ReactNode;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export interface CommandListProps {
  items: CommandItemProps[];
  command: (item: CommandItemProps) => void;
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevItems, setPrevItems] = useState(props.items);

    if (props.items !== prevItems) {
      setPrevItems(props.items);
      setSelectedIndex(0);
    }

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length,
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col p-1 bg-card rounded-md shadow-lg border border-border overflow-hidden min-w-[200px]">
        {props.items.map((item, index) => (
          <button
            key={index}
            className={cn(
              "flex items-center gap-2 px-2 py-2 text-sm text-left rounded-md transition-all",
              index === selectedIndex
                ? "bg-mocha-700 text-white shadow-md scale-[1.02] z-10"
                : "text-espresso-900 hover:bg-muted/50",
            )}
            onClick={() => selectItem(index)}
          >
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5",
                index === selectedIndex
                  ? "text-mocha-50"
                  : "text-muted-foreground",
              )}
            >
              {item.icon}
            </div>
            <span className="font-semibold">{item.title}</span>
          </button>
        ))}
      </div>
    );
  },
);

CommandList.displayName = "CommandList";
