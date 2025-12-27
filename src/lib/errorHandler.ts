import type { AxiosError } from "axios";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * API 에러를 파싱하여 사용자 친화적인 메시지를 반환
 */
export function parseApiError(error: unknown): ApiError {
  // Axios 에러 처리
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; code?: string }
      | undefined;
    const message = data?.message || error.message;
    const code = data?.code;

    return {
      message: getUserFriendlyMessage(status, message),
      status,
      code,
      details: error.response?.data,
    };
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // 알 수 없는 에러
  return {
    message: "알 수 없는 오류가 발생했습니다.",
  };
}

/**
 * HTTP 상태 코드에 따른 사용자 친화적 메시지 반환
 */
function getUserFriendlyMessage(
  status?: number,
  originalMessage?: string,
): string {
  switch (status) {
    case 400:
      return "잘못된 요청입니다. 입력값을 확인해주세요.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "접근 권한이 없습니다.";
    case 404:
      return "요청하신 리소스를 찾을 수 없습니다.";
    case 409:
      return "이미 존재하는 데이터입니다.";
    case 422:
      return "입력값 검증에 실패했습니다.";
    case 429:
      return "너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버 오류가 발생했습니다.";
    case 502:
      return "서버가 응답하지 않습니다.";
    case 503:
      return "서비스를 일시적으로 사용할 수 없습니다.";
    default:
      return originalMessage || "오류가 발생했습니다.";
  }
}

/**
 * Axios 에러 타입 가드
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    error.isAxiosError === true
  );
}

/**
 * 404 에러 처리 (리소스를 찾을 수 없을 때 null 반환)
 */
export function handle404<T>(
  error: unknown,
  fallbackValue: T | null = null,
): T | null {
  const apiError = parseApiError(error);
  if (apiError.status === 404) {
    return fallbackValue;
  }
  throw error;
}

/**
 * 에러 로깅 (프로덕션 환경에서는 외부 로깅 서비스로 전송)
 */
export function logError(error: unknown, context?: string): void {
  const apiError = parseApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` in ${context}` : ""}]:`, {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      details: apiError.details,
    });
  } else {
    // TODO: 프로덕션 환경에서는 Sentry 등 외부 로깅 서비스로 전송
    // Sentry.captureException(error, { extra: { context } });
  }
}

/**
 * TanStack Query onError 핸들러
 */
export function createQueryErrorHandler(context: string) {
  return (error: unknown): void => {
    logError(error, context);
  };
}
