// =====================================================
// 🎯 Relationship Deep Analysis Modal
// 캐릭터 관계 심층 분석 메인 모달 컴포넌트 (Enhanced Design)
// =====================================================

import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ArrowLeftRight, Activity, Calendar } from "lucide-react";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { CharacterPortraitPanel } from "./components/CharacterPortraitPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { RelationshipTimelineGraph } from "./components/RelationshipTimelineGraph";
import { RelationshipWarningBanner } from "./components/RelationshipWarningBanner";
import { EncounterSummary } from "./components/EncounterSummary";
import { SharedScenesPanel } from "./components/SharedScenesPanel";
import { Badge } from "@stolink/ui";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";

interface RelationshipDeepAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RelationshipDeepAnalysisData | null;
  onNavigateToEvent?: (eventId: string) => void;
}

// 관계 타입 라벨
const RELATION_TYPE_LABELS: Record<string, string> = {
  ALLY: "동맹",
  FRIEND: "친구",
  RIVAL: "라이벌",
  ENEMY: "적",
  ROMANTIC: "연인",
  MENTOR: "스승",
  FAMILY: "가족",
  NEUTRAL: "중립",
  MASTER_SERVANT: "주종",
  COWORKER: "동료",
  CLASSMATE: "동창",
  COMPLEX: "애증",
};

// 관계 타입 스타일 (배경색, 텍스트색, 테두리색)
const RELATION_TYPE_STYLES: Record<string, string> = {
  ALLY: "bg-teal-50 text-teal-700 border-teal-200",
  FRIEND: "bg-green-50 text-green-700 border-green-200",
  RIVAL: "bg-orange-50 text-orange-700 border-orange-200",
  ENEMY: "bg-rose-50 text-rose-700 border-rose-200",
  ROMANTIC: "bg-pink-50 text-pink-700 border-pink-200",
  MENTOR: "bg-mocha-50 text-mocha-700 border-mocha-200",
  FAMILY: "bg-purple-50 text-purple-700 border-purple-200",
  NEUTRAL: "bg-cloud-100 text-espresso-600 border-cloud-200",
  MASTER_SERVANT: "bg-violet-50 text-violet-700 border-violet-200",
  COWORKER: "bg-sky-50 text-sky-700 border-sky-200",
  CLASSMATE: "bg-lime-50 text-lime-700 border-lime-200",
  COMPLEX: "bg-slate-100 text-slate-700 border-slate-200",
};

export function RelationshipDeepAnalysisModal({
  isOpen,
  onClose,
  data,
  onNavigateToEvent,
}: RelationshipDeepAnalysisModalProps) {
  if (!data) return null;

  const {
    sourceCharacter,
    targetCharacter,
    sourceToTargetAttributes,
    targetToSourceAttributes,
    timeline,
    insights,
    relationshipType,
    currentStrength,
    since,
    warnings,
    firstEncounter,
    lastEncounter,
    sharedScenes,
  } = data;

  const safeType = data.relationshipType || "NEUTRAL";
  const typeKey = (
    typeof safeType === "string" ? safeType : "NEUTRAL"
  ).toUpperCase();
  const typeLabel = RELATION_TYPE_LABELS[typeKey] || relationshipType;
  const typeStyle =
    RELATION_TYPE_STYLES[typeKey] ||
    "bg-mocha-50 text-mocha-700 border-mocha-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
          <DialogPrimitive.Portal>
            {/* Backdrop */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[150] bg-espresso-900/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </DialogPrimitive.Overlay>

            {/* Modal Content */}
            <DialogPrimitive.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-[151]",
                  "w-[95vw] max-w-[900px] max-h-[92vh]",
                  "overflow-hidden rounded-2xl",
                  "bg-[#FDFDFD]", // Warm white background
                  "shadow-2xl shadow-espresso-900/20",
                )}
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header (Premium Look) */}
                <div className="relative px-8 py-5 border-b border-cloud-200 bg-white/80 backdrop-blur-sm z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Subtitle / Context */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-espresso-400 uppercase tracking-widest">
                          Relationship Log
                        </span>
                        <div className="h-px w-8 bg-cloud-300" />
                      </div>

                      {/* Character Names */}
                      <h2 className="text-2xl font-serif font-bold text-espresso-900 flex items-center gap-3">
                        <span className="text-espresso-800">
                          {sourceCharacter.name}
                        </span>
                        <span className="text-cloud-300 font-light text-xl">
                          &times;
                        </span>
                        <span className="text-espresso-800">
                          {targetCharacter.name}
                        </span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Strength Meter */}
                      <div className="flex flex-col items-end mr-2">
                        <span className="text-[10px] font-bold text-espresso-400 uppercase tracking-wider">
                          Bond Strength
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1 h-3 rounded-full transition-all",
                                  i < currentStrength
                                    ? "bg-mocha-500"
                                    : "bg-cloud-200",
                                )}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-sm font-bold text-mocha-600 font-serif">
                            {currentStrength}
                          </span>
                        </div>
                      </div>

                      {/* Relationship Badge */}
                      <div
                        className={cn(
                          "px-4 py-1.5 rounded-full border text-sm font-bold shadow-sm",
                          typeStyle,
                        )}
                      >
                        {typeLabel}
                      </div>

                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="ml-2 rounded-full w-8 h-8 text-espresso-400 hover:text-espresso-900 hover:bg-cloud-100"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Meta Info Bar */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-espresso-500 font-medium">
                    {since && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cloud-50 border border-cloud-100">
                        <Calendar className="w-3.5 h-3.5 text-mocha-400" />
                        Started from{" "}
                        <span className="text-espresso-800">{since}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cloud-50 border border-cloud-100">
                      <Activity className="w-3.5 h-3.5 text-mocha-400" />
                      Last Active:{" "}
                      <span className="text-espresso-800">Chapter 12</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(92vh-100px)] bg-[#FAFAF8]">
                  {" "}
                  {/* Warm grey background */}
                  <div className="p-8 space-y-8 max-w-4xl mx-auto">
                    {/* === SECTION 1: WARNINGS === */}
                    {warnings && warnings.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <RelationshipWarningBanner warnings={warnings} />
                      </motion.div>
                    )}

                    {/* === SECTION 2: CURRENT STATE (Radar Charts) === */}
                    <section>
                      <h3 className="flex items-center gap-3 text-sm font-bold text-espresso-400 uppercase tracking-widest mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-mocha-400" />
                        Current Dynamics
                        <div className="h-px flex-1 bg-cloud-200/50" />
                      </h3>

                      <motion.div
                        className="grid grid-cols-2 gap-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {/* Card Container Style */}
                        <div className="bg-white rounded-2xl border border-cloud-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-1 hover:shadow-lg transition-shadow duration-500">
                          {/* Inner Content */}
                          <CharacterPortraitPanel
                            character={sourceCharacter}
                            attributes={sourceToTargetAttributes}
                            targetName={targetCharacter.name}
                            position="left"
                            animationDelay={0.3}
                          />
                        </div>

                        <div className="bg-white rounded-2xl border border-cloud-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-1 hover:shadow-lg transition-shadow duration-500">
                          <CharacterPortraitPanel
                            character={targetCharacter}
                            attributes={targetToSourceAttributes}
                            targetName={sourceCharacter.name}
                            position="right"
                            animationDelay={0.4}
                          />
                        </div>
                      </motion.div>
                    </section>

                    {/* === SECTION 3: JOURNEY (Encounter & Timeline) === */}
                    <section>
                      <h3 className="flex items-center gap-3 text-sm font-bold text-espresso-400 uppercase tracking-widest mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Relationship Journey
                        <div className="h-px flex-1 bg-cloud-200/50" />
                      </h3>

                      <div className="space-y-6">
                        {/* Timeline Connector */}
                        {(firstEncounter || lastEncounter) && (
                          <EncounterSummary
                            firstEncounter={firstEncounter}
                            lastEncounter={lastEncounter}
                            onNavigate={onNavigateToEvent}
                          />
                        )}

                        {/* Timeline Graph */}
                        <motion.div
                          className="bg-white rounded-2xl border border-cloud-200 shadow-sm p-6"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                              <span className="text-sm font-bold text-espresso-800">
                                Timeline Analysis
                              </span>
                            </div>
                            <Badge
                              intent="secondary"
                              className="text-[10px] bg-cloud-100 text-espresso-500"
                            >
                              Last 6 Months
                            </Badge>
                          </div>

                          <RelationshipTimelineGraph
                            data={timeline}
                            width={820}
                            height={220}
                            animationDelay={0.6}
                          />
                        </motion.div>
                      </div>
                    </section>

                    {/* === SECTION 4: INSIGHTS & SCENES === */}
                    <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                      {/* Left: Insights */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-3 text-sm font-bold text-espresso-400 uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Key Insights
                        </h3>
                        <InsightsPanel
                          insights={insights}
                          animationDelay={0.6}
                        />
                      </div>

                      {/* Right: Shared Scenes */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-3 text-sm font-bold text-espresso-400 uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          Moments
                        </h3>
                        {sharedScenes && (
                          <SharedScenesPanel
                            scenes={sharedScenes}
                            onNavigate={onNavigateToEvent}
                            maxVisible={3}
                          />
                        )}
                      </div>
                    </div>

                    {/* Bottom Padding */}
                    <div className="h-4" />
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}

export default RelationshipDeepAnalysisModal;
