import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { parseApiError, handle404 } from "./errorHandler";

describe("errorHandler", () => {
  describe("parseApiError", () => {
    it("Axios 에러에서 메시지와 상태 코드를 추출해야 한다", () => {
      const error = new AxiosError(
        "Error",
        "ERR_BAD_REQUEST",
        undefined,
        {},
        {
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: "잘못된 요청입니다" },
        },
      );

      const result = parseApiError(error);

      expect(result).toEqual({
        message: "잘못된 요청입니다. 입력값을 확인해주세요.", // getUserFriendlyMessage가 변환함
        status: 400,
        code: undefined,
        details: { message: "잘못된 요청입니다" },
      });
    });

    it("백엔드 에러 응답이 없을 때 기본 메시지를 반환해야 한다", () => {
      const error = new AxiosError("Network Error", "ERR_NETWORK");
      const result = parseApiError(error);

      expect(result.status).toBeUndefined();
      expect(result.message).toBe("Network Error");
    });

    it("일반 Error 객체를 처리해야 한다", () => {
      const error = new Error("일반 에러");
      const result = parseApiError(error);

      expect(result.message).toBe("일반 에러");
    });

    it("알 수 없는 에러를 처리해야 한다", () => {
      const result = parseApiError("unknown error");
      expect(result.message).toBe("알 수 없는 오류가 발생했습니다.");
    });
  });

  describe("handle404", () => {
    it("404 에러일 때 fallback 값을 반환해야 한다", () => {
      const error = new AxiosError(
        "Not Found",
        "404",
        undefined,
        {},
        {
          status: 404,
          statusText: "Not Found",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {},
        },
      );

      const result = handle404(error, "fallback");
      expect(result).toBe("fallback");
    });

    it("404가 아닌 에러는 다시 throw해야 한다", () => {
      const error = new AxiosError(
        "Server Error",
        "500",
        undefined,
        {},
        {
          status: 500,
          statusText: "Internal Server Error",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {},
        },
      );

      expect(() => handle404(error)).toThrow(error);
    });
  });
});
