import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import {
  type Event,
  type BackendEvent,
  transformBackendEvent,
} from "@/types/event";

// Local definition removed to use centralized logic from types/event.ts
export { transformBackendEvent };

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

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(transformBackendEvent);
    } catch (_error: unknown) {
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
