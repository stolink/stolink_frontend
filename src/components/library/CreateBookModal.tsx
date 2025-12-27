import { FileText, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CreateBookModalProps {
  // 모달 열림 상태
  open: boolean;
  // 모달 상태 변경 콜백
  onOpenChange: (open: boolean) => void;
  // 빈 문서로 시작 클릭 콜백
  onCreateBlank: () => void;
  // 기존 원고 불러오기 클릭 콜백
  onImport: () => void;
  // 생성 중 상태 (버튼 비활성화용)
  isCreating?: boolean;
}

/**
 * 새 작품 만들기 선택 모달
 * - 빈 문서로 시작: 새 프로젝트 생성 후 에디터로 이동
 * - 기존 원고 불러오기: 파일 탐색기 열기
 */
export function CreateBookModal({
  open,
  onOpenChange,
  onCreateBlank,
  onImport,
  isCreating = false,
}: CreateBookModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* 헤더 */}
        <DialogHeader className="px-6 py-5 border-b border-stone-100">
          <DialogTitle className="text-xl font-heading font-bold text-ink">
            새 작품 만들기
          </DialogTitle>
        </DialogHeader>

        {/* 선택 카드 영역 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          {/* 빈 문서로 시작 카드 */}
          <button
            onClick={() => {
              onCreateBlank();
              onOpenChange(false);
            }}
            disabled={isCreating}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl",
              "border-2 border-dashed border-stone-200 hover:border-sage-400",
              "bg-white hover:bg-sage-50/50 transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
              isCreating && "opacity-50 cursor-not-allowed",
            )}
          >
            {/* 아이콘 */}
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                "bg-stone-50 group-hover:bg-sage-100 transition-colors duration-300",
              )}
            >
              <FileText
                className={cn(
                  "w-8 h-8 text-stone-400",
                  "group-hover:text-sage-600 transition-colors duration-300",
                )}
              />
            </div>

            {/* 텍스트 */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-stone-900 group-hover:text-sage-700 transition-colors">
                {isCreating ? "생성 중..." : "빈 문서로 시작"}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                새로운 이야기를 시작하세요
              </p>
            </div>
          </button>

          {/* 기존 원고 불러오기 카드 */}
          <button
            onClick={() => {
              onImport();
              onOpenChange(false);
            }}
            disabled={isCreating}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl",
              "border-2 border-dashed border-stone-200 hover:border-sage-400",
              "bg-white hover:bg-sage-50/50 transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
              isCreating && "opacity-50 cursor-not-allowed",
            )}
          >
            {/* 아이콘 */}
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                "bg-stone-50 group-hover:bg-sage-100 transition-colors duration-300",
              )}
            >
              <Upload
                className={cn(
                  "w-8 h-8 text-stone-400",
                  "group-hover:text-sage-600 transition-colors duration-300",
                )}
              />
            </div>

            {/* 텍스트 */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-stone-900 group-hover:text-sage-700 transition-colors">
                기존 원고 불러오기
              </h3>
              <p className="text-sm text-stone-500 mt-1">TXT, MD 파일 지원</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
