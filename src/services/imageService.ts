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
   * Start character image generation job
   * @param projectId - Project ID containing the character
   * @param characterId - ID of the character to generate image for
   * @param description - Description for image generation (e.g., "은발 장발의 마법사")
   * @returns Job ID and initial status
   */
  generateCharacterImage: async (
    projectId: string,
    characterId: string,
    description: string,
  ): Promise<{ jobId: string; status: string }> => {
    const response = await api.post<
      ApiResponse<{ jobId: string; status: string }>
    >(`/projects/${projectId}/characters/${characterId}/image`, {
      description,
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
    >(`/ai/jobs/${jobId}`);
    return response.data.data;
  },
};
