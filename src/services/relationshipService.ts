import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export type RelationshipType =
  | "friendly"
  | "hostile"
  | "neutral"
  | "romantic"
  | "family";

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  source?: { id: string; name?: string; [key: string]: unknown };
  target?: { id: string; name?: string; [key: string]: unknown };
  type: RelationshipType;
  strength: number; // 1-10
  extras?: {
    description?: string;
    since?: string;
    [key: string]: unknown;
  };
}

export interface CreateRelationshipInput {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number;
  extras?: Record<string, unknown>;
}

export const relationshipService = {
  /**
   * @deprecated
   * GET /projects/{projectId}/relationships 엔드포인트가 삭제되었습니다.
   * useCharacters 훅을 사용하고 character.relationships에서 데이터를 추출하세요.
   *
   * @throws Error - 항상 에러 발생
   */
  getAll: async () => {
    throw new Error(
      "GET /projects/{projectId}/relationships endpoint has been removed. " +
        "Use characterService.getAll() and extract from character.relationships instead."
    );
  },

  create: async (payload: CreateRelationshipInput) => {
    const response = await api.post<ApiResponse<Relationship>>(
      "/relationships",
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Partial<CreateRelationshipInput>) => {
    const response = await api.patch<ApiResponse<Relationship>>(
      `/relationships/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/relationships/${id}`
    );
    return response.data;
  },
};
