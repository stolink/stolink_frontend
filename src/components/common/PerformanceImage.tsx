import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PerformanceImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: number; // width / height
  fallbackSrc?: string;
  lowResSrc?: string;
  priority?: boolean;
}

/**
 * Performance-optimized Image Component
 * - Prevents CLS by reserving space using aspectRatio or explicit dimensions
 * - Supports priority loading via resource hints (manual implementation in useEffect)
 * - Native lazy loading by default
 * - Smooth transition from low-res or placeholder
 */
export const PerformanceImage: React.FC<PerformanceImageProps> = ({
  src,
  alt,
  className,
  aspectRatio,
  fallbackSrc = "/placeholder-image.png",
  lowResSrc,
  priority = false,
  style,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    lowResSrc || src,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (priority && src) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (currentSrc !== src) {
      setCurrentSrc(src);
    }
  };

  const handleError = () => {
    setError(true);
    setCurrentSrc(fallbackSrc);
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#f3f4f6", // Light gray placeholder
    ...(aspectRatio ? { aspectRatio: `${aspectRatio}` } : {}),
    ...style,
  };

  return (
    <div className={cn("overflow-hidden", className)} style={containerStyle}>
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/20" />
      )}
    </div>
  );
};
