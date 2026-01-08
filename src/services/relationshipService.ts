import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { RelationType } from "@/types/character";

/**
 * 관계 타입 (callback_result.json 기반 확장)
 */
/**
 * 관계 타입 (src/types/character.ts 참조)
 */
export type RelationshipType = RelationType;

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  source?: { id: string; name?: string; [key: string]: unknown };
  target?: { id: string; name?: string; [key: string]: unknown };
  types: RelationshipType[]; // Updated
  type?: RelationshipType; // Deprecated
  strength: number; // 1-10
  description?: string;
  bidirectional?: boolean;
  extras?: {
    description?: string;
    since?: string;
    [key: string]: unknown;
  };
}

/**
 * 백엔드 독립 relationships 배열 타입 (callback_result.json)
 */
export interface BackendRelationship {
  source: string; // 캐릭터 이름
  target: string; // 캐릭터 이름
  relation_type: string;
  strength: number;
  description: string;
  bidirectional: boolean;
}

/**
 * callback_result.json relationships 배열 → 프론트엔드 타입 변환
 */
export function transformBackendRelationship(
  rel: BackendRelationship,
  index: number
): Relationship {
  const type = rel.relation_type as RelationshipType;
  return {
    id: `rel-${rel.source}-${rel.target}-${index}`,
    sourceId: rel.source,
    targetId: rel.target,
    type,
    types: [type],
    strength: rel.strength,
    description: rel.description,
    bidirectional: rel.bidirectional,
  };
}

export interface CreateRelationshipInput {
  sourceId: string;
  targetId: string;
  types: RelationshipType[]; // Updated: List of types
  strength: number;
  bidirectional?: boolean; // Added
  description?: string; // Added
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
