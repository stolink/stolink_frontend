import { forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import { type Character } from "@/types/character";

export interface SuggestionListProps {
  items: Character[];
  command: (props: { id: string; label: string }) => void;
}

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SuggestionList = forwardRef<
  SuggestionListRef,
  SuggestionListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
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

  // Reset selection when items change
  const [prevItems, setPrevItems] = useState(props.items);
  if (props.items !== prevItems) {
    setPrevItems(props.items);
    setSelectedIndex(0);
  }

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
    <div className="flex flex-col p-1 bg-card rounded-md shadow-lg border border-border overflow-hidden min-w-[180px]">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md transition-colors",
            index === selectedIndex
              ? "bg-sage-100 text-sage-900"
              : "text-foreground hover:bg-muted/50",
          )}
          onClick={() => selectItem(index)}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-bold">
              {item.name[0]}
            </div>
          )}
          <span className="font-medium">{item.name}</span>
          {item.role && (
            <span className="text-xs text-muted-foreground ml-auto">{item.role}</span>
          )}
        </button>
      ))}
    </div>
  );
});

SuggestionList.displayName = "SuggestionList";
