// =====================================================
// 💡 Insights Panel Component
// 결정적 트리거 + 키워드 클라우드
// =====================================================

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Tag } from "lucide-react";
import type { RelationshipInsights } from "@/types/relationshipAnalysis";
import { Badge } from "@stolink/ui";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  /** 인사이트 데이터 */
  insights: RelationshipInsights;
  /** 애니메이션 딜레이 (초) */
  animationDelay?: number;
  /** 추가 클래스 */
  className?: string;
}

// 키워드별 색상 매핑
const KEYWORD_COLORS: Record<string, string> = {
  갈등: "bg-rose-50 border-rose-200 text-rose-700",
  대결: "bg-orange-50 border-orange-200 text-orange-700",
  배신: "bg-red-50 border-red-200 text-red-700",
  신뢰: "bg-teal-50 border-teal-200 text-teal-700",
  화해: "bg-green-50 border-green-200 text-green-700",
  동맹: "bg-mocha-50 border-mocha-200 text-mocha-700",
  대화: "bg-slate-50 border-slate-200 text-slate-700",
  발견: "bg-amber-50 border-amber-200 text-amber-700",
  폭로: "bg-purple-50 border-purple-200 text-purple-700",
  변화: "bg-indigo-50 border-indigo-200 text-indigo-700",
  해결: "bg-emerald-50 border-emerald-200 text-emerald-700",
  로맨스: "bg-pink-50 border-pink-200 text-pink-700",
};

const DEFAULT_KEYWORD_COLOR = "bg-cloud-50 border-cloud-200 text-espresso-700";

export function InsightsPanel({
  insights,
  animationDelay = 0,
  className,
}: InsightsPanelProps) {
  const { decisiveTrigger, keywords } = insights;

  return (
    <motion.div
      className={cn(
        "rounded-xl p-5",
        "bg-white",
        "border border-cloud-200 shadow-sm",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
    >
      {/* Section Header */}
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.1 }}
      >
        <div className="p-1.5 rounded-lg bg-indigo-50">
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </div>
        <h4 className="text-base font-semibold text-espresso-800 uppercase tracking-wider">
          관계 인사이트
        </h4>
      </motion.div>

      {/* Decisive Trigger */}
      <motion.div
        className={cn(
          "mb-5 p-4 rounded-lg",
          "bg-gradient-to-r from-orange-50 to-orange-100/50",
          "border border-orange-100",
        )}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay + 0.2 }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white shadow-sm mt-0.5">
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                결정적 전환점
              </span>
              {decisiveTrigger?.impact && (
                <Badge
                  intent="outline"
                  className="text-xs px-1.5 py-0 h-4 border-orange-200 text-orange-600 bg-white/50"
                >
                  Impact: {decisiveTrigger.impact}/10
                </Badge>
              )}
            </div>
            {decisiveTrigger ? (
              <>
                <h5 className="text-lg font-bold text-espresso-900 mb-1.5 font-serif">
                  {decisiveTrigger.title}
                </h5>
                <p className="text-base text-espresso-600 leading-relaxed line-clamp-3">
                  {decisiveTrigger.summary}
                </p>
              </>
            ) : (
              <p className="text-sm text-espresso-400 italic">
                아직 결정적인 전환점이 발견되지 않았습니다.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Keywords */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-espresso-400" />
          <span className="text-sm font-medium text-espresso-500">
            주요 키워드
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.length > 0 ? (
            keywords.map((keyword, index) => (
              <motion.span
                key={keyword}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold border",
                  KEYWORD_COLORS[keyword] || DEFAULT_KEYWORD_COLOR,
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: animationDelay + 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                {keyword}
              </motion.span>
            ))
          ) : (
            <span className="text-xs text-espresso-400 italic">
              키워드가 추출되지 않았습니다
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default InsightsPanel;
