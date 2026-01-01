import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ManuscriptUploadResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface ManuscriptJobStatus {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  message: string;
  totalDocuments?: number;
  completedAt?: string;
}

export const manuscriptService = {
  /**
   * 원고 업로드 (비동기 처리 시작)
   * POST /api/projects/{projectId}/manuscript/upload
   * Response: 202 Accepted
   */
  upload: async (
    projectId: string,
    content: string,
    filename?: string,
  ): Promise<ApiResponse<ManuscriptUploadResponse>> => {
    const response = await api.post<ApiResponse<ManuscriptUploadResponse>>(
      `/projects/${projectId}/manuscript/upload`,
      { content, filename },
    );
    return response.data;
  },

  /**
   * 작업 상태 조회
   * GET /api/jobs/{jobId}
   */
  getJobStatus: async (
    jobId: string,
  ): Promise<ApiResponse<ManuscriptJobStatus>> => {
    const response = await api.get<ApiResponse<ManuscriptJobStatus>>(
      `/jobs/${jobId}`,
    );
    return response.data;
  },
};
