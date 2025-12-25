import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface Item {
  id: string;
  projectId: string;
  name: string;
  type?: string;
  imageUrl?: string;
  extras?: Record<string, unknown>;
}

export interface CreateItemInput {
  name: string;
  type?: string;
  extras?: Record<string, unknown>;
}

export const itemService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Item[]>>(
      `/projects/${projectId}/items`
    );
    return response.data;
  },

  create: async (projectId: string, payload: CreateItemInput) => {
    const response = await api.post<ApiResponse<Item>>(
      `/projects/${projectId}/items`,
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Partial<CreateItemInput>) => {
    const response = await api.patch<ApiResponse<Item>>(
      `/items/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/items/${id}`);
    return response.data;
  },

  transfer: async (id: string, newOwnerId: string) => {
    const response = await api.patch<ApiResponse<Item>>(
      `/items/${id}/transfer`,
      { newOwnerId }
    );
    return response.data;
  },
};
