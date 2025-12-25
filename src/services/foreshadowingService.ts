import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export type ForeshadowingStatus = "pending" | "recovered" | "ignored";
export type ForeshadowingImportance = "major" | "minor";

export interface ForeshadowingAppearance {
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string;
  isRecovery: boolean;
}

export interface Foreshadowing {
  id: string;
  projectId: string;
  tag: string;
  status: ForeshadowingStatus;
  importance?: ForeshadowingImportance;
  description?: string;
  appearances: ForeshadowingAppearance[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateForeshadowingInput {
  tag: string;
  description?: string;
  importance?: ForeshadowingImportance;
}

export const foreshadowingService = {
  getAll: async (
    projectId: string,
    params?: {
      status?: ForeshadowingStatus;
      importance?: ForeshadowingImportance;
    }
  ) => {
    const response = await api.get<ApiResponse<Foreshadowing[]>>(
      `/projects/${projectId}/foreshadowing`,
      { params }
    );
    return response.data;
  },

  getUnresolved: async (projectId: string) => {
    const response = await api.get<ApiResponse<Foreshadowing[]>>(
      `/projects/${projectId}/foreshadowing/unresolved`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Foreshadowing>>(
      `/foreshadowing/${id}`
    );
    return response.data;
  },

  create: async (projectId: string, payload: CreateForeshadowingInput) => {
    const response = await api.post<ApiResponse<Foreshadowing>>(
      `/projects/${projectId}/foreshadowing`,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateForeshadowingInput & { status: ForeshadowingStatus }>
  ) => {
    const response = await api.patch<ApiResponse<Foreshadowing>>(
      `/foreshadowing/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/foreshadowing/${id}`
    );
    return response.data;
  },

  addAppearance: async (
    id: string,
    appearance: Omit<ForeshadowingAppearance, "isRecovery">
  ) => {
    const response = await api.post<ApiResponse<Foreshadowing>>(
      `/foreshadowing/${id}/appearances`,
      appearance
    );
    return response.data;
  },

  recover: async (
    id: string,
    recoveryInfo: {
      sceneId?: string;
      chapterId: string;
      chapterTitle: string;
      line: number;
      context: string;
    }
  ) => {
    const response = await api.patch<ApiResponse<Foreshadowing>>(
      `/foreshadowing/${id}/recover`,
      recoveryInfo
    );
    return response.data;
  },
};
