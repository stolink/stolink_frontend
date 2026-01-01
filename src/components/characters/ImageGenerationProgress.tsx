import { Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImageGenerationProgressProps {
  progress: number;
  message?: string;
  onCancel?: () => void;
  className?: string;
}

/**
 * Progress indicator for AI image generation
 * Shows loading spinner, progress bar, and optional cancel button
 */
export function ImageGenerationProgress({
  progress,
  message = "Generating character portrait...",
  onCancel,
  className = "",
}: ImageGenerationProgressProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 ${className}`}
    >
      {/* Header with spinner and cancel */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm font-medium text-purple-900">{message}</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel generation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-purple-600 text-right font-mono">
          {progress}%
        </p>
      </div>
    </div>
  );
}

/**
 * Compact avatar overlay version for use in character cards
 */
interface ImageGenerationOverlayProps {
  progress: number;
}

export function ImageGenerationOverlay({
  progress,
}: ImageGenerationOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex flex-col items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
      <span className="text-xs font-mono text-white font-bold">
        {progress}%
      </span>
    </div>
  );
}
