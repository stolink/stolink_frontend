// =====================================================
// 🎯 Relationship Deep Analysis Modal
// 캐릭터 관계 심층 분석 메인 모달 컴포넌트
// =====================================================

import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ArrowLeftRight, Activity } from "lucide-react";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { CharacterPortraitPanel } from "./components/CharacterPortraitPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { RelationshipTimelineGraph } from "./components/RelationshipTimelineGraph";
import { Badge } from "@stolink/ui";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";

interface RelationshipDeepAnalysisModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 분석 데이터 */
  data: RelationshipDeepAnalysisData | null;
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
  friendly: "우호적",
  hostile: "적대적",
  romantic: "로맨틱",
};

// 관계 타입 색상
const RELATION_TYPE_COLORS: Record<string, string> = {
  ALLY: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  FRIEND: "bg-green-500/20 text-green-300 border-green-500/30",
  RIVAL: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  ENEMY: "bg-red-500/20 text-red-300 border-red-500/30",
  ROMANTIC: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  MENTOR: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  FAMILY: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NEUTRAL: "bg-cloud-500/20 text-cloud-300 border-cloud-500/30",
  friendly: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  hostile: "bg-red-500/20 text-red-300 border-red-500/30",
  romantic: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

export function RelationshipDeepAnalysisModal({
  isOpen,
  onClose,
  data,
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
  } = data;

  const typeLabel =
    RELATION_TYPE_LABELS[relationshipType.toUpperCase()] ||
    RELATION_TYPE_LABELS[relationshipType] ||
    relationshipType;
  const typeColor =
    RELATION_TYPE_COLORS[relationshipType.toUpperCase()] ||
    RELATION_TYPE_COLORS[relationshipType] ||
    "bg-mocha-500/20 text-mocha-300 border-mocha-500/30";

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
          <DialogPrimitive.Portal>
            {/* Backdrop */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md"
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
                  "w-[95vw] max-w-[900px] max-h-[90vh]",
                  "overflow-hidden rounded-2xl",
                  "bg-[#F9F9F7]/95 backdrop-blur-xl",
                  "border border-cloud-200",
                  "shadow-2xl shadow-espresso-900/10",
                )}
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Header */}
                <motion.div
                  className="flex items-center justify-between px-6 py-4 border-b border-cloud-200/60 bg-white/50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10">
                      <Activity className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-espresso-900 font-serif">
                        관계 심층 분석
                      </h2>
                      <p className="text-xs text-espresso-500">
                        {sourceCharacter.name} ↔ {targetCharacter.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Relationship Type Badge */}
                    <Badge
                      intent="outline"
                      className={cn("px-3 py-1 border font-medium", typeColor)}
                    >
                      {typeLabel}
                    </Badge>

                    {/* Strength Indicator */}
                    <div className="flex items-center gap-1.5 text-espresso-600">
                      <span className="text-xs">강도:</span>
                      <span className="text-sm font-bold text-teal-600">
                        {currentStrength}/10
                      </span>
                    </div>

                    {/* Since Badge */}
                    {since && (
                      <Badge
                        intent="secondary"
                        className="bg-cloud-100 text-espresso-500 border-cloud-200"
                      >
                        {since}부터
                      </Badge>
                    )}

                    {/* Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-espresso-400 hover:text-espresso-900 hover:bg-cloud-200/50"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 bg-[#F9F9F7]">
                  <div className="space-y-6">
                    {/* === TOP SECTION: Bi-directional Radar Charts === */}
                    <motion.div
                      className="grid grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {/* Source → Target */}
                      <div className="bg-white rounded-xl border border-cloud-200 shadow-sm p-2">
                        <CharacterPortraitPanel
                          character={sourceCharacter}
                          attributes={sourceToTargetAttributes}
                          targetName={targetCharacter.name}
                          position="left"
                          animationDelay={0.2}
                        />
                      </div>

                      {/* Target → Source */}
                      <div className="bg-white rounded-xl border border-cloud-200 shadow-sm p-2">
                        <CharacterPortraitPanel
                          character={targetCharacter}
                          attributes={targetToSourceAttributes}
                          targetName={sourceCharacter.name}
                          position="right"
                          animationDelay={0.3}
                        />
                      </div>
                    </motion.div>

                    {/* === MIDDLE SECTION: Insights === */}
                    <InsightsPanel insights={insights} animationDelay={0.4} />

                    {/* === BOTTOM SECTION: Timeline Graph === */}
                    <motion.div
                      className={cn(
                        "rounded-xl p-5",
                        "bg-white",
                        "border border-cloud-200 shadow-sm",
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-indigo-50">
                          <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h4 className="text-sm font-semibold text-espresso-800 uppercase tracking-wider">
                          관계 변천사
                        </h4>
                        <span className="text-xs text-espresso-400">
                          (중요도 8+ 이벤트)
                        </span>
                      </div>

                      {/* Timeline Graph */}
                      <RelationshipTimelineGraph
                        data={timeline}
                        width={820}
                        height={220}
                        animationDelay={0.6}
                      />
                    </motion.div>
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
