import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ChevronDown,
  Heart,
  Users,
  Skull,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RelationType } from "@/types";
import { RELATION_LABELS, RELATION_COLORS_HEX } from "./constants";
import { cn } from "@/lib/utils";

// 관계 타입별 아이콘 (컴팩트)
const RELATION_ICONS: Record<RelationType, React.ReactNode> = {
  friendly: <Users className="w-3 h-3" />,
  hostile: <Skull className="w-3 h-3" />,
  romantic: <Heart className="w-3 h-3" />,
};

interface NetworkControlsProps {
  relationTypeFilter: RelationType | "all";
  onFilterChange: (value: RelationType | "all") => void;
  enableGrouping?: boolean;
  onGroupingChange?: (enabled: boolean) => void;
  hoveredType?: RelationType | null;
  onHoverType?: (type: RelationType | null) => void;
}

/**
 * 네트워크 그래프 컨트롤 패널
 * - 관계 타입 필터
 * - 범례 (인터랙티브)
 * - 그룹 토글 (Switch)
 */
export function NetworkControls({
  relationTypeFilter,
  onFilterChange,
  enableGrouping = false,
  onGroupingChange,
  hoveredType,
  onHoverType,
}: NetworkControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeFilterLabel =
    relationTypeFilter === "all"
      ? "모든 관계"
      : RELATION_LABELS[relationTypeFilter];

  const relationTypes = Object.keys(RELATION_LABELS) as RelationType[];

  return (
    <>
      {/* 좌측 컨트롤 패널 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute left-3 top-3 z-20 frosted-glass rounded-xl overflow-hidden shadow-lg"
      >
        {/* 헤더 - 토글 가능 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-mocha-500" />
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
              컨트롤
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-4">
                {/* 필터 드롭다운 */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                    필터
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-between gap-1 h-8 text-xs bg-white/80 hover:bg-white border-stone-200",
                          relationTypeFilter !== "all" &&
                            "border-mocha-300 bg-mocha-50",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {relationTypeFilter !== "all" && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  RELATION_COLORS_HEX[relationTypeFilter],
                              }}
                            />
                          )}
                          <span className="font-medium">
                            {activeFilterLabel}
                          </span>
                        </span>
                        <ChevronDown className="h-3 w-3 text-stone-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuRadioGroup
                        value={relationTypeFilter}
                        onValueChange={(v) =>
                          onFilterChange(v as RelationType | "all")
                        }
                      >
                        <DropdownMenuRadioItem
                          value="all"
                          className="cursor-pointer text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-100 flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-stone-400" />
                            </span>
                            모든 관계
                          </span>
                        </DropdownMenuRadioItem>
                        {relationTypes.map((type) => (
                          <DropdownMenuRadioItem
                            key={type}
                            value={type}
                            className="cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: `${RELATION_COLORS_HEX[type]}20`,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: RELATION_COLORS_HEX[type],
                                  }}
                                />
                              </span>
                              {RELATION_LABELS[type]}
                            </span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* 초기화 버튼 */}
                  {relationTypeFilter !== "all" && (
                    <button
                      onClick={() => onFilterChange("all")}
                      className="w-full text-[10px] text-stone-400 hover:text-stone-600 transition-colors text-center py-1"
                    >
                      초기화
                    </button>
                  )}
                </div>

                {/* 그룹 토글 */}
                {onGroupingChange && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                        그룹 보기
                      </Label>
                      <Switch
                        checked={enableGrouping}
                        onChange={onGroupingChange}
                      />
                    </div>
                    <p className="text-[9px] text-stone-400 leading-tight">
                      진영별로 노드를 그룹화합니다
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 하단 범례 - 인터랙티브 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
        className="absolute left-3 bottom-3 z-20 frosted-glass rounded-xl p-3 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-0.5 h-3 rounded-full bg-mocha-500" />
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
            범례
          </span>
          <span className="text-[9px] text-stone-400 ml-auto">
            클릭하여 필터
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {relationTypes.map((type) => {
            const isActive = relationTypeFilter === type;
            const isHovered = hoveredType === type;
            const isDimmed = relationTypeFilter !== "all" && !isActive;

            return (
              <motion.div
                key={type}
                onClick={() => onFilterChange(isActive ? "all" : type)}
                onMouseEnter={() => onHoverType?.(type)}
                onMouseLeave={() => onHoverType?.(null)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
                  isActive && "bg-white shadow-sm",
                  isHovered && !isActive && "bg-white/60",
                  isDimmed && "opacity-40",
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  {/* 아이콘 */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${RELATION_COLORS_HEX[type]}15`,
                      color: RELATION_COLORS_HEX[type],
                    }}
                  >
                    {RELATION_ICONS[type]}
                  </span>

                  {/* 선 샘플 */}
                  <div
                    className="w-6 h-0.5 rounded-full"
                    style={{
                      backgroundColor: RELATION_COLORS_HEX[type],
                      ...(type === "hostile" && {
                        background: `repeating-linear-gradient(90deg, ${RELATION_COLORS_HEX[type]} 0px, ${RELATION_COLORS_HEX[type]} 3px, transparent 3px, transparent 6px)`,
                      }),
                    }}
                  />
                </div>

                <span
                  className={cn(
                    "text-xs transition-colors",
                    isActive ? "font-medium text-stone-800" : "text-stone-600",
                  )}
                >
                  {RELATION_LABELS[type]}
                </span>

                {/* Active indicator */}
                {isActive && <Eye className="w-3 h-3 text-mocha-500 ml-auto" />}
                {isDimmed && (
                  <EyeOff className="w-3 h-3 text-stone-300 ml-auto" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
