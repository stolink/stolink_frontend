import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";
import { User, Package } from "lucide-react";

// 멘션 통합 아이템 타입 (캐릭터 + 아이템)
export interface MentionItem {
  id: string;
  name: string;
  type: "character" | "item";
  // 캐릭터 전용
  imageUrl?: string;
  role?: string;
  // 아이템 전용
  itemType?: string;
}

export interface SuggestionListProps {
  items: MentionItem[];
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 선택된 항목이 화면 밖으로 나가지 않도록 자동 스크롤
  useEffect(() => {
    if (containerRef.current) {
      const selectedElement = containerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  if (props.items.length === 0) {
    return (
      <div className="flex flex-col p-2 bg-card rounded-md shadow-lg border border-border text-xs text-muted-foreground whitespace-nowrap">
        검색 결과가 없습니다.
      </div>
    );
  }

  // 캐릭터와 아이템 분리
  const characters = props.items.filter((item) => item.type === "character");
  const items = props.items.filter((item) => item.type === "item");

  return (
    <div
      ref={containerRef}
      className="flex flex-col p-1 bg-card rounded-md shadow-lg border border-border overflow-hidden min-w-[200px] max-h-[280px] overflow-y-auto"
    >
      {/* 캐릭터 섹션 */}
      {characters.length > 0 && (
        <>
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/50 mb-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            등장인물
          </div>
          {characters.map((item) => {
            const index = props.items.indexOf(item);
            return (
              <button
                key={item.id}
                data-index={index}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md transition-all",
                  index === selectedIndex
                    ? "bg-mocha-700 text-white shadow-md scale-[1.02] z-10"
                    : "text-espresso-900 hover:bg-muted/50",
                )}
                onClick={() => selectItem(index)}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={cn(
                      "w-5 h-5 rounded-full object-cover",
                      index === selectedIndex ? "ring-1 ring-white/50" : "",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      index === selectedIndex
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.name[0]}
                  </div>
                )}
                <span className="font-semibold">{item.name}</span>
                {item.role && (
                  <span
                    className={cn(
                      "text-[11px] ml-auto",
                      index === selectedIndex
                        ? "text-mocha-50"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.role}
                  </span>
                )}
              </button>
            );
          })}
        </>
      )}

      {/* 아이템 섹션 */}
      {items.length > 0 && (
        <>
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/50 mb-1 mt-1 flex items-center gap-1">
            <Package className="w-3 h-3" />
            아이템
          </div>
          {items.map((item) => {
            const index = props.items.indexOf(item);
            return (
              <button
                key={item.id}
                data-index={index}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md transition-all",
                  index === selectedIndex
                    ? "bg-status-warning text-white shadow-md scale-[1.02] z-10"
                    : "text-espresso-900 hover:bg-muted/50",
                )}
                onClick={() => selectItem(index)}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center",
                    index === selectedIndex
                      ? "bg-white/20"
                      : "bg-status-warning/10",
                  )}
                >
                  <Package
                    className={cn(
                      "w-3 h-3",
                      index === selectedIndex
                        ? "text-white"
                        : "text-status-warning",
                    )}
                  />
                </div>
                <span className="font-semibold">{item.name}</span>
                {item.itemType && (
                  <span
                    className={cn(
                      "text-[11px] ml-auto capitalize",
                      index === selectedIndex
                        ? "text-status-warning/50"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.itemType}
                  </span>
                )}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
});

SuggestionList.displayName = "SuggestionList";
