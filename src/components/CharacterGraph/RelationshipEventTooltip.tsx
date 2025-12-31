import { createPortal } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";
import type { RelationType } from "@/types/character";
import { getRelationshipColor } from "./utils";

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
  // Added props for DB data
  type: RelationType;
  strength: number;
  description?: string;
}

// Local constants removed in favor of getRelationshipColor helper

export function RelationshipEventTooltip({
  events,
  sourceName,
  targetName,
  x,
  y,
  onEventClick,
  onMouseEnter,
  onMouseLeave,
  type,
  strength,
  description,
}: RelationshipEventTooltipProps) {
  if (!events && !description) return null;

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
        <CardContent className="p-2 space-y-3">
          {/* Main Stats from DB */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge
                className={cn(
                  "px-2 py-0.5 text-xs font-medium capitalize text-white",
                )}
                style={{
                  backgroundColor: getRelationshipColor(type, strength),
                  borderColor: getRelationshipColor(type, strength),
                }}
              >
                {type}
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  Strength
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        i < Math.round(strength / 2)
                          ? "bg-mocha-500"
                          : "bg-stone-200",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            {description && (
              <p className="text-xs text-stone-600 leading-relaxed border-l-2 border-stone-200 pl-2 italic">
                "{description}"
              </p>
            )}
          </div>

          {events && events.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-stone-100">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Recent Events
              </span>
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
                      "text-[10px] px-1.5 py-0 h-5 text-white border-0",
                    )}
                    style={{
                      backgroundColor: getRelationshipColor(event.type, 5), // Default to standard strength for events
                    }}
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
