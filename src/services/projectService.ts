import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface Project {
  id: string;
  title: string;
  genre: string;
  description?: string;
  coverImage?: string;
  status: "writing" | "completed";
  author?: string;
  extras?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
}

export interface ProjectStats {
  totalCharacters: number;
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  foreshadowingRecoveryRate: number;
  consistencyScore: number;
  writingDays?: number;
  estimatedPages?: number;
}

export interface ProjectListParams {
  status?: "writing" | "completed" | "all";
  genre?: string;
  sort?: "updatedAt" | "createdAt" | "title";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const projectService = {
  getAll: async (params?: ProjectListParams) => {
    const response = await api.get<
      ApiResponse<{ projects: Project[]; pagination: Pagination }>
    >("/projects", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data;
  },

  create: async (payload: Pick<Project, "title" | "genre" | "description">) => {
    const response = await api.post<ApiResponse<Project>>("/projects", payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<Project>) => {
    const response = await api.patch<ApiResponse<Project>>(
      `/projects/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/projects/${id}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get<ApiResponse<ProjectStats>>(
      `/projects/${id}/stats`,
    );
    return response.data;
  },

  duplicate: async (id: string) => {
    const response = await api.post<ApiResponse<Project>>(
      `/projects/${id}/duplicate`,
    );
    return response.data;
  },
};
