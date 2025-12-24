import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  CheckSquare,
  User,
} from "lucide-react";

export interface CommandItemProps {
  title: string;
  icon: React.ReactNode;
  command: ({ editor, range }: any) => void;
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

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

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
      <div className="flex flex-col p-1 bg-white rounded-md shadow-lg border border-stone-200 overflow-hidden min-w-[200px]">
        {props.items.map((item, index) => (
          <button
            key={index}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md transition-colors",
              index === selectedIndex
                ? "bg-sage-100 text-sage-900"
                : "text-stone-600 hover:bg-stone-50"
            )}
            onClick={() => selectItem(index)}
          >
            <div className="flex items-center justify-center w-5 h-5 text-stone-500">
              {item.icon}
            </div>
            <span className="font-medium">{item.title}</span>
          </button>
        ))}
      </div>
    );
  }
);

CommandList.displayName = "CommandList";
