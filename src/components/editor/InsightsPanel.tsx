import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  X,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ConsistencyReport, Conflict } from "@/types/analysisResult";

interface InsightsPanelProps {
  projectId: string | null;
  consistencyReport?: ConsistencyReport | null;
  isAnalyzing?: boolean;
  onRefresh?: () => void;
}

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
    <div className={cn("p-4 rounded-xl border", getScoreBgColor(score))}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("w-4 h-4", getScoreTextColor(score))} />
          <span className="text-sm font-semibold text-stone-700">
            일관성 점수
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold", getScoreTextColor(score))}>
            {score}
          </span>
          <span className="text-sm text-stone-500">/100</span>
        </div>
      </div>

      <div className="relative h-3 bg-white/80 rounded-full overflow-hidden border border-stone-200/50">
        <motion.div
          className={cn("h-full rounded-full", getScoreColor(score))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            getScoreBgColor(score),
            getScoreTextColor(score),
          )}
        >
          {getScoreLabel(score)}
        </span>
        <span className="text-[10px] text-stone-400">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300",
        "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full before:transition-all",
        isError
          ? "border-rose-100 hover:border-rose-200 before:bg-rose-400 shadow-rose-900/5"
          : "border-amber-100 hover:border-amber-200 before:bg-amber-400 shadow-amber-900/5",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
              isError
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-600",
            )}
          >
            {isError ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </div>
          <span
            className={cn(
              "font-bold text-sm",
              isError ? "text-rose-900" : "text-amber-900",
            )}
          >
            {conflict.category}
          </span>
        </div>
        {conflict.location && (
          <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100">
            <FileText className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] font-medium text-stone-500">
              {conflict.location.chapter}
              {conflict.location.line && ` · ${conflict.location.line}줄`}
            </span>
          </div>
        )}
      </div>

      <div className="text-sm mb-4">
        <p className="text-stone-700 leading-relaxed">{conflict.description}</p>
      </div>

      {conflict.location && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNavigate?.(conflict.location)}
            className="flex-1 h-8 text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 shadow-sm transition-all"
          >
            <ArrowRight className="h-3 w-3 mr-1.5 text-stone-400" />
            위치로 이동
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-cloud-100 flex items-center justify-center mb-4">
        <Lightbulb className="w-8 h-8 text-mocha-400" />
      </div>
      <h4 className="text-sm font-semibold text-stone-700 mb-1">
        분석 결과가 없습니다
      </h4>
      <p className="text-xs text-stone-500 text-center max-w-[200px]">
        문서를 작성하고 분석을 실행하면 일관성 검사 결과가 여기에 표시됩니다.
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-mocha-50 flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 text-mocha-500 animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-stone-700 mb-1">분석 중...</h4>
      <p className="text-xs text-stone-500 text-center">
        AI가 문서의 일관성을 검사하고 있습니다
      </p>
    </div>
  );
}

export default function InsightsPanel({
  consistencyReport,
  isAnalyzing,
  onRefresh,
}: InsightsPanelProps) {
  const criticalCount =
    consistencyReport?.conflicts.filter((c) => c.severity === "critical")
      .length ?? 0;
  const warningCount =
    consistencyReport?.conflicts.filter((c) => c.severity === "warning")
      .length ?? 0;

  const handleNavigate = (location: Conflict["location"]) => {
    // TODO: 에디터에서 해당 위치로 이동하는 로직 구현
    console.log("Navigate to:", location);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/30">
      {/* Header */}
      <div className="px-4 py-3 border-b border-mocha-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-mocha-50 rounded-lg">
            <Lightbulb className="w-3.5 h-3.5 text-mocha-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">인사이트</h3>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isAnalyzing}
          className="h-7 text-xs bg-white border-mocha-200 hover:bg-mocha-50 hover:text-mocha-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1.5" />
          )}
          {isAnalyzing ? "분석 중..." : "다시 분석"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200">
        {isAnalyzing ? (
          <LoadingState />
        ) : !consistencyReport ? (
          <EmptyState />
        ) : (
          <div className="p-4 space-y-4">
            {/* Score Gauge */}
            <ScoreGauge score={consistencyReport.score} />

            {/* Stats Banner */}
            <div className="flex items-center gap-2 p-1 bg-stone-50 rounded-xl border border-stone-200/60 shadow-inner">
              <div
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  criticalCount > 0
                    ? "bg-rose-100 text-rose-700 shadow-sm"
                    : "text-stone-400",
                )}
              >
                <X className="w-3.5 h-3.5" />
                치명 {criticalCount}
              </div>
              <div className="w-px h-6 bg-stone-200" />
              <div
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  warningCount > 0
                    ? "bg-amber-100 text-amber-700 shadow-sm"
                    : "text-stone-400",
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                경고 {warningCount}
              </div>
              <div className="w-px h-6 bg-stone-200" />
              <div
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  criticalCount === 0 && warningCount === 0
                    ? "bg-sage-100 text-sage-700 shadow-sm"
                    : "text-stone-400",
                )}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                정상
              </div>
            </div>

            {/* Conflicts List */}
            {consistencyReport.conflicts.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  발견된 이슈 ({consistencyReport.conflicts.length})
                </h4>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 px-4 bg-sage-50/50 rounded-xl border border-sage-100"
              >
                <CheckCircle className="w-10 h-10 text-sage-500 mb-3" />
                <h4 className="text-sm font-semibold text-sage-700 mb-1">
                  모든 검사 통과!
                </h4>
                <p className="text-xs text-sage-600 text-center">
                  문서에서 설정 오류가 발견되지 않았습니다.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
