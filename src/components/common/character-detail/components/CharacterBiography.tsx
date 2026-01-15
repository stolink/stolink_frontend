import { useState, useMemo } from "react";
import { BookOpen, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@stolink/ui";
import { BiographyTree } from "./biography/BiographyTree";
import { sortEventsByPrevId } from "./biography/utils";
import { BiographyEventList } from "./biography/BiographyEventList";
import type { BiographyEvent } from "@/types/biography";

interface CharacterBiographyProps {
  backstory: string;
  isEditMode: boolean;
  onBackstoryChange: (value: string) => void;
  /** 인물 일대기 사건 데이터 (향후 구현 예정) */
  events?: BiographyEvent[];
  /** ID -> Name 매핑 */
  characterNameMap?: Record<string, string>;
  onSave?: () => void;
  onCancel?: () => void;
}

export function CharacterBiography({
  backstory,
  isEditMode,
  onBackstoryChange,
  events,
  characterNameMap,
  onSave,
  onCancel,
}: CharacterBiographyProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // useMemo로 정렬된 데이터 계산
  // 실제 이벤트 데이터가 없으면 빈 배열 (UI에서 empty state 표시)
  const displayEvents = useMemo(() => {
    const rawEvents = events && events.length > 0 ? events : [];
    // Deduplicate by eventId to avoid key collisions
    const uniqueEvents = Array.from(
      new Map(rawEvents.map((e) => [e.eventId, e])).values(),
    );
    return sortEventsByPrevId(uniqueEvents);
  }, [events]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-2 px-1 shrink-0">
        <BookOpen className="h-5 w-5 text-mocha-500" />
        <h3 className="text-sm font-bold text-mocha-400 uppercase tracking-widest">
          인물 일대기
        </h3>
      </div>

      {isEditMode ? (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Reference View: Biography Tree (Read-only reference while editing) */}
          <div className="shrink-0 p-4 rounded-2xl bg-cloud-50/50 border border-cloud-100 opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-xs text-mocha-400 font-medium mb-2 uppercase tracking-wider text-center">
              참고용 타임라인 (수정 불가)
            </p>
            <BiographyTree
              events={displayEvents}
              backstory={backstory}
              selectedEventId={selectedEventId}
              onEventClick={setSelectedEventId}
              className="h-[200px]" // Reduced height for reference
            />
          </div>

          <div className="flex-1 relative group">
            <Textarea
              value={backstory}
              onChange={(e) => onBackstoryChange(e.target.value)}
              className="w-full h-full min-h-[300px] leading-relaxed text-lg p-8 bg-[#FDFCFB] shadow-sm border-cloud-200 focus:border-mocha-400 focus:ring-cloud-200 resize-none selection:bg-cloud-200 rounded-xl font-serif"
              placeholder="캐릭터의 과거, 성장 배경, 중요한 사건들을 상세하게 기록해보세요."
            />
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>

          {/* Bottom Actions for Biography Tab */}
          <div className="flex justify-end gap-3 pt-4 border-t border-cloud-200/50">
            <Button
              intent="ghost"
              onClick={onCancel}
              className="h-11 px-6 rounded-full border-cloud-300 text-mocha-500 hover:bg-cloud-100"
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button
              intent="primary"
              onClick={onSave}
              className="h-11 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              저장하기
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
          {/* 상단: 시각화 */}
          <BiographyTree
            events={displayEvents}
            backstory={backstory}
            selectedEventId={selectedEventId}
            onEventClick={setSelectedEventId}
            characterNameMap={characterNameMap}
            className="shadow-sm"
          />

          {/* 하단: 사건 목록 리스트 */}
          <BiographyEventList
            events={displayEvents}
            selectedEventId={selectedEventId}
            onEventClick={setSelectedEventId}
            characterNameMap={characterNameMap}
          />
        </div>
      )}
    </div>
  );
}
