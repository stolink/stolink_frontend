import {
  RefreshCw,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Pencil,
  Check,
  Ban,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ConsistencyReport, Conflict } from "@/types/analysisResult";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InsightsPanelProps {
  projectId: string | null;
  consistencyReport?: ConsistencyReport | null;
  isAnalyzing?: boolean;
  onRefresh?: () => void;
}

// ------------------------------------------------------------------
// 1. Conflict Type Mapping (Korean)
// ------------------------------------------------------------------
const CONFLICT_TYPE_MAP: Record<string, string> = {
  PERSONALITY_CONFLICT: "성격",
  RELATIONSHIP_CONFLICT: "관계",
  TIMELINE_CONFLICT: "타임라인",
  STATUS_CONFLICT: "상태",
  PHYSICAL_CONFLICT: "신체/물리",
  SETTING_CONFLICT: "설정",
  CHARACTER_TRAIT_CONFLICT: "캐릭터 특성",
  INVENTORY_CONFLICT: "아이템/인벤토리",
  STATS_CONFLICT: "스탯/능력치",
  CROSS_CHAPTER_CONFLICT: "챕터 간 모순",
};

/**
 * Helper to get the user-friendly Korean label.
 * Checks if the category ends with "_CONFLICT" and maps it,
 * otherwise returns the category as-is or falls back to "기타".
 */
const getConflictLabel = (category: string) => {
  if (CONFLICT_TYPE_MAP[category]) {
    return CONFLICT_TYPE_MAP[category];
  }
  // If backend sends "PERSONALITY" instead of "PERSONALITY_CONFLICT", try matching
  const keyWithSuffix = `${category}_CONFLICT`;
  if (CONFLICT_TYPE_MAP[keyWithSuffix]) {
    return CONFLICT_TYPE_MAP[keyWithSuffix];
  }
  return category;
};

// ------------------------------------------------------------------
// 2. Score Gauge Component
// ------------------------------------------------------------------
function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 71) return "bg-emerald-500";
    if (s >= 41) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return "우수";
    if (s >= 71) return "양호";
    if (s >= 41) return "주의";
    return "위험";
  };

  const getScoreBgColor = (s: number) => {
    if (s >= 71) return "bg-emerald-50 border-emerald-100";
    if (s >= 41) return "bg-amber-50 border-amber-100";
    return "bg-rose-50 border-rose-100";
  };

  const getScoreTextColor = (s: number) => {
    if (s >= 71) return "text-emerald-700";
    if (s >= 41) return "text-amber-700";
    return "text-rose-700";
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border bg-white shadow-sm",
        getScoreBgColor(score),
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("w-4 h-4", getScoreTextColor(score))} />
          <span className="text-sm font-semibold text-espresso-700">
            일관성 점수
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-2xl font-bold font-serif",
              getScoreTextColor(score),
            )}
          >
            {score}
          </span>
          <span className="text-sm text-mocha-500 font-medium">/100</span>
        </div>
      </div>

      <div className="relative h-2.5 bg-white/60 rounded-full overflow-hidden border border-black/5">
        <motion.div
          className={cn("h-full rounded-full", getScoreColor(score))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-full border",
            getScoreBgColor(score),
            getScoreTextColor(score),
            "border-current/20",
          )}
        >
          {getScoreLabel(score)}
        </span>
        <span className="text-[11px] text-mocha-600 font-medium">
          {score >= 71
            ? "설정 오류가 거의 없습니다"
            : score >= 41
              ? "몇 가지 검토가 필요합니다"
              : "주요 설정 오류가 발견되었습니다"}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. Conflict Card Component (Redesigned)
// ------------------------------------------------------------------
function ConflictCard({
  conflict,
  index,
  onNavigate,
}: {
  conflict: Conflict;
  index: number;
  onNavigate?: (location: Conflict["location"]) => void;
}) {
  const isError = conflict.severity === "critical";
  const mappedCategory = getConflictLabel(conflict.category);

  // Todo: Implement logic handlers
  const handleEdit = () => {
    if (conflict.location) {
      onNavigate?.(conflict.location);
    }
  };
  const handleResolve = () => {};
  const handleIgnore = () => {};
  const handleDelete = () => {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
        isError
          ? "border-rose-100 hover:border-rose-200"
          : "border-amber-100 hover:border-amber-200",
      )}
    >
      {/* Accent Bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors",
          isError ? "bg-rose-400" : "bg-amber-400",
        )}
      />

      <div className="p-4 pl-5">
        {/* Header: Badge & Location */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-md border",
              isError
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-amber-50 text-amber-700 border-amber-100",
            )}
          >
            {mappedCategory}
          </span>

          {/* Location (if available) */}
          {conflict.location && (
            <div className="flex items-center gap-1 text-[11px] text-mocha-400 bg-cloud-50 px-1.5 py-0.5 rounded border border-cloud-100">
              <FileText className="w-3 h-3" />
              <span>Here</span>
              {conflict.location.line && (
                <span className="text-mocha-300">|</span>
              )}
              {conflict.location.line && <span>L{conflict.location.line}</span>}
            </div>
          )}
        </div>

        {/* Content Description */}
        <p className="text-[13px] text-espresso-800 leading-relaxed font-medium mb-3">
          {conflict.description}
        </p>

        {/* AI Suggestion */}
        {conflict.suggestion && (
          <div className="relative pl-3 border-l-2 border-sage-200 py-0.5 mb-4">
            <span className="block text-[10px] font-bold text-sage-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Suggestion
            </span>
            <p className="text-xs text-sage-700 leading-relaxed">
              {conflict.suggestion}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-cloud-100">
          {/* Edit (Primary Action) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-7 px-2 text-xs font-medium text-mocha-600 hover:text-mocha-900 hover:bg-mocha-50 gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            수정
          </Button>

          <div className="flex-1" />

          {/* Subtle Actions Group */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResolve}
              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
              title="해결 완료 처리"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleIgnore}
              className="h-7 w-7 text-mocha-400 hover:text-mocha-600 hover:bg-mocha-50 rounded-full"
              title="이 이슈 무시"
            >
              <Ban className="w-3.5 h-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-mocha-300 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 text-xs gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cloud-50 to-cloud-100 flex items-center justify-center mb-5 shadow-inner border border-white">
        <Lightbulb className="w-9 h-9 text-mocha-300" />
      </div>
      <h4 className="text-base font-bold text-espresso-700 mb-2 font-serif">
        발견된 모순이 없습니다
      </h4>
      <p className="text-sm text-mocha-400 text-center max-w-[240px] leading-relaxed">
        현재 작성된 내용에서 논리적 충돌이나 설정 오류가 발견되지 않았습니다.
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-mocha-100" />
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-mocha-400 border-t-transparent animate-spin" />
        <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-mocha-500" />
      </div>
      <h4 className="text-sm font-bold text-espresso-700 mb-2">
        개연성 분석 중...
      </h4>
      <p className="text-xs text-mocha-500 text-center">
        문서의 일관성을 검토하고 있어요.
      </p>
    </div>
  );
}

export default function InsightsPanel({
  consistencyReport,
  isAnalyzing,
  onRefresh,
}: InsightsPanelProps) {
  // stats removed (unused)

  const handleNavigate = (_location: Conflict["location"]) => {
    // TODO: 에디터에서 해당 위치로 이동하는 로직 이벤트를 상위로 전파하거나 컨텍스트 사용
  };

  return (
    <div className="flex flex-col h-full bg-cloud-50/50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-mocha-100/50 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-espresso-900 font-serif flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
            개연성 검증
          </h3>
          {consistencyReport?.analyzedAt && (
            <p className="text-[11px] text-mocha-400 mt-0.5 pl-6">
              {formatDistanceToNow(new Date(consistencyReport.analyzedAt), {
                addSuffix: true,
                locale: ko,
              })}{" "}
              업데이트
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isAnalyzing}
          className="h-8 text-xs font-medium border-mocha-200 hover:bg-mocha-50 hover:text-mocha-700 transition-all shadow-sm active:scale-95"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isAnalyzing ? "분석 중" : "재검사"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cloud-200 scrollbar-track-transparent p-4">
        {isAnalyzing ? (
          <LoadingState />
        ) : !consistencyReport ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 max-w-md mx-auto">
            {/* Score Gauge */}
            <ScoreGauge score={consistencyReport.score} />

            {/* Conflicts List */}
            {consistencyReport.conflicts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-mocha-500 uppercase tracking-widest">
                    분석 리포트 ({consistencyReport.conflicts.length})
                  </h4>
                  {/* Filter or Sort could go here */}
                </div>

                <AnimatePresence>
                  {consistencyReport.conflicts.map((conflict, index) => (
                    <ConflictCard
                      key={`${conflict.category}-${index}`}
                      conflict={conflict}
                      index={index}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState />
            )}

            {/* Bottom Spacer */}
            <div className="h-10" />
          </div>
        )}
      </div>
    </div>
  );
}
