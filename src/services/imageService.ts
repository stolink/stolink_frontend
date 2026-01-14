import api from "@/api/client";
import type { JobResponse } from "@/types/api";
import { resolveImageUrl } from "@/utils/imageUtils";

export interface ImageGenerationResult {
  imageUrl: string;
  prompt?: string;
  modelUsed?: string;
}

export interface GenerateImageRequest {
  description: string;
}

export const imageService = {
  /**
   * Start character image generation/editing job
   * @param projectId - Project ID
   * @param characterId - Character ID
   * @param action - "create" or "edit"
   * @param description - Additional user prompt
   * @param setting - Optional background/setting object
   * @returns Job ID
   */
  generateCharacterImage: async (
    projectId: string,
    characterId: string,
    action: "create" | "edit",
    description: string,
    setting?: Record<string, unknown>,
    additionalOptions?: {
      visual_background?: string;
      atmosphere?: string;
      lighting?: string;
      time_of_day?: string;
      art_style?: string;
    },
    characterData?: Record<string, unknown>,
  ): Promise<{ jobId: string; status: string }> => {
    const response = await api.post<
      | { data: { jobId: string; status?: string } }
      | { jobId: string; status?: string }
    >(`/projects/${projectId}/characters/${characterId}/image`, {
      action,
      description,
      setting,
      ...additionalOptions,
      ...characterData,
    });

    // Handle both wrapped (response.data.data) and flattened (response.data) formats
    const responseData = response.data as {
      data?: { jobId: string; status?: string };
      jobId: string;
      status?: string;
    };
    const result = responseData.data || responseData;
    if (!result || !result.jobId) {
      throw new Error("Failed to get jobId from generation response");
    }

    return {
      jobId: result.jobId,
      status: result.status || "pending",
    };
  },

  /**
   * Get image generation job status
   * This wraps the generic job status endpoint with image-specific typing
   * @param jobId - Job ID to check
   * @returns Job status with image generation result
   */
  getImageJobStatus: async (
    jobId: string,
  ): Promise<JobResponse<ImageGenerationResult>> => {
    let response;
    let retries = 10;
    let lastError;

    while (retries > 0) {
      try {
        response = await api.get<
          | { data: { status: string; url?: string } }
          | { status: string; url?: string }
        >(`/ai/image/jobs/${jobId}`);
        break; // Success
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } };
        lastError = err;
        // If 404, the job might not be indexed yet, retry
        if (axiosError.response?.status === 404 && retries > 1) {
          console.warn(
            `[ImageService] Job ${jobId} not found yet. Retrying... (${retries} attempts left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries--;
          continue;
        }
        throw err; // For other errors or last attempt
      }
    }

    if (!response) throw lastError || new Error("Job status check failed");

    // Handle both wrapped (response.data.data) and flattened (response.data) formats
    interface RawJobResponse {
      data?: RawJobResponse;
      jobId?: string;
      status?: string;
      progress?: number;
      message?: string;
      error?: string;
      createdAt?: string;
      created_at?: string;
      updatedAt?: string;
      updated_at?: string;
      result?: ImageGenerationResult;
      imageUrl?: string;
      prompt?: string;
      modelUsed?: string;
    }
    const responseData = response.data as RawJobResponse;
    const rawData = responseData.data || responseData;

    if (rawData?.status === "failed" || rawData?.status === "FAILED") {
      console.warn("[ImageService] Job failed. RAW BACKEND RESPONSE:", rawData);
    }

    if (!rawData || !rawData.status) {
      throw new Error("Invalid job status response");
    }

    // Standardize JobResponse format
    const data: JobResponse<ImageGenerationResult> = {
      jobId: rawData.jobId || jobId,
      status: (rawData.status.toLowerCase() ||
        "pending") as JobResponse<ImageGenerationResult>["status"],
      progress: rawData.progress || 0,
      message:
        rawData.message ||
        ((rawData as Record<string, unknown>).errorMessage as string),
      error:
        rawData.error ||
        ((rawData as Record<string, unknown>).errorMessage as string),
      createdAt:
        rawData.createdAt || rawData.created_at || new Date().toISOString(),
      updatedAt:
        rawData.updatedAt || rawData.updated_at || new Date().toISOString(),
      result: rawData.result,
    };

    // Flattened result handling (legacy/fallback)
    interface FlattenedFields {
      imageUrl?: string;
      prompt?: string;
      modelUsed?: string;
    }
    const flattened = rawData as FlattenedFields;
    if (!data.result && flattened.imageUrl) {
      data.result = {
        imageUrl: flattened.imageUrl,
        prompt: flattened.prompt,
        modelUsed: flattened.modelUsed,
      };
    }

    // Apply URL resolution to result
    if (data.result && data.result.imageUrl) {
      data.result.imageUrl =
        resolveImageUrl(data.result.imageUrl) || data.result.imageUrl;
    }

    return data;
  },
};
