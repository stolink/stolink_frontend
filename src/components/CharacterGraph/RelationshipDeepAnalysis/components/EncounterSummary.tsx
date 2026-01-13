// =====================================================
// 📍 Encounter Summary Component
// 첫 만남 / 마지막 만남 표시 (Timeline Connect Style)
// =====================================================

import { motion } from "framer-motion";
import { ArrowRight, Calendar, BookOpen } from "lucide-react";
import type { EncounterInfo } from "@/types/relationshipAnalysis";
import { cn } from "@/lib/utils";

interface EncounterSummaryProps {
  firstEncounter?: EncounterInfo;
  lastEncounter?: EncounterInfo;
  onNavigate?: (eventId: string) => void;
  className?: string;
}

function EncounterCard({
  type,
  encounter,
  onNavigate,
  delay = 0,
}: {
  type: "first" | "last";
  encounter: EncounterInfo;
  onNavigate?: (eventId: string) => void;
  delay?: number;
}) {
  const isFirst = type === "first";

  return (
    <motion.div
      className={cn(
        "relative flex-1 group",
        "bg-white rounded-xl border border-cloud-200",
        "shadow-sm hover:shadow-md transition-all duration-300",
        "overflow-hidden",
        onNavigate && "cursor-pointer",
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() => onNavigate?.(encounter.eventId)}
    >
      {/* Decorative Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isFirst
            ? "bg-gradient-to-br from-teal-50/50 to-transparent"
            : "bg-gradient-to-bl from-indigo-50/50 to-transparent",
        )}
      />

      <div className="relative p-4 flex flex-col h-full">
        {/* Label Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
              isFirst
                ? "bg-teal-50 text-teal-700 border border-teal-100"
                : "bg-indigo-50 text-indigo-700 border border-indigo-100",
            )}
          >
            {isFirst ? "The Beginning" : "Current State"}
          </span>
          {onNavigate && (
            <ArrowRight
              className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-1",
                isFirst ? "text-teal-300" : "text-indigo-300",
              )}
            />
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-serif font-bold text-espresso-900 leading-snug mb-2 group-hover:text-mocha-600 transition-colors">
          {encounter.title}
        </h4>

        {/* Meta Info */}
        <div className="mt-auto flex items-center gap-3 text-xs text-espresso-500 font-medium">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 opacity-70" />
            <span>{encounter.chapter}</span>
          </div>
          {encounter.timestamp && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>{encounter.timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function EncounterSummary({
  firstEncounter,
  lastEncounter,
  onNavigate,
  className,
}: EncounterSummaryProps) {
  if (!firstEncounter && !lastEncounter) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Connecting Line (Visual Metaphor for Relationship Journey) */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-teal-200 via-cloud-300 to-indigo-200 -z-10 transform -translate-y-1/2" />

      {/* Center Connector Icon */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 bg-[#F9F9F7] p-2">
        <div className="w-8 h-8 rounded-full bg-white border border-cloud-200 shadow-sm flex items-center justify-center text-mocha-400">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {firstEncounter ? (
          <EncounterCard
            type="first"
            encounter={firstEncounter}
            onNavigate={onNavigate}
            delay={0.1}
          />
        ) : (
          <div />
        )}

        {lastEncounter && firstEncounter?.eventId !== lastEncounter.eventId ? (
          <EncounterCard
            type="last"
            encounter={lastEncounter}
            onNavigate={onNavigate}
            delay={0.2}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default EncounterSummary;
