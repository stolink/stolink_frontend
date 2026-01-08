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
import { Button } from "@stolink/ui";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RELATION_LABELS,
  RELATION_COLORS_HEX,
  type UIRelationType,
} from "./constants";
import { cn } from "@/lib/utils";

// 관계 타입별 아이콘 (컴팩트)
const RELATION_ICONS: Record<UIRelationType, React.ReactNode> = {
  friendly: <Users className="w-3 h-3" />,
  hostile: <Skull className="w-3 h-3" />,
  romantic: <Heart className="w-3 h-3" />,
};

interface NetworkControlsProps {
  relationTypeFilter: UIRelationType | "all";
  onFilterChange: (value: UIRelationType | "all") => void;
  enableGrouping?: boolean;
  onGroupingChange?: (enabled: boolean) => void;
  hoveredType?: UIRelationType | null;
  onHoverType?: (type: UIRelationType | null) => void;
  onSimulateCollapse?: () => void;
  /** 주요 캐릭터만 보기 필터 */
  showMainOnly?: boolean;
  onShowMainOnlyChange?: (enabled: boolean) => void;
  // Timeline Props
  showTimeline?: boolean;
  currentChapter?: number;
  totalChapters?: number;
  onChapterChange?: (val: number) => void;

  // Insights Props
  showTension?: boolean;
  onToggleTension?: (val: boolean) => void;
  showLogicCheck?: boolean;
  onToggleLogicCheck?: (val: boolean) => void;
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
  onSimulateCollapse,
  showMainOnly = false,
  onShowMainOnlyChange,
  // Insights
  showTension = false,
  onToggleTension,
  showLogicCheck = false,
  onToggleLogicCheck,
  // Timeline
  currentChapter,
  totalChapters,
  onChapterChange,
}: NetworkControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeFilterLabel =
    relationTypeFilter === "all"
      ? "모든 관계"
      : RELATION_LABELS[relationTypeFilter];

  const relationTypes = Object.keys(RELATION_LABELS) as UIRelationType[];

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
            <span className="text-xs font-semibold text-espresso-600 uppercase tracking-wider">
              컨트롤
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3.5 w-3.5 text-espresso-400" />
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
                  <Label className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
                    필터
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        intent="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-between gap-1 h-8 text-xs bg-white/80 hover:bg-white border-cloud-200",
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
                        <ChevronDown className="h-3 w-3 text-espresso-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuRadioGroup
                        value={relationTypeFilter}
                        onValueChange={(v) =>
                          onFilterChange(v as UIRelationType | "all")
                        }
                      >
                        <DropdownMenuRadioItem
                          value="all"
                          className="cursor-pointer text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-cloud-200 to-stone-100 flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-cloud-400" />
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
                      className="w-full text-[10px] text-espresso-400 hover:text-espresso-600 transition-colors text-center py-1"
                    >
                      초기화
                    </button>
                  )}
                </div>

                {/* 주요 캐릭터만 필터 */}
                {onShowMainOnlyChange && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
                        주요 캐릭터만
                      </Label>
                      <Switch
                        checked={showMainOnly}
                        onChange={onShowMainOnlyChange}
                      />
                    </div>
                    <p className="text-[9px] text-espresso-400 leading-tight">
                      주인공, 적대자 및 관계가 많은 캐릭터만 표시
                    </p>
                  </div>
                )}

                {/* 그룹 토글 */}
                {onGroupingChange && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
                        그룹 보기
                      </Label>
                      <Switch
                        checked={enableGrouping}
                        onChange={onGroupingChange}
                      />
                    </div>
                    <p className="text-[9px] text-espresso-400 leading-tight">
                      진영별로 노드를 그룹화합니다
                    </p>
                  </div>
                )}

                {/* Simulation Debug (Temp) */}
                {onSimulateCollapse && (
                  <div className="pt-2 border-t border-cloud-100 space-y-1.5">
                    <Label className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
                      Simulation
                    </Label>
                    <Button
                      intent="destructive"
                      size="sm"
                      onClick={onSimulateCollapse}
                      className="w-full h-7 text-[10px] font-medium"
                    >
                      Trigger Collapse 💥
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 우측 상단 Insights Panel Toggle */}
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        {onToggleTension && (
          <Button
            variant={showTension ? "default" : "secondary"}
            size="sm"
            className={cn(
              "h-8 text-xs gap-1.5 shadow-sm",
              showTension
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/80 hover:bg-white",
            )}
            onClick={() => onToggleTension(!showTension)}
          >
            🔥 Tension
          </Button>
        )}
        {onToggleLogicCheck && (
          <Button
            variant={showLogicCheck ? "default" : "secondary"}
            size="sm"
            className={cn(
              "h-8 text-xs gap-1.5 shadow-sm",
              showLogicCheck
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-white/80 hover:bg-white",
            )}
            onClick={() => onToggleLogicCheck(!showLogicCheck)}
          >
            ⚠️ Logic
          </Button>
        )}
      </div>

      {/* 하단 타임라인 슬라이더 - 중앙 */}
      {onChapterChange &&
        currentChapter !== undefined &&
        totalChapters !== undefined && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
            <div className="bg-white/80 backdrop-blur-md border border-cloud-200 shadow-xl rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-espresso-500 uppercase tracking-wider">
                <span>Timeline Visualization</span>
                <span>
                  Chapter {currentChapter} / {totalChapters}
                </span>
              </div>
              {/* Simple Slider Implementation using native range for now, or use TimelineSlider component if we imported it here?
                    Actually, NetworkControls is getting crowded. The user requested TimelineSlider as separate component.
                    We should render it in index.tsx instead of inside NetworkControls to keep separation.
                    But wait, NetworkControls was supposed to be the "Controls".
                    The implementation plan said "Modify NetworkControls to add Timeline section".
                    Let's just expose the props and let index.tsx handle layout if possible, or render basic controls here.
                    Actually, let's skip rendering Timeline inside NetworkControls and render it in index.tsx as a parallel sibling.
                    NetworkControls handles the "Menu" at top left.
                */}
            </div>
          </div>
        )}

      {/* 하단 범례 - 인터랙티브 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
        className="absolute left-3 bottom-3 z-20 frosted-glass rounded-xl p-3 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-0.5 h-3 rounded-full bg-mocha-500" />
          <span className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
            범례
          </span>
          <span className="text-[9px] text-espresso-400 ml-auto">
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
                    isActive
                      ? "font-medium text-espresso-800"
                      : "text-espresso-600",
                  )}
                >
                  {RELATION_LABELS[type]}
                </span>

                {/* Active indicator */}
                {isActive && <Eye className="w-3 h-3 text-mocha-500 ml-auto" />}
                {isDimmed && (
                  <EyeOff className="w-3 h-3 text-espresso-300 ml-auto" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
