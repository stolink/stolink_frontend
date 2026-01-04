/**
 * 사건 상세 패널 (노드 클릭 시 표시)
 */
import { createElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BiographyEvent } from "./types";
import { getImportanceLevel } from "./types";
import { getEventTypeIcon, getEventTypeConfig } from "./constants";

interface EventDetailPanelProps {
  event: BiographyEvent | null;
  onClose: () => void;
}

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  if (!event) return null;

  const config = getEventTypeConfig(event.event_type);
  const icon = getEventTypeIcon(event.event_type);
  const isMajor = getImportanceLevel(event.importance) === "major";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={event.event_id}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200 shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div
            className="px-4 py-3 border-b border-stone-100 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${config.accentColor}15, transparent)`,
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* 아이콘 */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${config.color}15`,
                }}
              >
                {createElement(icon, {
                  className: "w-4 h-4",
                  style: { color: config.color },
                })}
              </div>

              {/* 유형 라벨 */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                {config.label}
              </span>

              {/* 중요도 */}
              {isMajor && (
                <span className="text-[10px] font-bold text-mocha-500 bg-mocha-100 px-1.5 py-0.5 rounded">
                  주요 (중요도: {event.importance})
                </span>
              )}
            </div>

            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-stone-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 본문 */}
          <div className="p-4 space-y-3">
            {/* 타이틀 */}
            <h4 className="font-semibold text-espresso-900 text-base leading-snug">
              {event.narrative_summary}
            </h4>

            {/* 설명 */}
            <p className="text-sm text-stone-600 leading-relaxed">
              {event.description}
            </p>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs text-stone-500">
              {/* 참여 캐릭터 */}
              {event.participants.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{event.participants.join(", ")}</span>
                </div>
              )}

              {/* 장소 */}
              {event.location_ref && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.location_ref}</span>
                </div>
              )}
            </div>

            {/* 시각적 장면 설명 (있는 경우) */}
            {event.visual_scene && (
              <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                <p className="text-xs text-stone-500 italic">
                  &ldquo;{event.visual_scene}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
