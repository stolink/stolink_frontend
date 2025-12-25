import { useMutation } from "@tanstack/react-query";
import { useJobPolling } from "./useJobPolling";
import api from "@/api/client";
import type { ApiResponse, JobResponse } from "@/types/api";

// Export service endpoints
const exportService = {
  startExport: async (projectId: string, options: ExportOptions) => {
    const response = await api.post<
      ApiResponse<{ jobId: string; status: string }>
    >(`/projects/${projectId}/export`, options);
    return response.data;
  },

  getExportStatus: async (
    jobId: string
  ): Promise<JobResponse<ExportResult>> => {
    const response = await api.get<ApiResponse<JobResponse<ExportResult>>>(
      `/exports/${jobId}`
    );
    return response.data.data;
  },
};

// Types
export interface ExportOptions {
  format: "pdf" | "markdown" | "docx" | "epub";
  options?: {
    includeAll?: boolean;
    documentIds?: string[];
    includeForeshadowing?: boolean;
    pageSize?: "a4" | "letter" | "custom";
    fontSize?: number;
  };
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: string;
  format: string;
  fileSize?: number;
}

/**
 * Hook for starting export operation
 * Returns jobId that can be used with useExportStatus
 */
export function useExportProject() {
  return useMutation({
    mutationFn: ({
      projectId,
      options,
    }: {
      projectId: string;
      options: ExportOptions;
    }) => exportService.startExport(projectId, options),
  });
}

/**
 * Hook for polling export status
 * Use this after calling useExportProject to track progress
 */
export function useExportStatus(
  jobId: string | null,
  options?: {
    enabled?: boolean;
    onComplete?: (result: ExportResult) => void;
    onError?: (error: string) => void;
  }
) {
  return useJobPolling<ExportResult>(
    jobId,
    (id) => exportService.getExportStatus(id),
    {
      ...options,
      pollingInterval: 2000, // Poll every 2 seconds
    }
  );
}
