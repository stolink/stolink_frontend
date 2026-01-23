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

  // Production: Ensure protocol is present for domain-based URLs
  // Backend might return URLs without protocol like "dev.stolink.link/media/..."
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("/")
  ) {
    // Check if it looks like a domain (contains a dot before the first slash)
    const firstSlash = url.indexOf("/");
    const hasDot = url
      .substring(0, firstSlash === -1 ? url.length : firstSlash)
      .includes(".");
    if (hasDot) {
      return `https://${url}`;
    }
  }

  return url;
};

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

/**
 * Compresses an image file using Canvas.
 * Returns a base64 string of the compressed image.
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {},
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { maxWidth = 800, maxHeight = 1200, quality = 0.7 } = options;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
