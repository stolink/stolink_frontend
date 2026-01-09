import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ProjectSetting {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type?: string;
  imageUrl?: string;
  visual_background?: string;
  atmosphere?: string;
  lighting?: string;
  time_of_day?: string;
  art_style?: string;
  // backend SettingResponse may have more fields
}

export const settingService = {
  /**
   * Get all settings (backgrounds/places) for a project
   * Endpoint: /api/projects/{projectId}/settings
   */
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<ProjectSetting[]>>(
      `/projects/${projectId}/settings`
    );
    return response.data;
  },
};
