import { useMemo } from "react";
import {
  RefreshCw,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Check,
  Ban,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ConsistencyReport, Conflict } from "@/types/analysisResult";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/useUIStore";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

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
 */
const getConflictLabel = (category: string) => {
  if (CONFLICT_TYPE_MAP[category]) {
    return CONFLICT_TYPE_MAP[category];
  }
  const keyWithSuffix = `${category}_CONFLICT`;
  if (CONFLICT_TYPE_MAP[keyWithSuffix]) {
    return CONFLICT_TYPE_MAP[keyWithSuffix];
  }
  return category;
};

// ------------------------------------------------------------------
// 2. Validation Summary Component (Replaces ScoreGauge)
// ------------------------------------------------------------------
import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import type { ConsistencyStats } from "@/types/analysisResult";

function ValidationSummary({ stats }: { stats: ConsistencyStats }) {
  const hasCritical = stats.critical > 0;
  const hasWarning = stats.warning > 0;
  const isHealthy = !hasCritical && !hasWarning;

  const getStatusColor = () => {
    if (hasCritical) return "bg-rose-50 border-rose-100";
    if (hasWarning) return "bg-amber-50 border-amber-100";
    return "bg-emerald-50 border-emerald-100";
  };

  const getStatusIcon = () => {
    if (hasCritical) return <AlertCircle className="w-5 h-5 text-rose-600" />;
    if (hasWarning) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
  };

  const getStatusTitle = () => {
    if (hasCritical) return "수정이 필요한 항목이 있습니다";
    if (hasWarning) return "검토가 필요한 항목이 있습니다";
    return "설정 충돌이 발견되지 않았습니다";
  };

  const getStatusDescription = () => {
    if (hasCritical)
      return "스토리 진행에 영향을 줄 수 있는 중대한 설정 오류가 발견되었습니다.";
    if (hasWarning)
      return "사소한 설정 불일치가 발견되었습니다. 내용을 확인해보세요.";
    return "현재까지 작성된 내용에서 설정 오류가 발견되지 않았습니다.";
  };

  return (
    <div
      className={cn(
        "p-5 rounded-xl border shadow-sm transition-colors duration-300",
        getStatusColor(),
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-full flex items-center justify-center shrink-0",
            hasCritical
              ? "bg-rose-100"
              : hasWarning
                ? "bg-amber-100"
                : "bg-emerald-100",
          )}
        >
          {getStatusIcon()}
        </div>
        <div className="flex-1 pt-1">
          <h4 className="text-sm font-bold text-espresso-800 mb-1">
            {getStatusTitle()}
          </h4>
          <p className="text-xs text-mocha-600 leading-relaxed">
            {getStatusDescription()}
          </p>
        </div>
      </div>

      {!isHealthy && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3 border border-rose-100/50 flex flex-col items-center">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
              Critical
            </span>
            <span className="text-xl font-bold text-rose-700">
              {stats.critical}
            </span>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-amber-100/50 flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">
              Warning
            </span>
            <span className="text-xl font-bold text-amber-700">
              {stats.warning}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// 3. Conflict Card Component (AI-first Flow)
// ------------------------------------------------------------------
function ConflictCard({
  conflict,
  displayIndex,
  originalIndex,
}: {
  conflict: Conflict;
  displayIndex: number;
  originalIndex: number;
}) {
  const isError = conflict.severity === "critical";
  const mappedCategory = getConflictLabel(conflict.category);

  const status = useAnalysisBufferStore(
    (state) => state.processedConflicts[conflict.id],
  );
  const markStatus = useAnalysisBufferStore(
    (state) => state.markConflictStatus,
  );
  const setPendingMessage = useUIStore(
    (state) => state.setPendingAIChatMessage,
  );
  const setTab = useUIStore((state) => state.setRightSidebarTab);
  const setOpen = useUIStore((state) => state.setRightSidebarOpen);

  const handleAIAsk = () => {
    const prompt = `[#개연성리포트_${originalIndex + 1}] 이 모순에 대해 너가 아는 모든 작품 설정을 바탕으로 구체적인 해결책을 제안해줘.`;

    setPendingMessage(prompt);
    setTab("ai");
    setOpen(true);
  };

  const handleResolve = () => {
    markStatus(conflict.id, "resolved");
  };

  const handleIgnore = () => {
    markStatus(conflict.id, "ignored");
  };

  const handleDelete = () => {
    markStatus(conflict.id, "deleted");
  };

  const isResolved = status === "resolved";
  const isDeletedOrIgnored = status === "deleted" || status === "ignored";

  if (isDeletedOrIgnored) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: displayIndex * 0.05 }}
      className={cn(
        "group relative bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
        isError
          ? "border-rose-100 hover:border-rose-200"
          : "border-amber-100 hover:border-amber-200",
        isResolved && "opacity-60 grayscale-[0.3]",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors",
          isResolved
            ? "bg-emerald-400"
            : isError
              ? "bg-rose-400"
              : "bg-amber-400",
        )}
      />

      <div className="p-4 pl-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-md border",
                isResolved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : isError
                    ? "bg-rose-50 text-rose-700 border-rose-100"
                    : "bg-amber-50 text-amber-700 border-amber-100",
              )}
            >
              #{originalIndex + 1}
            </span>
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-md border",
                isResolved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : isError
                    ? "bg-rose-50 text-rose-700 border-rose-100"
                    : "bg-amber-50 text-amber-700 border-amber-100",
              )}
            >
              {isResolved ? "해결됨" : mappedCategory}
            </span>
          </div>

          {conflict.location && (
            <div className="flex items-center gap-1 text-[11px] text-mocha-300 bg-cloud-50/50 px-2 py-0.5 rounded border border-mocha-100/10">
              <FileText className="w-3 h-3" />
              <span>{conflict.location.chapter || "본문"}</span>
              {conflict.location.line && <span className="opacity-30">|</span>}
              {conflict.location.line && <span>L{conflict.location.line}</span>}
            </div>
          )}
        </div>

        <p
          className={cn(
            "text-[13px] text-espresso-800 leading-relaxed font-medium mb-3",
            isResolved && "line-through text-mocha-400",
          )}
        >
          {conflict.description}
        </p>

        {conflict.suggestion && !isResolved && (
          <div className="relative pl-3 border-l-2 border-sage-200 py-0.5 mb-4">
            <span className="block text-[10px] font-bold text-sage-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Suggestion
            </span>
            <p className="text-xs text-sage-700 leading-relaxed">
              {conflict.suggestion}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-cloud-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAIAsk}
            disabled={isResolved}
            className="flex-1 h-8 text-[11px] font-bold gap-1.5 border border-mocha-100/50 text-mocha-600 hover:bg-mocha-50 hover:text-mocha-700 transition-all duration-300 rounded-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI에게 질문
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResolve}
              className={cn(
                "h-7 w-7 rounded-full transition-colors",
                isResolved
                  ? "text-emerald-500 bg-emerald-50"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
              )}
              title={isResolved ? "해결 완료됨" : "해결 완료 처리"}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>

            {!isResolved && (
              <>
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
              </>
            )}
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

function ConflictList({
  visibleConflicts,
  fullConflicts = [],
}: {
  visibleConflicts: Conflict[];
  fullConflicts?: Conflict[];
}) {
  const processedConflicts = useAnalysisBufferStore(
    (state) => state.processedConflicts,
  );

  const conflictsWithIndices = useMemo(() => {
    return visibleConflicts
      .map((c) => {
        const originalIndex = fullConflicts.findIndex((fc) => fc.id === c.id);
        return {
          conflict: c,
          originalIndex: originalIndex >= 0 ? originalIndex : 0,
        };
      })
      .filter(
        ({ conflict: c }) =>
          !processedConflicts[c.id] || processedConflicts[c.id] === "resolved",
      );
  }, [visibleConflicts, fullConflicts, processedConflicts]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-mocha-500 uppercase tracking-widest">
          분석 리포트 ({conflictsWithIndices.length})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            useAnalysisBufferStore.getState().clearProcessedConflicts()
          }
          className="h-6 text-[10px] text-mocha-400 hover:text-mocha-600"
        >
          내역 초기화
        </Button>
      </div>

      <AnimatePresence>
        {conflictsWithIndices.map(({ conflict, originalIndex }, index) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            displayIndex={index}
            originalIndex={originalIndex}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function InsightsPanel({
  consistencyReport,
  isAnalyzing,
  onRefresh,
}: InsightsPanelProps) {
  const visibleConflicts = useMemo(() => {
    if (!consistencyReport) return [];
    // DEBUG: 데이터 확인용 로그
    console.log(
      "[InsightsPanel] conflicts:",
      consistencyReport.conflicts.map((c) => ({
        id: c.id,
        suggestedAction: c.suggestedAction,
        description: c.description.slice(0, 30),
      })),
    );
    // FLAG_FOR_HUMAN만 필터링하여 사용자에게 표시
    return consistencyReport.conflicts.filter(
      (c) => c.suggestedAction === "FLAG_FOR_HUMAN",
    );
  }, [consistencyReport]);

  // [UX Fix]Backend stats may include hidden/internal conflicts, causing "low score" confusion.
  // We strictly calculate stats based on what the USER SEES (visibleConflicts).
  const derivedStats = useMemo(() => {
    return {
      critical: visibleConflicts.filter((c) => c.severity === "critical")
        .length,
      warning: visibleConflicts.filter((c) => c.severity === "warning").length,
      fixable: 0, // FLAG_FOR_HUMAN implies manual review needed
    };
  }, [visibleConflicts]);

  return (
    <div className="flex flex-col h-full bg-cloud-50/50">
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-mocha-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 box-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-mocha-100 rounded-lg">
            <Lightbulb className="w-3.5 h-3.5 text-mocha-700" />
          </div>
          <h3 className="text-sm font-bold text-espresso-900">개연성 검증</h3>
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

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cloud-200 scrollbar-track-transparent p-4">
        {isAnalyzing ? (
          <LoadingState />
        ) : !consistencyReport ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 max-w-md mx-auto">
            <ValidationSummary stats={derivedStats} />
            {visibleConflicts.length > 0 ? (
              <ConflictList
                visibleConflicts={visibleConflicts}
                fullConflicts={consistencyReport.conflicts}
              />
            ) : (
              <EmptyState />
            )}
            <div className="h-10" />
          </div>
        )}
      </div>
    </div>
  );
}
