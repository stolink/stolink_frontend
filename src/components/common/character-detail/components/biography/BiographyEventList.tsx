import { BookOpen, ChevronRight } from "lucide-react";
import type { BiographyEvent } from "@/types/biography";
import { getEventTypeIcon, getEventTypeConfig } from "./constants";
import { getImportanceLevel } from "@/types/biography";
import { createElement } from "react";
import { cn } from "@/lib/utils";

interface BiographyEventListProps {
  events: BiographyEvent[];
  selectedEventId: string | null;
  onEventClick: (eventId: string) => void;
  characterNameMap?: Record<string, string>;
}

export function BiographyEventList({
  events,
  selectedEventId,
  onEventClick,
  characterNameMap,
}: BiographyEventListProps) {
  // 시간순 정렬 (혹은 연결순? 일단 입력 순서대로 표시하되, 필요한 경우 정렬 로직 추가)
  // BiographyTree와 동일한 순서가 좋음. BiographyTree에서 정렬 로직을 분리하는 것이 이상적이나,
  // 여기서는 단순히 props로 전달받은 events가 이미 정렬되어 있다고 가정하거나, 혹은 map index를 사용.
  // 상위에서 정렬된 events를 넘겨주는 것이 좋음.

  return (
    <div className="space-y-6">
      <h4 className="font-heading text-lg text-espresso-900 border-b-2 border-mocha-200 pb-1 inline-block">
        사건 목록 ({events.length})
      </h4>

      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event, idx) => {
            const config = getEventTypeConfig(event.eventType);
            const isMajor = getImportanceLevel(event.importance) === "major";
            const isSelected = selectedEventId === event.eventId;

            return (
              <div
                key={`${event.eventId}-${idx}`}
                className="timeline-item editorial-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={cn(
                    "block p-5 group cursor-pointer transition-all duration-300 ease-out border rounded-xl",
                    "bg-white shadow-sm hover:shadow-paper-hover hover:-translate-y-0.5",
                    isSelected
                      ? "ring-2 ring-mocha-500 ring-offset-2 border-mocha-500/50 bg-mocha-50/10"
                      : "border-cloud-200/60 hover:border-mocha-300/60",
                  )}
                  onClick={() => onEventClick(event.eventId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      {/* 아이콘 + 번호 */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105",
                          isMajor
                            ? "bg-gradient-to-br from-mocha-400 to-mocha-600"
                            : "bg-cloud-100",
                        )}
                        style={
                          !isMajor
                            ? { backgroundColor: config.accentColor }
                            : {}
                        }
                      >
                        {createElement(getEventTypeIcon(event.eventType), {
                          className: cn(
                            "w-6 h-6",
                            isMajor ? "text-white" : "text-espresso-600",
                          ),
                          style: !isMajor ? { color: config.color } : {},
                        })}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-espresso-400 ">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          {isMajor && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-100/50">
                              MAJOR
                            </span>
                          )}
                          <span className="text-xs text-espresso-500 font-medium tracking-wide">
                            {config.label}
                          </span>
                        </div>
                        <h5
                          className={cn(
                            "text-lg  font-bold transition-colors pr-4 leading-tight break-words whitespace-normal",
                            isSelected
                              ? "text-mocha-900"
                              : "text-espresso-900 group-hover:text-mocha-700",
                          )}
                        >
                          {event.narrativeSummary.length > 50
                            ? `${event.narrativeSummary.slice(0, 50)}...`
                            : event.narrativeSummary}
                        </h5>
                        <p className="text-sm text-espresso-600 mt-1 leading-relaxed opacity-80 break-words whitespace-pre-wrap">
                          {event.description || "상세 설명 없음"}
                        </p>

                        {event.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {event.participants.map((p, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 bg-cloud-50/50 rounded-full border border-cloud-100 text-espresso-500 font-medium"
                              >
                                {characterNameMap?.[p] || p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-5 w-5 transition-all duration-300 ease-out text-espresso-300",
                        isSelected
                          ? "text-mocha-500 translate-x-1"
                          : "group-hover:text-mocha-400 group-hover:translate-x-1",
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
