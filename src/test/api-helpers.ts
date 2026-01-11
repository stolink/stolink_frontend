import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { expect } from "vitest";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export interface ApiTestCase {
  id: string;
  description: string;
  method: HttpMethod;
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

  // 1. Setup Mock
  const httpMethod = http[method];

  // We use a clean handler for each test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = (httpMethod as any)(`${API_URL}${tc.url}`, async () => {
    return HttpResponse.json(tc.mockResponse.body as Record<string, unknown>, {
      status: tc.mockResponse.status || 200,
    });
  });
  server.use(handler);

  // 2. Perform Request
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
  const text = await res.text();
  if (text && tc.verify) {
    const json = JSON.parse(text);
    tc.verify(json);
  }
};
