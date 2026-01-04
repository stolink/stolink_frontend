import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { BiographyTree } from "./biography/BiographyTree";
import { sortEventsByPrevId } from "./biography/utils";
import { BiographyEventList } from "./biography/BiographyEventList";
import { MOCK_BIOGRAPHY_EVENTS } from "./biography/mockData";
import type { BiographyEvent } from "./biography/types";

interface CharacterBiographyProps {
  backstory: string;
  isEditMode: boolean;
  onBackstoryChange: (value: string) => void;
  /** 인물 일대기 사건 데이터 (향후 구현 예정) */
  events?: BiographyEvent[];
}

export function CharacterBiography({
  backstory,
  isEditMode,
  onBackstoryChange,
  events,
}: CharacterBiographyProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 실제 이벤트 데이터가 없으면 목데이터 사용
  // useMemo로 정렬된 데이터 계산
  const displayEvents = useMemo(() => {
    const rawEvents =
      events && events.length > 0 ? events : MOCK_BIOGRAPHY_EVENTS;
    return sortEventsByPrevId(rawEvents);
  }, [events]);

  return (
    <div className="space-y-6">
      <h3 className="editorial-section-heading">
        <BookOpen className="h-5 w-5 text-primary/70" />
        인물 일대기
      </h3>

      {isEditMode ? (
        <Textarea
          value={backstory}
          onChange={(e) => onBackstoryChange(e.target.value)}
          className="min-h-[400px] leading-relaxed font-serif text-lg p-6 bg-white shadow-sm border-stone-200 focus:border-stone-400 focus:ring-stone-200 resize-none selection:bg-stone-200"
          placeholder="캐릭터의 과거, 성장 배경, 중요한 사건들을 상세하게 기록해보세요."
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* 상단: 시각화 (높이 고정) */}
          <BiographyTree
            events={displayEvents}
            backstory={backstory}
            selectedEventId={selectedEventId}
            onEventClick={setSelectedEventId}
            className="shadow-sm"
          />

          {/* 하단: 사건 목록 리스트 */}
          <BiographyEventList
            events={displayEvents}
            selectedEventId={selectedEventId}
            onEventClick={setSelectedEventId}
          />
        </div>
      )}
    </div>
  );
}
