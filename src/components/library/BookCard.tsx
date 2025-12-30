import {
  Clock,
  MoreVertical,
  Edit,
  Copy,
  Trash,
  BookOpen,
  Check,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { StatusChip, type ProjectStatusType } from "./StatusChip";

// ✅ API 형식 통일 - 대문자만 사용
export type ProjectStatus = "Writing" | "Complete";

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
  onAction?: (
    action: "rename" | "duplicate" | "delete" | "change_cover",
  ) => void;

  // 상태 변경 콜백
  onStatusChange?: (status: ProjectStatusType) => void;

  // 편집 모드 관련 props
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

/**
 * 프로젝트 상태를 StatusChip에서 사용하는 타입으로 변환
 * API 상태값을 UI에서 사용하는 EDITING/COMPLETED로 정규화
 */
function normalizeStatus(status: ProjectStatus | string): ProjectStatusType {
  const upperStatus =
    typeof status === "string" ? status.toUpperCase() : status;
  switch (upperStatus) {
    case "COMPLETE":
    case "Complete":
      return "Complete";
    case "Writing":
    default:
      return "Writing";
  }
}

export function BookCard({
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

  // 편집 모드에서 onSelect 필수 체크
  if (isEditMode && !onSelect) {
    console.warn("BookCard: onSelect is required when isEditMode=true");
  }

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
        "group relative flex flex-col h-full bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        // 기본 상태: 보더 없이 쉐도우로 깊이감 표현
        !isEditMode && "shadow-sm hover:shadow-xl hover:-translate-y-1",
        // 편집 모드 스타일
        isEditMode && "ring-1 ring-border scale-[0.98]",
        // 선택됨 스타일
        isSelected && "ring-2 ring-primary",
      )}
      onClick={handleCardClick}
    >
      {/* 편집 모드 체크박스 오버레이 */}
      {isEditMode && (
        <div
          className="absolute top-3 left-3 z-30"
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
                ? "border-status-success bg-status-success"
                : "bg-white border-muted-foreground hover:border-status-success",
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}

      {/* Cover Image Area - Vertical Aspect Ratio [3/4] */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted-foreground/5">
        {coverImage ? (
          <>
            {/* Blurred Background Layer (Fill) */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={coverImage}
                alt=""
                className="h-full w-full object-cover blur-2xl opacity-40 scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Main Image Layer (Contain with Shadow) */}
            <div className="relative h-full w-full p-6 flex items-center justify-center">
              <div className="relative h-full w-full shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]">
                <img
                  src={coverImage}
                  alt={title}
                  className="h-full w-full object-contain rounded-sm"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <BookOpen className="h-8 w-8 opacity-30" />
            </div>
          </div>
        )}

        {/* More Options Menu (Top Right) */}
        {!isEditMode && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/20 backdrop-blur-md hover:bg-black/30 text-white rounded-full shadow-sm"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onAction?.("rename")}>
                  <Edit className="mr-2 h-4 w-4" /> 이름 변경
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.("duplicate")}>
                  <Copy className="mr-2 h-4 w-4" /> 복제
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.("change_cover")}>
                  <Image className="mr-2 h-4 w-4" /> 표지 변경
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAction?.("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Title & Author */}
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{author}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto text-xs text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastEdited}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">{length}</div>
        </div>

        {/* Footer: Tags & Status */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          {/* Genre Badge */}
          <div className="flex-1 min-w-0">
            {genre ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground truncate max-w-full">
                {genre}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                No Genre
              </span>
            )}
          </div>

          {/* Status */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {onStatusChange ? (
              <StatusChip
                status={normalizedStatus}
                onStatusChange={onStatusChange}
                disabled={isEditMode}
                className="h-6 text-[10px]"
              />
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    normalizedStatus === "Complete"
                      ? "bg-green-500"
                      : "bg-blue-500",
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
