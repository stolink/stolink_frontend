/**
 * Resolves image URLs ensuring they are accessible from the browser.
 * In development environment (Docker), it replaces internal 'minio' hostname with 'localhost'.
 */
export const resolveImageUrl = (
  url: string | undefined | null
): string | undefined => {
  if (!url) return undefined;

  // Development environment fix for Docker networking
  // This ensures that when running locally with Docker Compose,
  // the browser can access MinIO via localhost instead of the internal container name
  if (import.meta.env.DEV) {
    if (url.includes("minio:9000")) {
      return url.replace("http://minio:9000", "http://localhost:9000");
    }
  }

  return url;
};
