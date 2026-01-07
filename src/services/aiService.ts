import api from "@/api/client";
import type { ApiResponse, JobResponse } from "@/types/api";

const BASE_URL = "/ai";

interface ChatContext {
  includeCharacters?: boolean;
  includeForeshadowing?: boolean;
  [key: string]: unknown;
}

export const aiService = {
  // 1. Chat
  chat: async (payload: {
    projectId: string;
    documentId?: string;
    message: string;
    context?: ChatContext;
  }) => {
    const response = await api.post<
      ApiResponse<{ message: string; suggestions: string[] }>
    >(`${BASE_URL}/chat`, payload);
    return response.data;
  },

  // 2. Consistency Check
  checkConsistency: async (payload: {
    projectId: string;
    documentIds: string[];
  }) => {
    const response = await api.post<
      ApiResponse<{ issues: ConsistencyIssue[]; score: number }>
    >(`${BASE_URL}/consistency-check`, payload);
    return response.data;
  },

  // 3. Analyze Story (Long-running Job)
  analyzeStory: async (payload: {
    projectId: string;
    documentId: string;
    content: string;
  }) => {
    const response = await api.post<
      ApiResponse<{ jobId: string; status: string }>
    >(`${BASE_URL}/analyze`, payload);
    return response.data;
  },

  // Job Status Polling
  getJobStatus: async <T>(jobId: string): Promise<JobResponse<T>> => {
    const response = await api.get<ApiResponse<JobResponse<T>>>(
      `/ai/jobs/${jobId}`,
    );
    return response.data.data;
  },

  // SSE Stream URL for project-wide status (e.g., analysis, import)
  getProjectStatusStreamUrl: (projectId: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    return `${baseUrl}/project/${projectId}/status/stream`;
  },

  // Job SSE Stream URL (for specific long-running jobs)
  getJobStreamUrl: (jobId: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    return `${baseUrl}/ai/jobs/${jobId}/stream`;
  },

  // --- Mock Methods for Testing ---
  mockAnalyzeStory: async (): Promise<{
    success: boolean;
    data: { jobId: string; status: string };
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { jobId: "mock-job-" + Date.now(), status: "pending" },
        });
      }, 500);
    });
  },

  mockGetJobStatus: async <T>(jobId: string): Promise<JobResponse<T>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const random = Math.random();
        const status = random > 0.8 ? "completed" : "processing";

        resolve({
          jobId,
          status,
          progress: Math.floor(Math.random() * 100),
          result:
            status === "completed"
              ? ({ message: "Analysis complete!" } as unknown as T)
              : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 1000);
    });
  },

  calculateContentHash: (content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  },
};

// Types for consistency check
interface ConsistencyIssue {
  type: string;
  severity: "warning" | "error";
  documentId: string;
  line: number;
  message: string;
  suggestion?: string;
}
