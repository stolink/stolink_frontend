import type { Event, BackendEvent } from "@/types/event";

/**
 * 백엔드 이벤트 → 프론트엔드 이벤트 변환
 */
export function transformBackendEvent(backendEvent: BackendEvent): Event {
  return {
    eventId: backendEvent.event_id,
    eventType: backendEvent.event_type,
    narrativeSummary: backendEvent.narrative_summary,
    description: backendEvent.description,
    participants: backendEvent.participants,
    locationRef: backendEvent.location_ref,
    prevEventId: backendEvent.prev_event_id,
    timestamp: backendEvent.timestamp,
    importance: backendEvent.importance,
    changesMade: backendEvent.changes_made,
    embedding: backendEvent.embedding,
  };
}

export const eventService = {
  // Placeholder for future API integration
  transform: transformBackendEvent,
};
