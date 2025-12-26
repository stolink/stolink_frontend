import { Clock, MoreVertical, Edit, Copy, Trash, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { StatusChip, type ProjectStatusType } from "./StatusChip";

// 레거시 호환용 타입 (기존 코드와의 호환성 유지)
export type ProjectStatus =
  | "DRAFTING"
  | "OUTLINE"
  | "EDITING"
  | "COMPLETED"
  | "IDEA"
  | "writing"
  | "completed";

interface BookCardProps {
  // 프로젝트 ID (상태 변경 및 편집 모드용)
  projectId?: string;
  title: string;
  author: string;
  status: ProjectStatus;
  genre?: string;
  coverImage?: string;
  location?: string;
  length?: string;
  progress: number;
  lastEdited: string;
  onClick?: () => void;
  onAction?: (action: "rename" | "duplicate" | "delete") => void;

  // 상태 변경 콜백
  onStatusChange?: (status: ProjectStatusType) => void;

  // 편집 모드 관련 props
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

/**
 * 프로젝트 상태를 StatusChip에서 사용하는 타입으로 변환
 */
function normalizeStatus(status: ProjectStatus): ProjectStatusType {
  switch (status) {
    case "COMPLETED":
    case "completed":
      return "completed";
    case "DRAFTING":
    case "EDITING":
    case "OUTLINE":
    case "IDEA":
    case "writing":
    default:
      return "writing";
  }
}

export function BookCard({
  projectId,
  title,
  author,
  status,
  genre,
  coverImage,
  length,
  lastEdited,
  onClick,
  onAction,
  onStatusChange,
  isEditMode = false,
  isSelected = false,
  onSelect,
}: BookCardProps) {
  // 정규화된 상태 값
  const normalizedStatus = normalizeStatus(status);

  // 카드 클릭 핸들러 (편집 모드일 때는 선택 동작)
  const handleCardClick = () => {
    if (isEditMode) {
      onSelect?.();
    } else {
      onClick?.();
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full bg-white rounded-lg border shadow-sm transition-all duration-300 overflow-hidden cursor-pointer",
        // 기본 상태
        !isEditMode && "border-stone-200 hover:shadow-md hover:border-primary/30",
        // 편집 모드 스타일
        isEditMode && "border-sage-200 scale-[0.98]",
        // 선택됨 스타일
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={handleCardClick}
    >
      {/* 편집 모드 체크박스 오버레이 */}
      {isEditMode && (
        <div
          className="absolute top-3 left-3 z-20"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center",
              "border-2 shadow-sm transition-all duration-200",
              isSelected
                ? "border-green-500 bg-green-500"
                : "bg-white border-stone-400 hover:border-green-500"
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}

      {/* Cover Image Area */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-stone-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              !isEditMode && "group-hover:scale-105"
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <BookOpen className="h-12 w-12 opacity-50" />
          </div>
        )}

        {/* More Options Menu (Top Right) - 편집 모드가 아닐 때만 표시 */}
        {!isEditMode && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white text-stone-600 rounded-full shadow-sm"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onAction?.("rename")}>
                  <Edit className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.("duplicate")}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAction?.("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <div>
          <h3 className="font-heading text-lg font-bold text-stone-900 leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-stone-400 font-medium">{author}</p>
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5">
          {genre ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-50 text-stone-500 border border-stone-100">
              {genre}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-50 text-stone-300 border border-stone-100">
              No Genre
            </span>
          )}
        </div>

        {/* Last Edited */}
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {lastEdited}</span>
        </div>

        {/* Status Line - StatusChip으로 교체 */}
        <div
          className="pt-3 border-t border-stone-100 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* StatusChip (편집 모드가 아닐 때만 클릭 가능) */}
          {onStatusChange ? (
            <StatusChip
              status={normalizedStatus}
              onStatusChange={onStatusChange}
              disabled={isEditMode}
            />
          ) : (
            // onStatusChange가 없으면 기존 방식으로 표시 (읽기 전용)
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  normalizedStatus === "completed" ? "bg-green-500" : "bg-sage-500"
                )}
              />
              <span className="text-xs font-semibold text-stone-600">
                {normalizedStatus === "completed" ? "Complete" : "Writing"}
              </span>
            </div>
          )}

          {/* Words/Length */}
          {length && <span className="text-xs text-stone-400">{length}</span>}
        </div>
      </div>
    </div>
  );
}
