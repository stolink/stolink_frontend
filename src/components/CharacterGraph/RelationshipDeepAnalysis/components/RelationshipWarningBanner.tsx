// =====================================================
// ⚠️ Relationship Warning Banner Component
// 관계 경고 배너 (비대칭, 긴장 등 위험 신호 표시)
// =====================================================

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Zap } from "lucide-react";
import type { RelationshipWarning } from "@/types/relationshipAnalysis";
import { cn } from "@/lib/utils";

interface RelationshipWarningBannerProps {
  warnings: RelationshipWarning[];
  className?: string;
}

const WARNING_ICONS = {
  asymmetry: TrendingDown,
  tension: Zap,
  conflict: AlertTriangle,
};

const SEVERITY_STYLES = {
  low: "bg-amber-50 border-amber-200 text-amber-800",
  medium: "bg-orange-50 border-orange-200 text-orange-800",
  high: "bg-rose-50 border-rose-200 text-rose-800",
};

const SEVERITY_ICON_STYLES = {
  low: "text-amber-500",
  medium: "text-orange-500",
  high: "text-rose-500",
};

export function RelationshipWarningBanner({
  warnings,
  className,
}: RelationshipWarningBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  // 가장 심각한 경고만 표시 (high > medium > low)
  const sortedWarnings = [...warnings].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const primaryWarning = sortedWarnings[0];
  const Icon = WARNING_ICONS[primaryWarning.type];

  return (
    <motion.div
      className={cn(
        "rounded-lg border px-4 py-3",
        SEVERITY_STYLES[primaryWarning.severity],
        className,
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-1.5 rounded-full bg-white/50",
            SEVERITY_ICON_STYLES[primaryWarning.severity],
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {primaryWarning.message}
          </p>
          {warnings.length > 1 && (
            <p className="text-xs opacity-70 mt-1">
              +{warnings.length - 1}개의 추가 경고
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default RelationshipWarningBanner;
