import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/services/eventService";
import { transformEventToBiography } from "@/types/biography";
import type { BiographyEvent } from "@/types/biography";
import type { Event } from "@/types/event";

interface UseEventsOptions {
  enabled?: boolean;
}

/**
 * Event → BiographyEvent 변환 헬퍼
 * eventService가 반환하는 Event(camelCase)를 BiographyEvent로 변환
 */
function eventToBiography(event: Event): BiographyEvent {
  return transformEventToBiography({
    event_id: event.eventId,
    event_type: event.eventType,
    narrative_summary: event.narrativeSummary,
    description: event.description,
    participants: event.participants,
    location_ref: event.locationRef,
    prev_event_id: event.prevEventId,
    timestamp: event.timestamp,
    importance: event.importance,
    changes_made: event.changesMade,
  });
}

/**
 * 특정 캐릭터의 이벤트(일대기) 조회 훅
 *
 * @param characterId - 캐릭터 ID
 * @param options - 쿼리 옵션
 *
 * @example
 * ```tsx
 * const { data: events, isLoading } = useCharacterEvents(character._id);
 * ```
 */
export function useCharacterEvents(
  characterId: string | null,
  options: UseEventsOptions = {},
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["events", "character", characterId],
    queryFn: async (): Promise<BiographyEvent[]> => {
      if (!characterId) return [];
      const events = await eventService.getByCharacter(characterId);
      return events.map(eventToBiography);
    },
    enabled: enabled && !!characterId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
  });
}

/**
 * 프로젝트의 모든 이벤트 조회 훅
 *
 * @param projectId - 프로젝트 ID
 * @param options - 쿼리 옵션
 *
 * @example
 * ```tsx
 * const { data: allEvents } = useProjectEvents(projectId);
 * ```
 */
export function useProjectEvents(
  projectId: string | null,
  options: UseEventsOptions = {},
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["events", "project", projectId],
    queryFn: async (): Promise<BiographyEvent[]> => {
      if (!projectId) return [];
      const events = await eventService.getByProject(projectId);
      return events.map(eventToBiography);
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
