/**
 * Draft Service
 * 커뮤니티 배포를 위한 임시 저장(Draft) API 서비스
 */

import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { CreateDraftRequest, Draft } from "@/types/publish";

export const draftService = {
  /**
   * Draft 생성 - 스냅샷 데이터를 백엔드에 임시 저장
   * @param data Draft 생성 요청 데이터 (스냅샷 포함)
   * @returns 생성된 Draft 정보 (id 포함)
   */
  create: async (data: CreateDraftRequest) => {
    const response = await api.post<ApiResponse<Draft>>("/drafts", data);
    return response.data;
  },

  /**
   * Draft 조회 (참고용, 주로 커뮤니티 서비스에서 사용)
   */
  get: async (id: string) => {
    const response = await api.get<ApiResponse<Draft>>(`/drafts/${id}`);
    return response.data;
  },
};
