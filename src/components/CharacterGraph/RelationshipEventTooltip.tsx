import { createPortal } from "react-dom";
import { Card, CardContent } from "@stolink/ui";
import { Badge } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { Clock, ChevronRight, Sparkles } from "lucide-react";
import { getRelationshipColor, type UIRelationType } from "./utils";
import { toUIRelationType } from "./constants";
import { motion, AnimatePresence } from "framer-motion";

import type { RelationType } from "@/types";

interface HistoryEvent {
  eventId: string;
  title: string;
  chapter?: string;
  type: RelationType | UIRelationType;
  reason?: string;
  date?: string;
}

interface RelationshipEventTooltipProps {
  events: HistoryEvent[];
  sourceName: string;
  targetName: string;
  // Optional Avatar URLs (passed from parent if available, or fallback to initials)
  sourceImage?: string;
  targetImage?: string;
  x: number;
  y: number;
  onEventClick: (event: HistoryEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  type: UIRelationType;
  types?: UIRelationType[];
  strength: number;
  description?: string;
  onOpenDeepAnalysis?: () => void;
}

// Helper for initials
const getInitials = (name: string) => name.charAt(0).toUpperCase();

export function RelationshipEventTooltip({
  events,
  sourceName,
  targetName,
  sourceImage,
  targetImage,
  x,
  y,
  onEventClick,
  onMouseEnter,
  onMouseLeave,
  type,
  strength,
  description,
  onOpenDeepAnalysis,
}: RelationshipEventTooltipProps) {
  if (!events && !description) return null;

  // Determine Primary Color based on Relationship Type
  const primaryColor = getRelationshipColor(type, strength);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed z-50 pointer-events-auto"
        style={{
          left: x + 15, // Offset to not cover cursor
          top: y + 15,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Card
          className={cn(
            "w-[320px] shadow-2xl border-none bg-white/95 backdrop-blur-md overflow-hidden font-sans",
            "ring-1 ring-black/5",
          )}
        >
          {/* Header: Narrative Thread (Avatars + Tension) */}
          <div className="relative pt-6 pb-4 px-6 bg-gradient-to-b from-cloud-50 to-white">
            {/* Background Decorative Line */}
            <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-cloud-200 -z-10 transform -translate-y-1/2" />

            <div className="flex justify-between items-center relative z-10">
              {/* Source Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-cloud-100 flex items-center justify-center">
                  {sourceImage ? (
                    <img
                      src={sourceImage}
                      alt={sourceName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-serif font-bold text-espresso-600">
                      {getInitials(sourceName)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-espresso-800 max-w-[80px] truncate text-center">
                  {sourceName}
                </span>
              </div>

              {/* Central Connection Badge */}
              <div className="flex flex-col items-center">
                <Badge
                  className="px-3 py-1 text-xs font-serif font-bold tracking-wide uppercase text-white shadow-md border-2 border-white"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                >
                  {type}
                </Badge>
                {/* Strength Dots */}
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 h-1 rounded-full transition-all duration-300",
                        i < Math.round(strength / 2)
                          ? "bg-espresso-800 scale-110"
                          : "bg-cloud-300 scale-90",
                      )}
                      style={{
                        backgroundColor:
                          i < Math.round(strength / 2)
                            ? primaryColor
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Target Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-cloud-100 flex items-center justify-center">
                  {targetImage ? (
                    <img
                      src={targetImage}
                      alt={targetName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-serif font-bold text-espresso-600">
                      {getInitials(targetName)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-espresso-800 max-w-[80px] truncate text-center">
                  {targetName}
                </span>
              </div>
            </div>

            {/* Description (Context) */}
            {description && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-center"
              >
                <p className="text-xs text-espresso-600 italic font-serif leading-relaxed px-2">
                  "{description}"
                </p>
              </motion.div>
            )}
          </div>

          <CardContent className="p-0 bg-white">
            {/* Timeline Events */}
            {events && events.length > 0 && (
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-mocha-400" />
                  <span className="text-[10px] uppercase font-bold text-espresso-400 tracking-wider">
                    Timeline History
                  </span>
                </div>

                <div className="relative pl-3 space-y-4 border-l-2 border-cloud-100">
                  {events.slice(0, 3).map((event, index) => (
                    <motion.div
                      key={event.eventId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="relative pl-4 group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {/* Timeline Dot */}
                      <div
                        className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                        style={{
                          backgroundColor: getRelationshipColor(
                            toUIRelationType(event.type),
                            4,
                          ),
                        }}
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-espresso-800 font-serif group-hover:text-mocha-600 transition-colors">
                            {event.title}
                          </p>
                          <span className="text-[10px] text-espresso-400 font-medium">
                            {event.chapter || event.date || "Unknown Date"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 border-cloud-200 text-espresso-500"
                        >
                          {event.type}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                  {events.length > 3 && (
                    <p className="pl-4 text-[10px] text-espresso-400 italic">
                      + {events.length - 3} more events...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer CTA: Deep Analysis */}
            {onOpenDeepAnalysis && (
              <motion.div
                whileHover={{ backgroundColor: "rgba(164, 119, 100, 0.05)" }}
                className="border-t border-cloud-100 px-5 py-3 cursor-pointer group transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDeepAnalysis();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-mocha-100 text-mocha-600 group-hover:bg-mocha-500 group-hover:text-white transition-colors">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-espresso-800 group-hover:text-mocha-700 transition-colors">
                        Deep Analysis
                      </span>
                      <span className="block text-[10px] text-espresso-400 group-hover:text-mocha-500 transition-colors">
                        Click to explore details
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cloud-300 group-hover:text-mocha-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
