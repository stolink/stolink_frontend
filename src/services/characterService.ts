import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { Character, CharacterRole } from "@/types/character";

export type { Character };

export interface CreateCharacterInput {
  name: string;
  role?: CharacterRole;
  extras?: Record<string, string | number | boolean | string[]>;
}

export const characterService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Character[]>>(
      `/projects/${projectId}/characters`
    );
    console.log("🌐 Backend API Response (characters):", response.data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Character>>(`/characters/${id}`);
    return response.data;
  },

  create: async (projectId: string, payload: CreateCharacterInput) => {
    const response = await api.post<ApiResponse<Character>>(
      `/projects/${projectId}/characters`,
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Partial<CreateCharacterInput>) => {
    const response = await api.patch<ApiResponse<Character>>(
      `/characters/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/characters/${id}`);
    return response.data;
  },

  regenerateImage: async (id: string) => {
    const response = await api.post<ApiResponse<{ jobId: string }>>(
      `/characters/${id}/regenerate`
    );
    return response.data;
  },
};
