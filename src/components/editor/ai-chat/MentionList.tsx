import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/utils/imageUtils";
import { TagPreviewCard, type TagType } from "../TagPreviewCard";
import type { Character } from "@/types/character";
import type { Event } from "@/types/event";
import type { Conflict } from "@/types/analysisResult";

export interface SuggestionItem {
  id: string;
  label: string;
  subLabel?: string;
  type: TagType;
  data: Character | Event | Conflict;
}

export interface MentionListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  allCharacters?: Character[];
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const listRef = React.useRef<HTMLDivElement>(null);

  const [prevItems, setPrevItems] = useState(props.items);
  if (props.items !== prevItems) {
    setSelectedIndex(0);
    setPrevItems(props.items);
  }

  useEffect(() => {
    // Scroll selected item into view
    const listElement = listRef.current;
    if (listElement) {
      const selectedElement = listElement.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
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

  const selectedItem = props.items[selectedIndex];

  const isActionContext = props.items[0]?.type === "action";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(164,119,100,0.15)] border-2 border-mocha-200 z-50 overflow-hidden ring-1 ring-white/20",
        isActionContext ? "w-[340px]" : "flex",
      )}
    >
      {/* List Section */}
      <div
        className={cn(
          "flex flex-col bg-white/50",
          isActionContext ? "w-full" : "w-[300px]",
        )}
      >
        <div className="px-5 py-3.5 bg-gradient-to-r from-mocha-50/60 to-white/20 border-b border-mocha-100/50">
          <div className="flex justify-between items-center text-[12px] uppercase tracking-[0.15em] font-black text-[#7D5A4B]">
            <span>{isActionContext ? "Actions" : "Suggestions"}</span>
            <span className="opacity-50 font-sans font-bold text-[10px]">
              ⏎ select
            </span>
          </div>
        </div>

        <motion.div
          ref={listRef}
          variants={{
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-mocha-100/30 scrollbar-track-transparent p-2 space-y-1"
        >
          {props.items.map((item, index) => (
            <motion.button
              key={index}
              variants={{
                hidden: { opacity: 0, x: -10 },
                show: { opacity: 1, x: 0 },
              }}
              className={cn(
                "w-full px-4 py-3 text-left text-base flex items-center gap-3.5 transition-all duration-300 rounded-xl group relative overflow-hidden",
                index === selectedIndex
                  ? "bg-gradient-to-r from-[#A47764]/10 to-white text-[#2A231F] shadow-sm transform scale-[1.02] z-10"
                  : "hover:bg-mocha-50/30 text-[#7D5A4B] hover:text-[#2A231F]",
              )}
              onClick={() => selectItem(index)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-[22px] font-black transition-all duration-500 shadow-sm overflow-hidden",
                  index === selectedIndex
                    ? "scale-100 rotate-0"
                    : "scale-90 -rotate-3",
                  item.type === "conflict"
                    ? "bg-rose-100 text-rose-600 ring-1 ring-rose-200/50"
                    : item.type === "action"
                      ? "bg-sky-50 text-sky-600 ring-1 ring-sky-200/50"
                      : item.type === "character"
                        ? "bg-[#F1F0EC] text-[#A47764] ring-1 ring-[#A47764]/20"
                        : "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50",
                )}
              >
                {item.type === "character" &&
                (item.data as Character).imageUrl ? (
                  <img
                    src={resolveImageUrl((item.data as Character).imageUrl)}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {item.type === "conflict" ? (
                      "#"
                    ) : item.type === "action" ? (
                      <span className="text-xl">✨</span>
                    ) : item.type === "character" ? (
                      "@"
                    ) : (
                      "!"
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                <span
                  className={cn(
                    "font-bold text-[1.1rem] leading-tight truncate font-serif transition-colors",
                    index === selectedIndex
                      ? "text-[#2A231F]"
                      : "text-[#3D302A]",
                  )}
                >
                  {item.label}
                </span>
                {item.subLabel && (
                  <span
                    className={cn(
                      "text-[12px] font-bold truncate leading-tight transition-all",
                      index === selectedIndex
                        ? "text-[#A47764] translate-x-1"
                        : "text-[#7D5A4B] opacity-70",
                    )}
                  >
                    {item.subLabel}
                  </span>
                )}
              </div>

              {index === selectedIndex && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#A47764]"
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Preview Section - Integrated */}
      {selectedItem && !isActionContext && (
        <div className="w-[360px] border-l-2 border-mocha-200 bg-white/50 backdrop-blur-sm p-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <TagPreviewCard
                type={selectedItem.type}
                data={selectedItem.data}
                className="h-full border-0 shadow-none bg-transparent"
                allCharacters={props.allCharacters}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});

MentionList.displayName = "MentionList";
