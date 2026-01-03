import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { ROLE_LABELS } from "./constants";
import { matchesSearch, getInitial, ROLE_GRADIENTS } from "./utils";

interface CharacterSearchOverlayProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  onSearch: (matchingIds: string[] | null) => void;
}

/**
 * 캐릭터 검색 오버레이 컴포넌트
 * Fuzzy Search + 한글 초성 검색 지원
 */
export function CharacterSearchOverlay({
  characters,
  onSelect,
  onSearch,
}: CharacterSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search Logic with Fuzzy + Chosung
  const matches = useMemo(() => {
    if (!query.trim()) return [];

    return characters.filter((c) =>
      matchesSearch(c.profile?.name || "", query)
    );
  }, [query, characters]);

  // Notify parent of matches for highlighting
  useEffect(() => {
    if (!query.trim()) {
      onSearch(null); // 검색어가 없으면 null 전달 (일반 모드)
    } else {
      onSearch(matches.map((c) => c._id));
    }
  }, [matches, query, onSearch]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Composing 상태(한글 입력 중)에서는 이벤트 무시
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, matches.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + matches.length) % Math.max(1, matches.length)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && matches[selectedIndex]) {
        handleSelect(matches[selectedIndex]);
      } else if (matches.length > 0) {
        handleSelect(matches[0]);
      }
    } else if (e.key === "Escape") {
      setQuery("");
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (char: Character) => {
    onSelect(char);
    setQuery("");
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 transition-all duration-300",
        isFocused ? "w-[600px]" : "w-[480px]"
      )}
    >
      <div className="relative group">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-mocha-500/10 rounded-full blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex items-center">
          <Search
            className={cn(
              "absolute left-4 h-5 w-5 transition-colors duration-200 pointer-events-none z-10",
              isFocused ? "text-mocha-500" : "text-muted-foreground"
            )}
          />
          <Input
            ref={inputRef}
            placeholder="캐릭터 검색"
            className={cn(
              "pl-10 pr-10 h-[52px] bg-white/80 backdrop-blur-md shadow-sm border-2 border-transparent transition-all duration-300",
              "placeholder:text-muted-foreground/70 text-lg",
              "hover:bg-white hover:border-mocha-200",
              "focus-visible:ring-0 focus-visible:border-mocha-500 focus-visible:bg-white focus-visible:shadow-md",
              "rounded-full"
            )}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
          />

          {/* Clear button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-3 p-1 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="h-4 w-4 text-stone-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard shortcut hint */}
        {!isFocused && !query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-mono">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isFocused && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="max-h-[280px] overflow-y-auto py-1.5 custom-scrollbar">
              {matches.map((char, index) => {
                const role = char.role || "other";
                const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.other;
                const initial = getInitial(char.profile?.name || "?");

                return (
                  <motion.div
                    key={char._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-all duration-150 relative overflow-hidden",
                      index === selectedIndex
                        ? "bg-mocha-50"
                        : "hover:bg-gray-50/80"
                    )}
                    onClick={() => handleSelect(char)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {/* Selection Indicator Bar */}
                    {index === selectedIndex && (
                      <motion.div
                        layoutId="selection-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-mocha-500"
                      />
                    )}

                    {/* Avatar / Image with Initial Fallback */}
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full overflow-hidden border shrink-0 flex items-center justify-center",
                        index === selectedIndex
                          ? "border-mocha-200 shadow-sm"
                          : "border-gray-100"
                      )}
                    >
                      {char.imageUrl ? (
                        <img
                          src={char.imageUrl}
                          alt={char.profile?.name || ""}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                          }}
                        >
                          <span className="text-white font-bold text-sm">
                            {initial}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center gap-0.5">
                      <div
                        className={cn(
                          "font-medium text-sm leading-none",
                          index === selectedIndex
                            ? "text-mocha-900"
                            : "text-gray-700"
                        )}
                      >
                        {char.profile?.name || "이름 없음"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                            index === selectedIndex
                              ? "bg-white border-mocha-200 text-mocha-600 shadow-sm"
                              : "bg-gray-100 border-gray-200 text-gray-500"
                          )}
                        >
                          {ROLE_LABELS[char.role || "other"] || char.role}
                        </span>
                        {char.profile?.faction?.name && (
                          <span className="text-gray-400">
                            • {char.profile.faction.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enter Hint */}
                    {index === selectedIndex && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-medium text-mocha-400 bg-white px-1.5 py-0.5 rounded border border-mocha-100"
                      >
                        Enter
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer - Search Stats */}
            <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 text-[10px] text-muted-foreground flex justify-between items-center">
              <span>
                <strong className="font-medium text-mocha-600">
                  {matches.length}
                </strong>
                명 발견
              </span>
              <span className="flex gap-2">
                <span>⇅ 이동</span>
                <span>↵ 선택</span>
                <span>ESC 닫기</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {isFocused && query && matches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-xl p-4 text-center"
          >
            <p className="text-stone-500 text-sm">
              "<span className="font-medium text-stone-700">{query}</span>"에
              해당하는 캐릭터가 없습니다
            </p>
            <p className="text-stone-400 text-xs mt-1">
              초성 검색도 지원합니다 (예: ㅈㅂㅈ)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
