import api from "@/api/client";
import axios from "axios";
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
    options?: { expiresIn?: string; password?: string },
  ) => {
    const response = await api.post<ApiResponse<ShareSettings>>(
      `/projects/${projectId}/share`,
      options,
    );
    return response.data;
  },

  /**
   * Get share settings for a project.
   * Returns null if sharing is not enabled (404 response).
   */
  getSettings: async (projectId: string) => {
    try {
      const response = await api.get<ApiResponse<ShareSettings>>(
        `/projects/${projectId}/share`,
      );
      return response.data;
    } catch (error) {
      // 404 means sharing is not enabled - return null data
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { data: null };
      }
      throw error;
    }
  },

  disable: async (projectId: string) => {
    const response = await api.delete<ApiResponse<null>>(
      `/projects/${projectId}/share`,
    );
    return response.data;
  },

  // Public endpoint (no auth)
  getShared: async (shareId: string, password?: string) => {
    const response = await api.get<ApiResponse<SharedProject>>(
      `/share/${shareId}`,
      {
        params: password ? { password } : undefined,
      },
    );
    return response.data;
  },
};
