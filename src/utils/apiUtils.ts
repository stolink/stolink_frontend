import type { ApiResponse } from "@/types/api";

/**
 * API 응답이 성공인지 확인
 * 여러 형태의 성공 응답을 통합 검증
 */
export function isApiSuccess<T>(response: ApiResponse<T>): boolean {
  return (
    response.success === true ||
    response.status === "OK" ||
    response.status === "CREATED" ||
    response.code === 200 ||
    response.code === 201
  );
}

/**
 * API 응답에서 데이터 추출 (성공 시)
 * @throws Error if response is not successful
 */
export function getApiData<T>(
  response: ApiResponse<T>,
  errorMessage: string
): T {
  if (!isApiSuccess(response) || !response.data) {
    console.error(`[API] ${errorMessage}:`, response);
    throw new Error(errorMessage);
  }
  return response.data;
}
