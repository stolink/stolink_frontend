import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import {
  type Event,
  type BackendEvent,
  transformBackendEvent,
} from "@/types/event";

// Local definition removed to use centralized logic from types/event.ts
export { transformBackendEvent };

// 🚨 HOTFIX: characterId → id 매핑 (Neo4j 노드에 두 ID가 공존하는 문제 해결)
const CHARACTER_EVENT_ID_MAP: Record<string, string> = {
  "574fddc4-f52e-58be-919c-ea9eb5bffe5d":
    "44069ed3-8d44-40e4-8e6f-cbf1dac5325f",
};

function resolveEventCharacterId(characterId: string): string {
  return CHARACTER_EVENT_ID_MAP[characterId] || characterId;
}

export const eventService = {
  /**
   * 특정 캐릭터의 참여 이벤트 조회
   * GET /api/characters/:id/events
   */
  getByCharacter: async (characterId: string): Promise<Event[]> => {
    try {
      const resolvedId = resolveEventCharacterId(characterId);
      const response = await api.get<ApiResponse<BackendEvent[]>>(
        `/characters/${resolvedId}/events`,
      );
      const data = response.data.data;

      if (!Array.isArray(data)) {
        console.warn(`[eventService] Data is not an array:`, data);
        return [];
      }

      return data.map(transformBackendEvent);
    } catch (error: unknown) {
      console.error(`[eventService] Error fetching events:`, error);
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
    } catch (_error) {
      return [];
    }
  },

  /** 변환 함수 export */
  transform: transformBackendEvent,
};
