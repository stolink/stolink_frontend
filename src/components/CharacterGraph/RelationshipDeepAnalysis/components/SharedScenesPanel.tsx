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
  Star,
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
          "p-6 rounded-xl bg-cloud-50/50 border border-cloud-200 border-dashed text-center",
          className,
        )}
      >
        <Users className="w-8 h-8 text-cloud-300 mx-auto mb-2" />
        <p className="text-sm text-espresso-400">함께 등장한 장면이 없습니다</p>
      </div>
    );
  }

  const visibleScenes = isExpanded ? scenes : scenes.slice(0, maxVisible);
  const hiddenCount = scenes.length - maxVisible;

  return (
    <motion.div
      className={cn(
        "bg-white rounded-xl border border-cloud-200 shadow-sm overflow-hidden",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-cloud-100 flex items-center justify-between bg-cloud-50/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-espresso-800 tracking-wide">
            SHARED MOMENTS
          </h4>
        </div>
        <Badge
          intent="secondary"
          className="bg-white border-cloud-200 text-espresso-500 font-normal"
        >
          Total {scenes.length} Scenes
        </Badge>
      </div>

      {/* Scene List */}
      <div className="divide-y divide-cloud-100">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleScenes.map((scene) => (
            <motion.div
              key={scene.eventId}
              className={cn(
                "group relative p-4 flex items-start gap-4 hover:bg-cloud-50/50 transition-colors",
                onNavigate && "cursor-pointer",
              )}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onNavigate?.(scene.eventId)}
            >
              {/* Importance Indicator (Left Border) */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-violet-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Chapter Badge */}
              <div className="flex-shrink-0 w-16 text-center pt-0.5">
                <span className="block text-xs font-bold text-violet-600 mb-0.5">
                  {scene.chapter}
                </span>
                {scene.importance >= 8 && (
                  <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-[10px] text-amber-600 border border-amber-100">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Key
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-bold text-espresso-900 group-hover:text-violet-700 transition-colors">
                    {scene.title}
                  </h5>
                  {onNavigate && (
                    <ExternalLink className="w-3.5 h-3.5 text-cloud-300 group-hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                  )}
                </div>
                <p className="text-sm text-espresso-600 leading-relaxed line-clamp-2 group-hover:text-espresso-800 transition-colors">
                  {scene.description ||
                    "이 챕터에서 두 캐릭터의 중요한 상호작용이 있었습니다."}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse Button */}
      {hiddenCount > 0 && (
        <div className="p-2 bg-cloud-50/30 border-t border-cloud-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-espresso-500 hover:text-violet-600 hover:bg-violet-50"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1.5" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1.5" />
                더보기 ({hiddenCount}개 씬)
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default SharedScenesPanel;
