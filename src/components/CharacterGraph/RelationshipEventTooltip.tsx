import { createPortal } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@stolink/ui";
import { Badge } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { Activity, Clock, ChevronRight } from "lucide-react";
import { getRelationshipColor, type UIRelationType } from "./utils";

interface HistoryEvent {
  eventId: string;
  title: string;
  chapter?: string;
  type: UIRelationType;
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
  type: UIRelationType;
  types?: UIRelationType[]; // Added for multi-type support
  strength: number;
  description?: string;
  /** 전체 카드 클릭 시 심층 분석 모달 열기 */
  onOpenDeepAnalysis?: () => void;
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
  onMouseLeave,
  type,
  types,
  strength,
  description,
  onOpenDeepAnalysis,
}: RelationshipEventTooltipProps) {
  if (!events && !description) return null;

  return createPortal(
    <div
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: x,
        top: y,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card
        className={cn(
          "group w-64 shadow-xl border-cloud-200 bg-white/95 backdrop-blur-sm overflow-hidden",
          "transition-all duration-200 ease-out",
          // 클릭 가능 시각적 피드백
          onOpenDeepAnalysis && [
            "cursor-pointer",
            "hover:scale-[1.03] hover:shadow-2xl hover:border-mocha-400",
            "hover:ring-2 hover:ring-mocha-300/60",
            "active:scale-[0.98]",
          ]
        )}
        onClick={(e) => {
          if (onOpenDeepAnalysis) {
            e.stopPropagation();
            onOpenDeepAnalysis();
          }
        }}
      >
        <CardHeader className="p-3 pb-2 border-b border-cloud-100 bg-cloud-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-espresso-600 flex items-center gap-2">
              <Activity className="w-4 h-4 text-mocha-500" />
              관계 정보
            </CardTitle>
          </div>
          <p className="text-xs text-espresso-400">
            {sourceName} & {targetName}
          </p>
        </CardHeader>
        <CardContent className="p-2 space-y-3">
          {/* Main Stats from DB */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {types && types.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {types.map((t, idx) => (
                    <Badge
                      key={idx}
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium capitalize text-white"
                      )}
                      style={{
                        backgroundColor: getRelationshipColor(t, strength),
                        borderColor: getRelationshipColor(t, strength),
                      }}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium capitalize text-white"
                  )}
                  style={{
                    backgroundColor: getRelationshipColor(type, strength),
                    borderColor: getRelationshipColor(type, strength),
                  }}
                >
                  {type}
                </Badge>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-espresso-400">
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
                          : "bg-cloud-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            {description && (
              <p className="text-xs text-espresso-600 leading-relaxed border-l-2 border-cloud-200 pl-2 italic">
                "{description}"
              </p>
            )}
          </div>

          {events && events.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-cloud-100">
              <span className="text-[10px] uppercase font-bold text-espresso-400 block mb-1">
                Recent Events
              </span>
              {events.map((event, index) => (
                <div
                  key={`${event.eventId}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className="group flex items-center justify-between p-2 rounded-md hover:bg-cloud-100 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-espresso-700 group-hover:text-mocha-600 transition-colors">
                      {event.title}
                    </span>
                    {/* Show time only if available */}
                    {(event.chapter || event.date) && (
                      <span className="text-[10px] text-espresso-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.chapter || event.date}
                      </span>
                    )}
                  </div>
                  <Badge
                    intent="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5 text-white border-0"
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

          {/* 클릭 CTA 영역 - 버튼 스타일 */}
          {onOpenDeepAnalysis && (
            <div className="mt-2 -mx-2 -mb-2 px-3 py-2.5 bg-gradient-to-r from-mocha-50 to-mocha-100 border-t border-mocha-200 flex items-center justify-between group-hover:from-mocha-100 group-hover:to-mocha-200 transition-all">
              <span className="text-xs font-semibold text-mocha-700">
                🔍 자세히 보기
              </span>
              <div className="flex items-center gap-1 text-mocha-600">
                <span className="text-[10px] font-medium opacity-70">클릭</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
