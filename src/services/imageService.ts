import api from "@/api/client";
import type { ApiResponse, JobResponse } from "@/types/api";

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
  ): Promise<{ jobId: string; status: string }> => {
    const response = await api.post<
      ApiResponse<{ jobId: string; status: string }>
    >(`/projects/${projectId}/characters/${characterId}/image`, {
      action,
      description,
      setting,
    });
    return response.data.data;
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
    const response = await api.get<
      ApiResponse<JobResponse<ImageGenerationResult>>
    >(`/ai/image/jobs/${jobId}`);

    // Normalize status to lowercase to match frontend expectations
    if (response.data.data) {
      const data = response.data.data;
      data.status =
        data.status.toLowerCase() as JobResponse<ImageGenerationResult>["status"];

      // Flattened response handling: if result is missing but imageUrl is present,
      // move it into result to match JobResponse<T> structure
      interface FlattenedResponse extends JobResponse<ImageGenerationResult> {
        imageUrl?: string;
        prompt?: string;
        modelUsed?: string;
      }

      const flattened = data as unknown as FlattenedResponse;
      if (!data.result && flattened.imageUrl) {
        data.result = {
          imageUrl: flattened.imageUrl,
          prompt: flattened.prompt,
          modelUsed: flattened.modelUsed,
        };
      }
    }

    return response.data.data;
  },
};
