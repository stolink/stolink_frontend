/* eslint-disable react-hooks/purity */
/**
 * EditorSkeleton - Loading State Component
 *
 * Agent B: The Stylist - Perceived Latency Management
 * Displays during document content loading to prevent flash/jank
 *
 * Design: Mocha palette with shimmer animation
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface EditorSkeletonProps {
  className?: string;
  /** Number of content lines to show */
  lines?: number;
}

export function EditorSkeleton({ className, lines = 12 }: EditorSkeletonProps) {
  const lineStyles = useMemo(() => {
    return Array.from({ length: lines }).map((_, i) => ({
      width: `${60 + Math.random() * 40}%`,
      animationDelay: `${i * 0.05}s`,
    }));
  }, [lines]);

  const paraStyles = useMemo(() => {
    return Array.from({ length: Math.floor(lines / 2) }).map((_, i) => ({
      width: `${50 + Math.random() * 45}%`,
      animationDelay: `${(lines + i) * 0.05}s`,
    }));
  }, [lines]);

  // CLS 방지: 실제 EditorContent와 동일한 높이를 차지하도록 h-full 사용
  return (
    <div className={cn("h-full flex flex-col animate-pulse p-6", className)}>
      {/* Title Skeleton */}
      <div className="h-8 bg-mocha-100 rounded-lg w-2/3 mb-8 shrink-0" />

      {/* Content Lines - 남은 공간 채우기 */}
      <div className="flex-1 space-y-3">
        {lineStyles.map((style, i) => (
          <div key={i} className="h-4 bg-mocha-50 rounded" style={style} />
        ))}
      </div>

      {/* Additional paragraph break */}
      <div className="mt-8 space-y-3 shrink-0">
        {paraStyles.map((style, i) => (
          <div
            key={`para2-${i}`}
            className="h-4 bg-mocha-50 rounded"
            style={style}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Skeleton for Scrivenings View (Multiple Sections)
 */
export function EditorSectionSkeleton({ className }: { className?: string }) {
  const lineStyles = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      width: `${70 + Math.random() * 30}%`,
    }));
  }, []);

  return (
    <div className={cn("space-y-3 animate-pulse py-6", className)}>
      {/* Section Title */}
      <div className="h-6 bg-mocha-100 rounded w-1/2 mb-4" />

      {/* Content Preview Lines */}
      {lineStyles.map((style, i) => (
        <div key={i} className="h-3 bg-mocha-50 rounded" style={style} />
      ))}
    </div>
  );
}
