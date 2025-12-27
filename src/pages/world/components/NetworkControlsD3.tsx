import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RelationType } from "@/components/CharacterGraph/types";
import {
  RELATION_LABELS,
  RELATION_COLORS,
} from "@/components/CharacterGraph/constants";

interface NetworkControlsD3Props {
  relationTypeFilter: RelationType | "all";
  onFilterChange: (value: RelationType | "all") => void;
}

export function NetworkControlsD3({
  relationTypeFilter,
  onFilterChange,
}: NetworkControlsD3Props) {
  return (
    <>
      {/* 좌측 컨트롤 패널 */}
      <div className="absolute left-4 top-4 z-10 bg-white rounded-lg border shadow-sm p-3 space-y-3">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Controls
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8"
            >
              <Filter className="h-4 w-4" />
              Filter View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuRadioGroup
              value={relationTypeFilter}
              onValueChange={(v) => onFilterChange(v as RelationType | "all")}
            >
              <DropdownMenuRadioItem value="all">
                모든 관계
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="friend">
                친구 (초록)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lover">
                연인 (핑크)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="enemy">
                적대 (빨강)
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 하단 범례 */}
      <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg border shadow-sm p-3">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
          Relationship Legend
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5"
              style={{ backgroundColor: RELATION_COLORS.friend }}
            />
            <span>{RELATION_LABELS.friend}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5"
              style={{ backgroundColor: RELATION_COLORS.lover }}
            />
            <span>{RELATION_LABELS.lover}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 border-t-2 border-dashed"
              style={{ borderColor: RELATION_COLORS.enemy }}
            />
            <span>{RELATION_LABELS.enemy}</span>
          </div>
        </div>
      </div>
    </>
  );
}
