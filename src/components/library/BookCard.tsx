import {
  Clock,
  MoreVertical,
  Edit,
  Copy,
  Trash,
  BookOpen,
  Check,
  Image,
  Loader2,
} from "lucide-react";
import { Button } from "@/design-system/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatusChip, type ProjectStatusType } from "./StatusChip";
import { useManuscriptJobStore } from "@/stores/useManuscriptJobStore";
import { PerformanceImage } from "@/components/common/PerformanceImage";

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

  // 원고 처리 중인 job 상태 조회
  const jobs = useManuscriptJobStore((state) => state.jobs);
  const job = projectId ? jobs[projectId] : undefined;
  const isProcessing =
    job?.status === "PENDING" || job?.status === "PROCESSING";

  // 편집 모드에서 onSelect 필수 체크
  if (isEditMode && !onSelect) {
    console.warn("BookCard: onSelect is required when isEditMode=true");
  }

  // 카드 클릭 핸들러 (편집 모드일 때는 선택 동작)
  const handleCardClick = () => {
    if (isEditMode || isProcessing) {
      if (isEditMode) onSelect?.();
      return;
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        // 기본 상태: 보더 없이 쉐도우로 깊이감 표현
        !isEditMode &&
          "shadow-paper hover:shadow-paper-hover hover:-translate-y-1 bg-white",
        // 편집 모드 스타일
        isEditMode && "ring-1 ring-cloud-200 scale-[0.98] bg-cloud-50/50",
        // 선택됨 스타일
        isSelected && "ring-2 ring-mocha-500 bg-mocha-50/10",
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
                ? "border-mocha-500 bg-mocha-500"
                : "bg-white border-cloud-300 hover:border-mocha-400",
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}

      {/* Cover Image Area - Vertical Aspect Ratio [3/4] */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cloud-100/50">
        {/* 원고 처리 중 프로그레스 오버레이 */}
        {isProcessing && job && (
          <div className="absolute inset-0 z-40 bg-espresso-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <Progress
              value={job.progress}
              className="w-3/4 h-2 [&>div]:transition-all [&>div]:duration-500 [&>div]:ease-in-out"
            />
            <span className="text-white text-xs text-center font-medium">
              {job.message || "원고 처리 중..."}
            </span>
            <span className="text-white/70 text-[10px]">{job.progress}%</span>
          </div>
        )}
        {coverImage ? (
          <>
            {/* Blurred Background Layer (Fill) */}
            <div className="absolute inset-0 overflow-hidden">
              <PerformanceImage
                src={coverImage}
                alt=""
                className="h-full w-full object-cover blur-2xl opacity-40 scale-125"
                aspectRatio={3 / 4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Main Image Layer (Contain with Shadow) */}
            <div className="relative h-full w-full p-6 flex items-center justify-center">
              <div className="relative h-full w-full shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]">
                <PerformanceImage
                  src={coverImage}
                  alt={title}
                  className="h-full w-full object-contain rounded-sm"
                  aspectRatio={3 / 4}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-mocha-300 gap-2 bg-gradient-to-br from-cloud-50 to-cloud-100">
            <div className="p-4 bg-white/50 rounded-full shadow-inner border border-white/40">
              <BookOpen className="h-8 w-8 opacity-50" />
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
                  className="h-8 w-8 bg-espresso-900/20 backdrop-blur-md hover:bg-espresso-900/40 text-white rounded-full shadow-sm"
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
          <h3 className="font-heading text-lg font-bold text-espresso-900 leading-snug line-clamp-2 mb-1 group-hover:text-mocha-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-espresso-900/60 font-serif">{author}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto text-xs text-espresso-900/50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastEdited}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">{length}</div>
        </div>

        {/* Footer: Tags & Status */}
        <div className="pt-3 border-t border-cloud-200/60 flex items-center justify-between gap-2">
          {/* Genre Badge */}
          <div className="flex-1 min-w-0">
            {genre ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-cloud-100 text-espresso-900/70 truncate max-w-full border border-cloud-200">
                {genre}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-cloud-50 text-espresso-900/40 border border-cloud-100">
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
              />
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cloud-100">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    normalizedStatus === "Complete"
                      ? "bg-sage-500"
                      : "bg-mocha-500",
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
