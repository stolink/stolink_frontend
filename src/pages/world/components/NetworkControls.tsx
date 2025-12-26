import { ZoomIn, ZoomOut, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type RelationType, relationshipLabels } from "../constants";

interface NetworkControlsProps {
  relationTypeFilter: RelationType | "all";
  onFilterChange: (value: RelationType | "all") => void;
}

export function NetworkControls({
  relationTypeFilter,
  onFilterChange,
}: NetworkControlsProps) {
  return (
    <>
      {/* 좌측 컨트롤 패널 */}
      <div className="absolute left-4 top-4 z-10 bg-white rounded-lg border shadow-sm p-3 space-y-3">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Controls
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-stone-600">100%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ZoomIn className="h-4 w-4" />
          </Button>
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
              <DropdownMenuRadioItem value="friendship">
                우호적 (초록)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="conflict">
                적대적 (빨강)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="romance">
                로맨스 (핑크)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="family">
                가족 (검정)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="neutral">
                중립 (회색)
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8"
        >
          <Save className="h-4 w-4" />
          Save Layout
        </Button>
      </div>

      {/* 하단 범례 */}
      <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg border shadow-sm p-3">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
          Relationship Legend
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500" />
            <span>{relationshipLabels.friendship}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500" />
            <span>{relationshipLabels.conflict}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-pink-500" />
            <span>{relationshipLabels.romance}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-stone-800" />
            <span>{relationshipLabels.family}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-stone-400" />
            <span>{relationshipLabels.neutral}</span>
          </div>
        </div>
      </div>
    </>
  );
}
