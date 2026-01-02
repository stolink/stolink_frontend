import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ProjectSetting {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type?: string;
  imageUrl?: string;
  // backend SettingResponse may have more fields
}

export const settingService = {
  /**
   * Get all settings (backgrounds/places) for a project
   * Endpoint: /api/projects/{projectId}/settings
   */
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<ProjectSetting[]>>(
      `/projects/${projectId}/settings`,
    );
    return response.data;
  },
};
