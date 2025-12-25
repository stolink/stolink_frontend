import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ShareSettings {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
  hasPassword: boolean;
}

export interface SharedProject {
  id: string;
  title: string;
  description?: string;
  documents: unknown[];
}

export const shareService = {
  create: async (
    projectId: string,
    options?: { expiresIn?: string; password?: string }
  ) => {
    const response = await api.post<ApiResponse<ShareSettings>>(
      `/projects/${projectId}/share`,
      options
    );
    return response.data;
  },

  getSettings: async (projectId: string) => {
    const response = await api.get<ApiResponse<ShareSettings>>(
      `/projects/${projectId}/share`
    );
    return response.data;
  },

  disable: async (projectId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/projects/${projectId}/share`
    );
    return response.data;
  },

  // Public endpoint (no auth)
  getShared: async (shareId: string, password?: string) => {
    const response = await api.get<ApiResponse<SharedProject>>(
      `/share/${shareId}`,
      {
        params: password ? { password } : undefined,
      }
    );
    return response.data;
  },
};
