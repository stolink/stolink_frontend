import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
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
    participants: backendEvent.participants || [],
    locationRef: backendEvent.location_ref,
    prevEventId: backendEvent.prev_event_id,
    timestamp: backendEvent.timestamp,
    importance: backendEvent.importance,
    changesMade: backendEvent.changes_made,
    embedding: backendEvent.embedding,
  };
}

export const eventService = {
  /**
   * 특정 캐릭터의 참여 이벤트 조회
   * GET /api/characters/:id/events
   */
  getByCharacter: async (characterId: string): Promise<Event[]> => {
    try {
      const response = await api.get<ApiResponse<BackendEvent[]>>(
        `/characters/${characterId}/events`,
      );
      const data = response.data.data;
      if (!Array.isArray(data)) return [];
      return data.map(transformBackendEvent);
    } catch (error) {
      console.warn("[eventService] getByCharacter failed:", error);
      return [];
    }
  },

  /**
   * 프로젝트의 모든 이벤트 조회
   * GET /api/projects/:id/events
   */
  getByProject: async (projectId: string): Promise<Event[]> => {
    try {
      const response = await api.get<ApiResponse<BackendEvent[]>>(
        `/projects/${projectId}/events`,
      );
      const data = response.data.data;
      if (!Array.isArray(data)) return [];
      return data.map(transformBackendEvent);
    } catch (error) {
      console.warn("[eventService] getByProject failed:", error);
      return [];
    }
  },

  /** 변환 함수 export */
  transform: transformBackendEvent,
};
