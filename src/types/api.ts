export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobResponse<T = unknown> {
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  result?: T;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiAnalysisResult {
  message: string;
  suggestions: string[];
}
