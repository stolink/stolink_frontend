import { Layers, ChevronDown, Heart, Users, Skull } from "lucide-react";
import { Button } from "@stolink/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RELATION_LABELS,
  RELATION_COLORS,
  type UIRelationType,
} from "@/components/CharacterGraph/constants";
import { cn } from "@/lib/utils";

// 관계 타입별 아이콘 (컴팩트)
const RELATION_ICONS: Record<UIRelationType, React.ReactNode> = {
  friendly: <Users className="w-2.5 h-2.5" />,
  hostile: <Skull className="w-2.5 h-2.5" />,
  romantic: <Heart className="w-2.5 h-2.5" />,
  mentor: <Layers className="w-2.5 h-2.5" />,
  family: <Users className="w-2.5 h-2.5" />,
  rival: <Skull className="w-2.5 h-2.5" />,
};

interface NetworkControlsD3Props {
  relationTypeFilter: UIRelationType | "all";
  onFilterChange: (value: UIRelationType | "all") => void;
}

export function NetworkControlsD3({
  relationTypeFilter,
  onFilterChange,
}: NetworkControlsD3Props) {
  const activeFilterLabel =
    relationTypeFilter === "all"
      ? "모든 관계"
      : RELATION_LABELS[relationTypeFilter];

  return (
    <>
      {/* 좌측 컨트롤 패널 - Compact */}
      <div className="absolute left-3 top-3 z-20 frosted-glass rounded-lg p-2.5 space-y-2 min-w-[120px] editorial-fade-in">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
            필터
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              intent="outline"
              size="sm"
              className={cn(
                "w-full justify-between gap-1 h-7 text-xs bg-white/80 hover:bg-white border-cloud-200",
                relationTypeFilter !== "all" &&
                  "border-primary/30 bg-primary/5",
              )}
            >
              <span className="flex items-center gap-1">
                {relationTypeFilter !== "all" &&
                  RELATION_ICONS[relationTypeFilter]}
                <span className="font-medium text-xs">{activeFilterLabel}</span>
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-espresso-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuRadioGroup
              value={relationTypeFilter}
              onValueChange={(v) => onFilterChange(v as UIRelationType | "all")}
            >
              <DropdownMenuRadioItem
                value="all"
                className="cursor-pointer text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-cloud-200 to-stone-100 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-cloud-400" />
                  </span>
                  모든 관계
                </span>
              </DropdownMenuRadioItem>
              {(Object.keys(RELATION_LABELS) as UIRelationType[]).map(
                (type) => (
                  <DropdownMenuRadioItem
                    key={type}
                    value={type}
                    className="cursor-pointer text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${RELATION_COLORS[type]}20`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: RELATION_COLORS[type] }}
                        />
                      </span>
                      {RELATION_LABELS[type]}
                    </span>
                  </DropdownMenuRadioItem>
                ),
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Current Filter Indicator */}
        {relationTypeFilter !== "all" && (
          <button
            onClick={() => onFilterChange("all")}
            className="w-full text-[10px] text-espresso-400 hover:text-espresso-600 transition-colors text-center"
          >
            초기화
          </button>
        )}
      </div>

      {/* 하단 범례 - Compact */}
      <div
        className="absolute left-3 bottom-3 z-20 frosted-glass rounded-lg p-2 editorial-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-0.5 h-3 rounded-full bg-primary" />
          <span className="text-[10px] font-semibold text-espresso-500 uppercase tracking-wider">
            범례
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {(Object.keys(RELATION_LABELS) as UIRelationType[]).map((type) => (
            <div
              key={type}
              className={cn(
                "flex items-center gap-2 px-1.5 py-0.5 rounded transition-colors",
                relationTypeFilter === type && "bg-white/80",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${RELATION_COLORS[type]}15` }}
                >
                  {RELATION_ICONS[type]}
                </span>
                <div
                  className="w-5 h-px rounded-full"
                  style={{
                    backgroundColor: RELATION_COLORS[type],
                    ...(type === "hostile" && {
                      background: `repeating-linear-gradient(90deg, ${RELATION_COLORS[type]} 0px, ${RELATION_COLORS[type]} 3px, transparent 3px, transparent 6px)`,
                    }),
                  }}
                />
              </div>
              <span className="text-[10px] text-espresso-600">
                {RELATION_LABELS[type]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
