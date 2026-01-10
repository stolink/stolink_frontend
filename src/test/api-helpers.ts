import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { expect } from "vitest";

export interface ApiTestCase {
  id: string;
  description: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  url: string; // The endpoint path definition (can include params like :id)
  requestUrl?: string; // The actual URL to call (e.g. replacing :id with value). Defaults to url if no params.
  requestBody?: unknown;
  mockResponse: {
    status?: number;
    body?: unknown;
  };
  expectedStatus?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verify?: (json: any) => void;
}

export const runApiTest = async (tc: ApiTestCase) => {
  const API_URL = "/api";
  // Ensure method is lowercase for msw http[method] access
  const method = tc.method.toLowerCase() as keyof typeof http;

  if (typeof http[method] !== "function") {
    throw new Error(`Unsupported method: ${tc.method}`);
  }

  // 1. Setup Mock
  // We use a clean handler for each test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = (http[method] as any)(`${API_URL}${tc.url}`, async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return HttpResponse.json(tc.mockResponse.body as any, {
      status: tc.mockResponse.status || 200,
    });
  });
  server.use(handler);

  // 2. Perform Request
  // Remove leading slash if present to avoid double slash with API_URL if not careful,
  // but here API_URL has no trailing slash and urls usually start with /.
  const endpoint = tc.requestUrl || tc.url;
  const fetchUrl = `${API_URL}${endpoint}`;

  const options: RequestInit = {
    method: tc.method,
    headers: tc.requestBody
      ? { "Content-Type": "application/json" }
      : undefined,
    body: tc.requestBody ? JSON.stringify(tc.requestBody) : undefined,
  };

  const res = await fetch(fetchUrl, options);

  // 3. Verify Status
  expect(res.status).toBe(tc.expectedStatus || 200);

  // 4. Verify Body
  // Only parse JSON if we expect a body or need verification
  if (tc.verify || tc.mockResponse.body) {
    // Some responses might be empty (204 or just success: true)
    // If content-length is 0, don't parse
    const text = await res.text();
    if (text) {
      const json = JSON.parse(text);
      if (tc.verify) {
        tc.verify(json);
      }
    }
  }
};
