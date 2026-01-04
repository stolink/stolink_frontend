import { BookOpen, ChevronRight } from "lucide-react";
import type { BiographyEvent } from "./types";
import { getEventTypeIcon, getEventTypeConfig } from "./constants";
import { getImportanceLevel } from "./types";
import { createElement } from "react";
import { cn } from "@/lib/utils";

interface BiographyEventListProps {
  events: BiographyEvent[];
  selectedEventId: string | null;
  onEventClick: (eventId: string) => void;
}

export function BiographyEventList({
  events,
  selectedEventId,
  onEventClick,
}: BiographyEventListProps) {
  // 시간순 정렬 (혹은 연결순? 일단 입력 순서대로 표시하되, 필요한 경우 정렬 로직 추가)
  // BiographyTree와 동일한 순서가 좋음. BiographyTree에서 정렬 로직을 분리하는 것이 이상적이나,
  // 여기서는 단순히 props로 전달받은 events가 이미 정렬되어 있다고 가정하거나, 혹은 map index를 사용.
  // 상위에서 정렬된 events를 넘겨주는 것이 좋음.

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider px-1">
        사건 목록 ({events.length})
      </h4>

      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event, idx) => {
            const config = getEventTypeConfig(event.event_type);
            const isMajor = getImportanceLevel(event.importance) === "major";
            const isSelected = selectedEventId === event.event_id;

            return (
              <div
                key={event.event_id}
                className="timeline-item editorial-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={cn(
                    "block editorial-card p-4 hover-lift group cursor-pointer transition-all border",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 border-primary"
                      : "border-transparent hover:border-stone-200",
                  )}
                  onClick={() => onEventClick(event.event_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 아이콘 + 번호 */}
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: config.accentColor }}
                      >
                        {createElement(getEventTypeIcon(event.event_type), {
                          className: "w-5 h-5 text-white",
                        })}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-stone-400">
                            #{idx + 1}
                          </span>
                          {isMajor && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                              주요 사건
                            </span>
                          )}
                          <span className="text-xs text-stone-400">
                            · {config.label}
                          </span>
                        </div>
                        <h5
                          className={cn(
                            "text-base font-semibold transition-colors truncate pr-4",
                            isSelected
                              ? "text-primary"
                              : "text-stone-900 group-hover:text-primary",
                          )}
                        >
                          {event.narrative_summary}
                        </h5>
                        <p className="text-sm text-stone-500 truncate mt-0.5">
                          {event.description || "상세 설명 없음"}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-5 w-5 transition-all text-stone-300",
                        isSelected
                          ? "text-primary translate-x-1"
                          : "group-hover:text-primary group-hover:translate-x-1",
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="editorial-empty-state py-12">
          <BookOpen className="editorial-empty-state-icon" />
          <p className="editorial-empty-state-title">기록된 사건 없음</p>
          <p className="editorial-empty-state-description">
            인물의 일대기 사건이 아직 기록되지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}
