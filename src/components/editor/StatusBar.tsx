import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores";
import { Check } from "lucide-react";

interface StatusBarProps {
  currentCount: number;
  targetCount: number;
  totalScenes: number;
  viewMode: "editor" | "grid";
}

export function StatusBar({
  currentCount,
  targetCount,
  totalScenes,
  viewMode,
}: StatusBarProps) {
  const { saveStatus, lastSavedAt } = useEditorStore();

  const progress = Math.min(
    100,
    Math.round((currentCount / targetCount) * 100),
  );

  // 진행률에 따른 색상
  const progressColor =
    progress >= 100
      ? "bg-green-500"
      : progress >= 80
        ? "bg-sage-500"
        : progress >= 50
          ? "bg-amber-500"
          : "bg-stone-300";

  return (
    <div className="h-8 px-4 border-t bg-stone-50 flex items-center justify-between text-xs text-muted-foreground shrink-0 select-none">
      <div className="flex items-center gap-6">
        {viewMode === "editor" ? (
          <>
            <div className="flex items-center gap-2 group relative cursor-help">
              <span className="font-medium text-stone-700">
                {currentCount.toLocaleString()}자
              </span>
              <span className="text-stone-400">/</span>
              <span>{targetCount.toLocaleString()}자</span>

              {/* Progress Bar (Mini) */}
              <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden ml-2">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    progressColor,
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-500 ml-1">
                {progress}%
              </span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-stone-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                목표 달성률
              </div>
            </div>

            {/* Reading Time */}
            <div className="hidden sm:flex items-center gap-1.5 text-stone-500">
              <span className="text-stone-300">|</span>
              <span>읽기 약 {Math.ceil(currentCount / 500)}분</span>
            </div>
          </>
        ) : (
          <span className="font-medium">총 {totalScenes}개 씬</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" ? (
            <>
              <span className="w-2 h-2 rounded-full border border-stone-400 border-t-transparent animate-spin" />
              <span>저장 중...</span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <Check className="w-3 h-3 text-stone-400" />
              <span className="text-stone-400">
                {lastSavedAt
                  ? lastSavedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}{" "}
                저장됨
              </span>
            </>
          ) : (
            <span className="text-amber-500">저장되지 않음</span>
          )}
        </div>
      </div>
    </div>
  );
}
