import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useDeferredValue,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@stolink/ui";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { ROLE_LABELS } from "./constants";
import { matchesSearch, getInitial, ROLE_GRADIENTS } from "./utils";
import { getKoreanRegex } from "@/lib/korean-search";

interface CharacterSearchOverlayProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  onSearch: (matchingIds: string[] | null) => void;
}

/**
 * 캐릭터 검색 오버레이 컴포넌트 (성능 최적화 버전)
 * - CSS Containment로 렌더링 격리
 * - Virtualization으로 DOM 노드 최소화 (590개 → ~10개)
 * - useDeferredValue로 입력 우선순위 분리
 * - GPU 가속 transform 사용
 */
export function CharacterSearchOverlay({
  characters,
  onSelect,
  onSearch,
}: CharacterSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // 검색 결과 렌더링 우선순위 낮춤
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null); // Virtualizer parent

  // Search Logic with Fuzzy + Chosung (deferred query 사용)
  const matches = useMemo(() => {
    if (!deferredQuery.trim()) return [];

    return characters.filter((c) =>
      matchesSearch(c.profile?.name || "", deferredQuery),
    );
  }, [deferredQuery, characters]);

  // [Stability] Virtualizer 옵션 안정화 - 매 렌더링마다 재생성 방지
  const getScrollElement = useCallback(() => parentRef.current, []);
  const estimateSize = useCallback(() => 52, []); // 각 항목 높이 (px)

  // Virtualizer 설정 - 화면에 보이는 항목만 렌더링
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement,
    estimateSize,
    overscan: 5, // 버퍼 항목 수
  });

  // Notify parent of matches for highlighting
  useEffect(() => {
    if (!deferredQuery.trim()) {
      onSearch(null);
    } else {
      onSearch(matches.map((c) => c._id));
    }
  }, [matches, deferredQuery, onSearch]);

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
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, matches.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + matches.length) % Math.max(1, matches.length),
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
        "absolute top-6 left-1/2 z-20 flex flex-col gap-2 transition-all duration-300",
        isFocused ? "w-[600px]" : "w-[480px]",
      )}
      style={{
        // CSS Containment - 렌더링 격리
        contain: "layout style",
        // GPU 가속 transform 사용 (left 대신)
        transform: "translateX(-50%)",
      }}
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
              isFocused ? "text-mocha-500" : "text-muted-foreground",
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
              "rounded-full",
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
                className="absolute right-3 p-1 rounded-full hover:bg-cloud-100 transition-colors"
              >
                <X className="h-4 w-4 text-espresso-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard shortcut hint */}
        {!isFocused && !query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-espresso-400 pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-cloud-100 rounded text-[10px] ">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown Results - Virtualized */}
      <AnimatePresence>
        {isFocused && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-sm rounded-xl border border-cloud-100 shadow-xl overflow-hidden"
          >
            {/* Virtualized List Container */}
            <div
              ref={parentRef}
              className="max-h-[280px] overflow-y-auto py-1.5 custom-scrollbar"
              // Removed contain: strict because it causes 0 height behavior without explicit height
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const char = matches[virtualRow.index];
                  const index = virtualRow.index;
                  const role = char.role || "other";
                  const gradient =
                    (
                      ROLE_GRADIENTS as Record<
                        string,
                        { from: string; to: string }
                      >
                    )[role] || ROLE_GRADIENTS.other;
                  const initial = getInitial(char.profile?.name || "?");

                  return (
                    <div
                      key={char._id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        // GPU 가속 transform 사용 (top 대신)
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={cn(
                        "px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors duration-100 relative overflow-hidden",
                        index === selectedIndex
                          ? "bg-mocha-50"
                          : "hover:bg-cloud-50/80",
                      )}
                      onClick={() => handleSelect(char)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* Selection Indicator Bar */}
                      {index === selectedIndex && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-mocha-500" />
                      )}

                      {/* Avatar / Image with Initial Fallback */}
                      <div
                        className={cn(
                          "h-9 w-9 rounded-full overflow-hidden border shrink-0 flex items-center justify-center",
                          index === selectedIndex
                            ? "border-mocha-200 shadow-sm"
                            : "border-cloud-100",
                        )}
                      >
                        {char.imageUrl ? (
                          <img
                            src={char.imageUrl}
                            alt={char.profile?.name || ""}
                            className="w-full h-full object-cover rounded-full"
                            loading="lazy" // Lazy loading
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
                              : "text-espresso-700",
                          )}
                        >
                          {(() => {
                            const name = char.profile?.name || "이름 없음";
                            if (!deferredQuery.trim()) return name;

                            try {
                              const regex = getKoreanRegex(deferredQuery);
                              const match = regex.exec(name);
                              if (!match) return name;

                              // Simple highlight of the *first* match
                              // For global highlighting, we'd need loop.
                              // But Chosung usually matches once for name search.
                              // We split by match index.
                              const start = match.index;
                              const end = start + match[0].length;

                              const before = name.slice(0, start);
                              const target = name.slice(start, end);
                              const after = name.slice(end);

                              return (
                                <>
                                  {before}
                                  <span className="text-mocha-600 font-bold bg-mocha-100/50 rounded-[1px]">
                                    {target}
                                  </span>
                                  {after}
                                </>
                              );
                            } catch (_e) {
                              return name;
                            }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                              index === selectedIndex
                                ? "bg-white border-mocha-200 text-mocha-600 shadow-sm"
                                : "bg-cloud-100 border-cloud-200 text-espresso-500",
                            )}
                          >
                            {ROLE_LABELS[char.role || "other"] || char.role}
                          </span>
                          {char.profile?.faction?.name && (
                            <span className="text-espresso-400">
                              • {char.profile.faction.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Enter Hint */}
                      {index === selectedIndex && (
                        <div className="text-[10px] font-medium text-mocha-400 bg-white px-1.5 py-0.5 rounded border border-mocha-100">
                          Enter
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer - Search Stats */}
            <div className="px-4 py-2 bg-cloud-50/50 border-t border-cloud-100 text-[10px] text-muted-foreground flex justify-between items-center">
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
            className="bg-white/95 backdrop-blur-sm rounded-xl border border-cloud-100 shadow-xl p-4 text-center"
            style={{ contain: "content" }}
          >
            <p className="text-espresso-500 text-sm">
              "<span className="font-medium text-espresso-700">{query}</span>"에
              해당하는 캐릭터가 없습니다
            </p>
            <p className="text-espresso-400 text-xs mt-1">
              초성 검색도 지원합니다 (예: ㅈㅂㅈ)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
