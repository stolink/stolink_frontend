/**
 * Resolves image URLs ensuring they are accessible from the browser.
 * In development environment (Docker), it replaces internal 'minio' hostname with 'localhost'.
 */
export const resolveImageUrl = (
  url: string | undefined | null,
): string | undefined => {
  if (!url) return undefined;

  // Development environment fix for Docker networking
  // This ensures that when running locally with Docker Compose,
  // the browser can access MinIO via localhost instead of the internal container name
  if (import.meta.env.DEV) {
    // Case 1: URL contains internal minio hostname
    if (url.includes("minio:9000")) {
      return url.replace("http://minio:9000", "http://localhost:9001");
    }

    // Case 2: URL is a relative path to MinIO bucket
    // e.g. "stolink-test/..." or "/stolink-test/..."
    const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
    if (cleanUrl.startsWith("stolink-test/") || cleanUrl.startsWith("media/")) {
      return `http://localhost:9001/${cleanUrl}`;
    }
  }

  return url;
};
