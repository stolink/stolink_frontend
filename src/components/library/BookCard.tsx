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
import { Button } from "@stolink/ui";
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
  onAction?: (action: "rename" | "clone" | "delete" | "change_cover") => void;

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
        "group relative flex flex-col h-full bg-paper rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-cloud-200",
        // 기본 상태: 클린한 쉐도우와 부드러운 보더
        !isEditMode &&
          "shadow-paper hover:shadow-paper-floating hover:-translate-y-1 hover:border-mocha-300",
        // 편집 모드 스타일
        isEditMode && "ring-2 ring-cloud-200 scale-[0.98] bg-cloud-50",
        // 선택됨 스타일
        isSelected && "ring-2 ring-mocha-500 bg-mocha-50",
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
              "w-6 h-6 rounded-sm flex items-center justify-center",
              "border shadow-sm transition-all duration-200",
              isSelected
                ? "bg-mocha-500 border-mocha-500"
                : "bg-paper border-cloud-200",
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}

      {/* Cover Image Area - Vertical Aspect Ratio [3/4] */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cloud-50 border-b border-cloud-100">
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
                  className="h-full w-full rounded-sm"
                  aspectRatio={3 / 4}
                  objectFit="contain"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-mocha-300 gap-2 bg-gradient-to-br from-paper to-cloud-100">
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
                  intent="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/60 backdrop-blur-md hover:bg-mocha-900/80 text-white rounded-sm shadow-sm"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onAction?.("rename")}>
                  <Edit className="mr-2 h-4 w-4" /> 이름 변경
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.("clone")}>
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
          <h3 className=" font-bold text-lg text-espresso-900 leading-snug line-clamp-2 mb-1 group-hover:text-mocha-500 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-espresso-500">{author}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto text-[10px] text-mocha-600 ">
          <div className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
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
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold bg-mocha-100 text-mocha-700 truncate max-w-full border border-mocha-200 uppercase tracking-wider">
                {genre}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold bg-cloud-100 text-espresso-500 border border-cloud-200 uppercase tracking-wider">
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
