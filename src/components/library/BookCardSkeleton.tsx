import { cn } from "@/lib/utils";

interface BookCardSkeletonProps {
  className?: string;
}

/**
 * BookCard 로딩 스켈레톤
 * Shimmer 애니메이션이 적용된 프리미엄 로딩 UI
 */
export function BookCardSkeleton({ className }: BookCardSkeletonProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-paper rounded-xl overflow-hidden border border-cloud-200 shadow-paper",
        className,
      )}
    >
      {/* Cover Image Skeleton - Vertical Aspect Ratio [3/4] */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-cloud-50 to-cloud-100">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Book Icon Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cloud-200/50 animate-pulse" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-cloud-100 rounded-md w-4/5 animate-pulse" />
          <div className="h-3 bg-cloud-100 rounded-md w-1/3 animate-pulse" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="h-3 bg-cloud-100 rounded-md w-2/3 animate-pulse" />
          <div className="h-3 bg-cloud-100 rounded-md w-1/2 ml-auto animate-pulse" />
        </div>

        {/* Footer Skeleton */}
        <div className="pt-3 border-t border-cloud-200/60 flex items-center justify-between">
          <div className="h-5 bg-cloud-100 rounded-md w-16 animate-pulse" />
          <div className="h-5 bg-cloud-100 rounded-full w-12 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
