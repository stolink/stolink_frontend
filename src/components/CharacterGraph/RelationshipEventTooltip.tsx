import { createPortal } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";
import type { RelationType } from "@/types/character";

interface HistoryEvent {
  eventId: string;
  title: string;
  chapter?: string;
  type: RelationType;
  reason?: string;
  date?: string;
}

interface RelationshipEventTooltipProps {
  events: HistoryEvent[];
  sourceName: string;
  targetName: string;
  x: number;
  y: number;
  onEventClick: (event: HistoryEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Reuse palette for consistent badging
const RELATION_COLORS: Record<string, string> = {
  friendly: "bg-[#7A8C6F] border-[#7A8C6F] text-white",
  hostile: "bg-[#9C4A3F] border-[#9C4A3F] text-white",
  romantic: "bg-[#B38B82] border-[#B38B82] text-white",
  neutral: "bg-stone-500 border-stone-500 text-white",
};

export function RelationshipEventTooltip({
  events,
  sourceName,
  targetName,
  x,
  y,
  onEventClick,
  onMouseEnter,
  onMouseLeave,
}: RelationshipEventTooltipProps) {
  if (!events || events.length === 0) return null;

  return createPortal(
    <div
      className="fixed z-50 p-2 bg-transparent animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: x + 1,
        top: y + 1,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card className="w-64 shadow-xl border-stone-200 bg-white/95 backdrop-blur-sm">
        <CardHeader className="p-3 pb-2 border-b border-stone-100 bg-stone-50/50">
          <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <Activity className="w-4 h-4 text-mocha-500" />
            Relationship Events
          </CardTitle>
          <p className="text-xs text-stone-400">
            {sourceName} & {targetName}
          </p>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          {events.map((event) => (
            <div
              key={event.eventId}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(event);
              }}
              className="group flex items-center justify-between p-2 rounded-md hover:bg-stone-100 cursor-pointer transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-stone-700 group-hover:text-mocha-600 transition-colors">
                  {event.title}
                </span>
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.chapter || event.date || "Unknown time"}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5",
                  RELATION_COLORS[event.type] || "bg-stone-400",
                )}
              >
                {event.type}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
