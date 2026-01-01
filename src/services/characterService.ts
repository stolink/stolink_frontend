import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Character,
  CharacterRole,
  CharacterProfile,
} from "@/types/character";

export type { Character };

/**
 * 캐릭터 생성 입력 (새 스키마)
 */
export interface CreateCharacterInput {
  role?: CharacterRole;
  profile: Partial<CharacterProfile> & { name: string };
  aliases?: string[];
  status?: string;
}

/**
 * 캐릭터 업데이트 입력
 */
export type UpdateCharacterInput = Partial<CreateCharacterInput>;

export const characterService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Character[]>>(
      `/projects/${projectId}/characters`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Character>>(`/characters/${id}`);
    return response.data;
  },

  create: async (projectId: string, payload: CreateCharacterInput) => {
    const response = await api.post<ApiResponse<Character>>(
      `/projects/${projectId}/characters`,
      payload,
    );
    return response.data;
  },

  update: async (id: string, payload: UpdateCharacterInput) => {
    const response = await api.patch<ApiResponse<Character>>(
      `/characters/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/characters/${id}`);
    return response.data;
  },

  regenerateImage: async (id: string) => {
    const response = await api.post<ApiResponse<{ jobId: string }>>(
      `/characters/${id}/regenerate`,
    );
    return response.data;
  },
};
