import api from "@/api/client";
import type { ApiResponse, JobResponse } from "@/types/api";
import type { AnalysisResultData } from "@/types/analysisResult";

const BASE_URL = "/ai";

interface ChatContext {
  includeCharacters?: boolean;
  includeForeshadowing?: boolean;
  [key: string]: unknown;
}

// 프로젝트 분석 Job 상태 응답 타입
export interface ProjectAnalysisJobStatus {
  jobId: string | null;
  status: "processing" | "pending" | "completed" | "failed" | null;
  progress?: number;
  lastCompletedAt?: string;
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
    documentId?: string;
    content?: string;
    documentIds?: string[];
    analysisType?: "partial_snippet" | "full";
  }) => {
    let url = `${BASE_URL}/analyze`;
    const requestBody: Record<string, unknown> = { ...payload };

    // If documentId is present, use the resource-specific endpoint
    if (payload.documentId) {
      url = `/documents/${payload.documentId}/analyze`;
    }

    // Map analysisType to analysis_type (snake_case)
    if (payload.analysisType) {
      requestBody.analysis_type = payload.analysisType;
    }

    const response = await api.post<
      ApiResponse<{ jobId: string; status: string }>
    >(url, requestBody);
    return response.data;
  },

  // 4. Get Analysis Result (Directly by Document ID)
  getAnalysisResult: async (documentId: string) => {
    const response = await api.get<ApiResponse<AnalysisResultData>>(
      `/documents/${documentId}/analysis`
    );
    return response.data;
  },

  // Job Status Polling
  getJobStatus: async <T>(jobId: string): Promise<JobResponse<T>> => {
    const response = await api.get<ApiResponse<JobResponse<T>>>(
      `/ai/jobs/${jobId}`
    );
    return response.data.data;
  },

  // 5. Get Project Analysis Job Status (프로젝트 기준 최신 job 상태 조회)
  getProjectAnalysisJob: async (
    projectId: string
  ): Promise<ProjectAnalysisJobStatus> => {
    const response = await api.get<ApiResponse<ProjectAnalysisJobStatus>>(
      `/projects/${projectId}/analysis/job`
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
