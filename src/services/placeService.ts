import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface Place {
  id: string;
  projectId: string;
  name: string;
  type?: string;
  imageUrl?: string;
  extras?: Record<string, unknown>;
}

export interface CreatePlaceInput {
  name: string;
  type?: string;
  extras?: Record<string, unknown>;
}

export const placeService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Place[]>>(
      `/projects/${projectId}/places`
    );
    return response.data;
  },

  create: async (projectId: string, payload: CreatePlaceInput) => {
    const response = await api.post<ApiResponse<Place>>(
      `/projects/${projectId}/places`,
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Partial<CreatePlaceInput>) => {
    const response = await api.patch<ApiResponse<Place>>(
      `/places/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/places/${id}`);
    return response.data;
  },
};
