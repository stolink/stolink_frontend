import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisDiff } from "@/types/analysisTypes";
import { Users, Link2, ChevronRight, Sparkles } from "lucide-react";

interface AnalysisMiniCardProps {
  diff: AnalysisDiff | null;
  isVisible: boolean;
  onExpand: () => void;
  onDismiss: () => void;
}

/**
 * 분석 결과 미니 카드 - 우측 상단에 표시
 * 모달이 닫힌 후에도 분석 결과를 간략히 확인할 수 있음
 */
export const AnalysisMiniCard: React.FC<AnalysisMiniCardProps> = ({
  diff,
  isVisible,
  onExpand,
  onDismiss,
}) => {
  if (!diff) return null;

  const newCharCount = diff.newCharacters.length;
  const updatedCharCount = diff.updatedCharacters.length;
  const newRelCount = diff.newRelations.length;
  const updatedRelCount = diff.updatedRelations.length;
  const removedRelCount = diff.removedRelations?.length || 0;

  const totalChanges =
    newCharCount +
    updatedCharCount +
    newRelCount +
    updatedRelCount +
    removedRelCount;

  const charChanges = newCharCount + updatedCharCount;
  const relChanges = newRelCount + updatedRelCount + removedRelCount;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
          className="absolute top-4 right-4 z-40"
        >
          <div className="group relative cursor-pointer" onClick={onExpand}>
            {/* 글래스모피즘 카드 - 텍스트 선명도 최적화 */}
            <div
              className="relative p-5 min-w-[220px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(145deg, rgba(253, 252, 251, 0.95) 0%, rgba(241, 240, 236, 0.92) 100%)",
                backdropFilter: "blur(16px) saturate(1.2)",
                WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                borderRadius: "1.25rem",
                border: "1px solid rgba(255, 255, 255, 0.7)",
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.4),
                  0 4px 12px rgba(164, 119, 100, 0.08),
                  0 8px 24px rgba(61, 48, 42, 0.06),
                  0 16px 48px rgba(61, 48, 42, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9)
                `,
                // 텍스트 번짐 방지
                isolation: "isolate",
                transform: "translateZ(0)",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              {/* 상단 하이라이트 */}
              <div
                className="absolute top-0 left-4 right-4 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                }}
              />

              {/* Close button - 프리미엄 스타일 */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDismiss();
                }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all z-10"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,244,0.9) 100%)",
                  boxShadow:
                    "0 2px 8px rgba(61,48,42,0.12), 0 4px 16px rgba(61,48,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.6)",
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #A47764 0%, #BD9B8D 100%)",
                    boxShadow:
                      "0 2px 8px rgba(164, 119, 100, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-stone-800">
                    분석 완료
                  </span>
                  <p className="text-[10px] text-stone-400">
                    {totalChanges}개 변경사항
                  </p>
                </div>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-4 h-4 text-mocha-400" />
                </motion.div>
              </div>

              {/* Stats with premium styling */}
              <div className="flex items-center gap-3">
                {charChanges > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(91, 123, 75, 0.08)",
                      border: "1px solid rgba(91, 123, 75, 0.15)",
                    }}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">
                      {charChanges}
                    </span>
                  </div>
                )}
                {relChanges > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">
                      {relChanges}
                    </span>
                  </div>
                )}
              </div>

              {/* Hint */}
              <p className="text-[10px] text-stone-400 mt-3 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-mocha-300" />
                클릭하여 상세 보기
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
