import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role?: CharacterRole;
  imageUrl?: string;
  extras?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCharacterInput {
  name: string;
  role?: CharacterRole;
  extras?: Record<string, unknown>;
}

export const characterService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Character[]>>(
      `/projects/${projectId}/characters`
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
