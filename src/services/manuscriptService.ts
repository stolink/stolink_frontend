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
   *
   * 백엔드가 MultipartFile을 기대하므로 FormData로 전송
   */
  upload: async (
    projectId: string,
    content: string,
    filename?: string,
  ): Promise<ApiResponse<ManuscriptUploadResponse>> => {
    const formData = new FormData();
    const blob = new Blob([content], { type: "text/plain; charset=utf-8" });
    formData.append("file", blob, filename || "manuscript.txt");

    const response = await api.post<ApiResponse<ManuscriptUploadResponse>>(
      `/projects/${projectId}/manuscript/upload`,
      formData,
      // Content-Type은 axios가 FormData 감지 시 자동 설정
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
