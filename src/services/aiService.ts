import api from "@/api/client";
import type { ApiResponse, JobResponse } from "@/types/api";
import type {
  AnalysisResultData,
  BackendConsistencyReport,
} from "@/types/analysisResult";
import { calculateContentHash } from "@/utils/hashUtils";

const BASE_URL = "/ai"; // Spring Backend endpoints

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

const CHAT_BASE_URL = "/ai-api"; // FastAPI Chat service

export const aiService = {
  // 1. Chat (FastAPI - stolink-chat)
  chat: async (payload: {
    projectId: string;
    documentId?: string;
    message: string;
    context?: ChatContext;
  }) => {
    const response = await api.post<
      ApiResponse<{ message: string; suggestions: string[] }>
    >(`${CHAT_BASE_URL}/stream`, payload);
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
      `/documents/${documentId}/analysis`,
    );
    return response.data;
  },

  // Job Status Polling
  getJobStatus: async <T>(jobId: string): Promise<JobResponse<T>> => {
    const response = await api.get<ApiResponse<JobResponse<T>>>(
      `/ai/jobs/${jobId}`,
    );
    return response.data.data;
  },

  // 5. Get Project Analysis Job Status (프로젝트 기준 최신 job 상태 조회)
  getProjectAnalysisJob: async (
    projectId: string,
  ): Promise<ProjectAnalysisJobStatus> => {
    const response = await api.get<ApiResponse<ProjectAnalysisJobStatus>>(
      `/projects/${projectId}/analysis/job`,
    );
    return response.data.data;
  },

  // 6. Get Consistency Report (Latest)
  getConsistencyReport: async (
    projectId: string,
  ): Promise<BackendConsistencyReport> => {
    const response = await api.get<ApiResponse<BackendConsistencyReport>>(
      `/projects/${projectId}/consistency-report`,
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

  mockGetConsistencyReport: async (
    _projectId: string,
  ): Promise<BackendConsistencyReport> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          job_id: "uuid-job-1234",
          created_at: new Date().toISOString(),
          score: 75,
          overall_score: 75,
          requires_human_review: true,
          conflicts: [
            {
              type: "TIMELINE_CONFLICT",
              severity: "HIGH",
              description: "박민수가 죽은 상태에서 4화에 다시 등장합니다.",
              suggestion:
                "해당 캐릭터의 생존 여부를 타임라인에서 확인하고, 사망 시점 이후의 등장을 삭제하거나 회상신으로 처리하세요.",
              location: {
                chapter: "4화",
                line: 15,
                document_id: "uuid-doc-5678",
              },
            },
            {
              type: "CHARACTER_TRAIT_CONFLICT",
              severity: "MEDIUM",
              description: "진혁의 성격이 1화와 다르게 묘사됩니다.",
              suggestion:
                "캐릭터 시트의 성격 키워드와 해당 장면의 행동이 일치하는지 재검토하세요.",
              location: {
                chapter: "2화",
                line: 10,
              },
            },
          ],
          resolution_summary: {
            high_severity_count: 1,
            total_conflicts: 2,
            auto_fixable: 0,
            needs_human_review: 1,
            ready_for_update: 0,
          },
        });
      }, 800);
    });
  },

  calculateContentHash,
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
