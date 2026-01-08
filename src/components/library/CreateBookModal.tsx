import { FileText, Upload } from "lucide-react";
import { motion } from "framer-motion";
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
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden border-cloud-200 shadow-paper-floating">
        {/* 헤더 */}
        <DialogHeader className="px-8 py-6 border-b border-cloud-100 bg-cloud-50">
          <DialogTitle className="text-xl font-bold text-espresso-900">
            새 작품 만들기
          </DialogTitle>
        </DialogHeader>

        {/* 선택 카드 영역 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-8 bg-paper">
          {/* 빈 문서로 시작 카드 */}
          <motion.button
            onClick={() => {
              onCreateBlank();
              onOpenChange(false);
            }}
            disabled={isCreating}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-5 p-10 rounded-2xl",
              "border-2 border-dashed border-cloud-200 hover:border-mocha-300",
              "bg-white hover:bg-mocha-50/30 transition-colors duration-300",
              "focus:outline-none focus:ring-2 focus:ring-mocha-400 focus:ring-offset-2",
              "shadow-paper hover:shadow-paper-hover",
              isCreating && "opacity-50 cursor-not-allowed",
            )}
          >
            {/* 아이콘 */}
            <motion.div
              className={cn(
                "w-18 h-18 rounded-2xl flex items-center justify-center",
                "bg-mocha-50 group-hover:bg-mocha-100 transition-all duration-300",
                "shadow-sm",
              )}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <FileText
                className={cn(
                  "w-9 h-9 text-mocha-400",
                  "group-hover:text-mocha-600 transition-colors duration-300",
                )}
              />
            </motion.div>

            {/* 텍스트 */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-espresso-900 group-hover:text-mocha-700 transition-colors">
                {isCreating ? "생성 중..." : "빈 문서로 시작"}
              </h3>
              <p className="text-sm text-espresso-500 mt-1.5 leading-relaxed">
                새로운 이야기를 시작하세요
              </p>
            </div>
          </motion.button>

          {/* 기존 원고 불러오기 카드 */}
          <motion.button
            onClick={() => {
              onImport();
              onOpenChange(false);
            }}
            disabled={isCreating}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-5 p-10 rounded-2xl",
              "border-2 border-dashed border-cloud-200 hover:border-sage-300",
              "bg-white hover:bg-sage-50/30 transition-colors duration-300",
              "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
              "shadow-paper hover:shadow-paper-hover",
              isCreating && "opacity-50 cursor-not-allowed",
            )}
          >
            {/* 아이콘 */}
            <motion.div
              className={cn(
                "w-18 h-18 rounded-2xl flex items-center justify-center",
                "bg-sage-50 group-hover:bg-sage-100 transition-all duration-300",
                "shadow-sm",
              )}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <Upload
                className={cn(
                  "w-9 h-9 text-sage-500",
                  "group-hover:text-sage-600 transition-colors duration-300",
                )}
              />
            </motion.div>

            {/* 텍스트 */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-espresso-900 group-hover:text-sage-700 transition-colors">
                기존 원고 불러오기
              </h3>
              <p className="text-sm text-espresso-500 mt-1.5 leading-relaxed">
                TXT, MD 파일 지원
              </p>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
