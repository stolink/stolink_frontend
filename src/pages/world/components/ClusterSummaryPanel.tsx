import { X, Network, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Button, Badge } from "@stolink/ui";
import type { ClusterLink } from "@/components/CharacterGraph/CanvasGraph/types";
import { cn } from "@/lib/utils";

interface ClusterSummaryPanelProps {
  selectedLink: ClusterLink | null;
  onClose: () => void;
}

export function ClusterSummaryPanel({
  selectedLink,
  onClose,
}: ClusterSummaryPanelProps) {
  if (!selectedLink) return null;

  // Faction 이름 파싱 (source, target이 faction name이거나 ClusterNode 객체일 수 있음)
  const sourceName =
    typeof selectedLink.source === "string"
      ? selectedLink.source.replace("cluster-", "")
      : (selectedLink.source as unknown as { factionName?: string })
          .factionName || "Unknown";

  const targetName =
    typeof selectedLink.target === "string"
      ? selectedLink.target.replace("cluster-", "")
      : (selectedLink.target as unknown as { factionName?: string })
          .factionName || "Unknown";

  const { count, strength, dominantType, typeBreakdown } = selectedLink;

  // 전체 대비 비율 계산
  const total = count || 1;
  const friendlyPercent = Math.round(
    ((typeBreakdown?.friendly || 0) / total) * 100,
  );
  const hostilePercent = Math.round(
    ((typeBreakdown?.hostile || 0) / total) * 100,
  );
  const otherPercent = 100 - friendlyPercent - hostilePercent;

  // 테마 색상 결정
  const themeColor =
    dominantType === "friendly"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : dominantType === "hostile"
        ? "text-rose-600 bg-rose-50 border-rose-200"
        : "text-purple-600 bg-purple-50 border-purple-200";

  return (
    <div className="absolute right-4 top-4 w-80 z-20 bg-white border border-cloud-200 rounded-2xl overflow-hidden flex flex-col editorial-fade-in shadow-paper-floating">
      {/* Header */}
      <div className="p-5 bg-white border-b border-cloud-100">
        <div className="flex items-start justify-between mb-3">
          <Badge
            intent="outline"
            className={cn("text-xs font-bold px-2 py-0.5", themeColor)}
          >
            {dominantType === "friendly"
              ? "우호적 관계"
              : dominantType === "hostile"
                ? "적대적 관계"
                : "복합적 관계"}
          </Badge>
          <Button
            intent="ghost"
            size="icon"
            className="h-7 w-7 text-espresso-400 hover:text-espresso-600 -mr-2 -mt-2 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex-1 text-center p-2 rounded-lg bg-cloud-50">
            <span className="text-xs font-bold text-espresso-700 block truncate">
              {sourceName}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-cloud-400 flex-shrink-0" />
          <div className="flex-1 text-center p-2 rounded-lg bg-cloud-50">
            <span className="text-xs font-bold text-espresso-700 block truncate">
              {targetName}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-cloud-50 border border-cloud-100 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Network className="h-3.5 w-3.5 text-mocha-500" />
              <span className="text-[10px] font-bold text-espresso-400 uppercase">
                총 연결 수
              </span>
            </div>
            <div className="text-xl font-bold text-espresso-900">{count}</div>
          </div>
          <div className="p-3 bg-cloud-50 border border-cloud-100 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-mocha-500" />
              <span className="text-[10px] font-bold text-espresso-400 uppercase">
                평균 강도
              </span>
            </div>
            <div className="text-xl font-bold text-espresso-900">
              {strength.toFixed(1)}
              <span className="text-xs text-espresso-400 font-normal ml-1">
                / 10
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-espresso-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-mocha-400" />
            관계 분포
          </h4>

          <div className="h-2.5 w-full bg-cloud-100 rounded-full overflow-hidden flex">
            {friendlyPercent > 0 && (
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${friendlyPercent}%` }}
              />
            )}
            {hostilePercent > 0 && (
              <div
                className="h-full bg-rose-500"
                style={{ width: `${hostilePercent}%` }}
              />
            )}
            {otherPercent > 0 && (
              <div
                className="h-full bg-purple-400"
                style={{ width: `${otherPercent}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-espresso-500 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>우호 {friendlyPercent}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>적대 {hostilePercent}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span>기타 {otherPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
