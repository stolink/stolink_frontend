import { forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface ForeshadowingItem {
    id: string;
    tag: string;
    description?: string;
    status: string;
}

export interface ForeshadowingSuggestListProps {
    items: ForeshadowingItem[];
    command: (props: { id: string; label: string }) => void;
}

export interface ForeshadowingSuggestListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const ForeshadowingSuggestList = forwardRef<
    ForeshadowingSuggestListRef,
    ForeshadowingSuggestListProps
>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.tag });
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
        return (
            <div className="flex flex-col p-2 bg-card rounded-md shadow-lg border border-border text-xs text-muted-foreground whitespace-nowrap">
                검색 결과가 없습니다.
            </div>
        );
    }

    return (
        <div className="flex flex-col p-1 bg-card rounded-md shadow-lg border border-border overflow-hidden min-w-[200px]">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/50 mb-1">
                미회수 복선 선택
            </div>
            {props.items.map((item, index) => (
                <button
                    key={item.id}
                    className={cn(
                        "flex flex-col gap-0.5 px-2 py-1.5 text-sm text-left rounded-md transition-colors",
                        index === selectedIndex
                            ? "bg-sage-100 text-sage-900"
                            : "text-foreground hover:bg-muted/50",
                    )}
                    onClick={() => selectItem(index)}
                >
                    <div className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                        <span>#{item.tag}</span>
                    </div>
                    {item.description && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1 pl-5">
                            {item.description}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
});

ForeshadowingSuggestList.displayName = "ForeshadowingSuggestList";
