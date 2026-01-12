import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveImageUrl } from "./imageUtils";

describe("resolveImageUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    // Default to DEV environment for most tests
    vi.stubGlobal("import.meta", { env: { DEV: true } });
  });

  afterEach(() => {
    vi.unstubGlobal("import.meta");
  });

  it("should return undefined for null or undefined input", () => {
    expect(resolveImageUrl(null)).toBeUndefined();
    expect(resolveImageUrl(undefined)).toBeUndefined();
  });

  it("should replace minio:9000 with localhost:9001 in DEV environment", () => {
    const minioUrl = "http://minio:9000/stolink-test/media/image.png";
    expect(resolveImageUrl(minioUrl)).toBe(
      "http://localhost:9001/stolink-test/media/image.png",
    );
  });

  it("should resolve relative paths starting with /stolink-test/ to localhost:9001 in DEV", () => {
    const relativeUrl = "/stolink-test/media/image.png";
    expect(resolveImageUrl(relativeUrl)).toBe(
      "http://localhost:9001/stolink-test/media/image.png",
    );
  });

  it("should resolve relative paths starting with stolink-test/ (no slash) to localhost:9001 in DEV", () => {
    const relativeUrl = "stolink-test/media/image.png";
    expect(resolveImageUrl(relativeUrl)).toBe(
      "http://localhost:9001/stolink-test/media/image.png",
    );
  });

  it("should resolve relative paths starting with /media/ to localhost:9001 in DEV", () => {
    const relativeUrl = "/media/image.png";
    expect(resolveImageUrl(relativeUrl)).toBe(
      "http://localhost:9001/media/image.png",
    );
  });

  it("should leave other URLs unchanged in DEV", () => {
    const externalUrl = "https://example.com/image.png";
    expect(resolveImageUrl(externalUrl)).toBe(externalUrl);
  });

  it("should leave minio URLs unchanged in PROD environment", () => {
    vi.stubGlobal("import.meta", { env: { DEV: false } });
    const minioUrl = "http://minio:9000/stolink-test/media/image.png";
    expect(resolveImageUrl(minioUrl)).toBe(minioUrl);
  });
});
