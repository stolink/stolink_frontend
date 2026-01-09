// =====================================================
// 🎭 Shared Scenes Panel Component
// 공동 등장 씬 목록 (Premium List Style)
// =====================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { SharedScene } from "@/types/relationshipAnalysis";
import { Button, Badge } from "@stolink/ui";
import { cn } from "@/lib/utils";

interface SharedScenesPanelProps {
  scenes: SharedScene[];
  onNavigate?: (eventId: string) => void;
  maxVisible?: number;
  className?: string;
}

export function SharedScenesPanel({
  scenes,
  onNavigate,
  maxVisible = 3,
  className,
}: SharedScenesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scenes || scenes.length === 0) {
    return (
      <div
        className={cn(
          "p-8 rounded-2xl bg-cloud-50/50 border border-dashed border-cloud-200 text-center",
          className,
        )}
      >
        <Users className="w-10 h-10 text-cloud-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-espresso-400">
          함께 등장한 장면이 아직 없습니다
        </p>
      </div>
    );
  }

  const visibleScenes = isExpanded ? scenes : scenes.slice(0, maxVisible);
  const hiddenCount = scenes.length - maxVisible;

  return (
    <motion.div
      className={cn(
        "bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm overflow-hidden",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-mocha-100/50 flex items-center justify-between bg-gradient-to-r from-mocha-50/30 to-cloud-50/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white shadow-sm border border-mocha-100/50 text-mocha-600">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-espresso-800 tracking-widest uppercase">
            Shared Moments
          </h4>
        </div>
        <Badge
          intent="secondary"
          className="bg-white/80 border-mocha-200 text-mocha-700 font-medium px-3"
        >
          {scenes.length} Scenes
        </Badge>
      </div>

      {/* Scene List */}
      <div className="p-4 space-y-3 bg-cloud-50/20">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleScenes.map((scene, index) => (
            <motion.div
              key={scene.eventId}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative p-5 rounded-2xl bg-white border border-cloud-100 shadow-sm hover:shadow-md hover:border-mocha-200 transition-all duration-300",
                onNavigate && "cursor-pointer",
              )}
              onClick={() => onNavigate?.(scene.eventId)}
            >
              {/* Decorative Gradient Line (Left) */}
              <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-mocha-100 via-mocha-400 to-mocha-100 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start gap-4">
                {/* Chapter Info */}
                <div className="flex-shrink-0 w-20 pt-1">
                  <span className="block text-xs font-bold text-mocha-600 mb-1 font-serif">
                    {scene.chapter}
                  </span>
                  {scene.importance >= 8 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-100/50 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      KEY
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <h5 className="text-base font-bold text-espresso-900 leading-tight group-hover:text-mocha-800 transition-colors font-serif">
                      {scene.title}
                    </h5>
                    {onNavigate && (
                      <ExternalLink className="w-4 h-4 text-cloud-300 group-hover:text-mocha-400 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                    )}
                  </div>
                  <p className="text-sm text-espresso-600/90 leading-relaxed font-sans line-clamp-2">
                    {scene.description || (
                      <span className="italic text-espresso-300">
                        이 챕터에서 두 캐릭터의 중요한 상호작용이
                        기록되었습니다.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse Button */}
      {hiddenCount > 0 && (
        <div className="p-2 border-t border-mocha-100/50 bg-white/50 backdrop-blur-sm relative z-10">
          <Button
            variant="ghost"
            className="w-full py-6 text-espresso-500 hover:text-mocha-700 hover:bg-mocha-50/50 transition-all rounded-xl group"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <span className="flex items-center text-xs font-bold uppercase tracking-widest">
                <ChevronUp className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Close List
              </span>
            ) : (
              <span className="flex items-center text-xs font-bold uppercase tracking-widest">
                <ChevronDown className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                View {hiddenCount} More
              </span>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default SharedScenesPanel;
