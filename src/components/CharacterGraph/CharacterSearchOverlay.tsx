import { useState, useMemo, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { ROLE_LABELS } from "./constants";

interface CharacterSearchOverlayProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  onSearch: (matchingIds: string[] | null) => void;
}

export function CharacterSearchOverlay({
  characters,
  onSelect,
  onSearch,
}: CharacterSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search Logic
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();

    // 사용자의 요구사항: "한글자라도 포함하면 후보로 등록"
    return characters.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  }, [query, characters]);

  // Notify parent of matches for highlighting
  useEffect(() => {
    if (!query.trim()) {
      onSearch(null); // 검색어가 없으면 null 전달 (일반 모드)
    } else {
      onSearch(matches.map((c) => c.id));
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Composing 상태(한글 입력 중)에서는 이벤트 무시
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && matches[selectedIndex]) {
        handleSelect(matches[selectedIndex]);
      } else if (matches.length > 0) {
        // 선택된 것이 없으면 첫 번째 항목 선택
        handleSelect(matches[0]);
      }
    } else if (e.key === "Escape") {
      setQuery("");
      setIsFocused(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const handleSelect = (char: Character) => {
    onSelect(char);
    // 선택 후 검색어 초기화 (네비게이션 목적)
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 transition-all duration-300",
        isFocused ? "w-96" : "w-80",
      )}
    >
      <div className="relative group">
        <div
          className={cn(
            "absolute inset-0 bg-mocha-500/10 rounded-full blur-md transition-opacity duration-300",
            isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-50",
          )}
        />
        <div className="relative relative flex items-center">
          <Search
            className={cn(
              "absolute left-4 h-4 w-4 transition-colors duration-200 pointer-events-none z-10",
              isFocused ? "text-mocha-500" : "text-muted-foreground",
            )}
          />
          <Input
            placeholder="캐릭터 이름으로 검색..." // 더 친절한 문구
            className={cn(
              "pl-10 h-11 bg-white/80 backdrop-blur-md shadow-sm border-2 border-transparent transition-all duration-300",
              "placeholder:text-muted-foreground/70 text-base",
              "hover:bg-white hover:border-mocha-200",
              "focus-visible:ring-0 focus-visible:border-mocha-500 focus-visible:bg-white focus-visible:shadow-md",
              "rounded-full", // 더 부드러운 느낌
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
        </div>
      </div>

      {/* Dropdown Results */}
      {isFocused && matches.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[280px] overflow-y-auto py-1.5 custom-scrollbar">
            {matches.map((char, index) => (
              <div
                key={char.id}
                className={cn(
                  "px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-all duration-150 relative overflow-hidden",
                  index === selectedIndex
                    ? "bg-mocha-50"
                    : "hover:bg-gray-50/80",
                )}
                onClick={() => handleSelect(char)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* Selection Indicator Bar */}
                {index === selectedIndex && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-mocha-500" />
                )}

                {/* Avatar / Image */}
                <div
                  className={cn(
                    "h-9 w-9 rounded-full overflow-hidden border shrink-0 flex items-center justify-center",
                    index === selectedIndex
                      ? "border-mocha-200 shadow-sm"
                      : "border-gray-100 bg-gray-50",
                  )}
                >
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base select-none">
                      {char.role === "protagonist"
                        ? "🦸"
                        : char.role === "antagonist"
                          ? "🦹"
                          : char.role === "mentor"
                            ? "🧙"
                            : "👤"}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center gap-0.5">
                  <div
                    className={cn(
                      "font-medium text-sm leading-none",
                      index === selectedIndex
                        ? "text-mocha-900"
                        : "text-gray-700",
                    )}
                  >
                    {char.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                        index === selectedIndex
                          ? "bg-white border-mocha-200 text-mocha-600 shadow-sm"
                          : "bg-gray-100 border-gray-200 text-gray-500",
                      )}
                    >
                      {ROLE_LABELS[char.role || "other"] || char.role}
                    </span>
                    {char.faction && (
                      <span className="text-gray-400">• {char.faction}</span>
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
            ))}
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
        </div>
      )}
    </div>
  );
}
