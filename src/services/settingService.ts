import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ProjectSetting {
  id: string;
  name: string;
  type?: string;
  category?: string; // Keep for compatibility if needed
  description?: string;
  atmosphere?: string;
  lighting?: string;
  time_of_day?: string;
  art_style?: string;
  visual_background?: string;
  createdAt?: string;
}

// Helper to safe parse or return object

interface BackendSetting {
  id?: string;
  _id?: string;
  setting_id?: string;
  project_id?: string;
  projectId?: string;
  name?: string;
  type?: string;
  category?: string;
  description?: string;
  atmosphere?: string;
  lighting?: string;
  time_of_day?: string;
  timeOfDay?: string;
  art_style?: string;
  artStyle?: string;
  visual_background?: string;
  visualBackground?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

function transformBackendSetting(backend: BackendSetting): ProjectSetting {
  return {
    id: (backend.id || backend._id || backend.setting_id || "") as string,
    // [Fix] Map snake_case project_id to camelCase if needed, though interface doesn't strictly demand it yet
    // but useful if we extend ProjectSetting to include projectId
    name: (backend.name as string) || "Untitled Setting",
    type: (backend.type as string) || "place",
    category: (backend.category as string) || "place",
    description: (backend.description as string) || "",
    atmosphere: (backend.atmosphere as string) || "",
    lighting: (backend.lighting as string) || "",
    time_of_day:
      (backend.time_of_day as string) || (backend.timeOfDay as string) || "",
    art_style:
      (backend.art_style as string) || (backend.artStyle as string) || "",
    visual_background:
      (backend.visual_background as string) ||
      (backend.visualBackground as string) ||
      "",
    createdAt:
      (backend.created_at as string) || (backend.createdAt as string) || "",
  };
}

export const settingService = {
  /**
   * Get all settings (backgrounds/places) for a project
   * Endpoint: /api/projects/{projectId}/settings
   */
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<BackendSetting[]>>(
      `/projects/${projectId}/settings`,
    );

    // Transform backend data
    const settings = Array.isArray(response.data.data)
      ? response.data.data.map(transformBackendSetting)
      : [];

    return { ...response.data, data: settings };
  },
};
