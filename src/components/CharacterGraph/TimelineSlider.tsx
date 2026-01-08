import React, { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface TimelineSliderProps {
  currentChapter: number;
  totalChapters: number;
  onChange: (chapter: number) => void;
  className?: string;
  onPlayToggle?: (isPlaying: boolean) => void;
}

export function TimelineSlider({
  currentChapter,
  totalChapters,
  onChange,
  className,
  onPlayToggle,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        onChange(Math.min(currentChapter + 1, totalChapters));
        if (currentChapter >= totalChapters) {
          setIsPlaying(false);
        }
      }, 1500); // 1.5s per chapter for visualization
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentChapter, totalChapters, onChange]);

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlayToggle?.(!isPlaying);
  };

  return (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-30",
        "bg-white/90 backdrop-blur-md border border-cloud-200 shadow-xl rounded-2xl p-4",
        "flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs font-medium text-espresso-500 uppercase tracking-widest">
        <span>Timeline (Chapter {currentChapter})</span>
        <span>Total: {totalChapters}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayClick}
          className="p-2 rounded-full hover:bg-cloud-100 transition-colors text-mocha-600 focus:outline-none focus:ring-2 focus:ring-mocha-500/50"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[currentChapter]}
          max={totalChapters}
          min={1}
          step={1}
          onValueChange={(vals) => onChange(vals[0])}
        >
          <Slider.Track className="bg-cloud-200 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-mocha-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-mocha-500 shadow-md rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-mocha-500/50 transition-transform"
            aria-label="Chapter Timeline"
          />
        </Slider.Root>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(Math.max(1, currentChapter - 1))}
            className="p-1.5 rounded-md hover:bg-cloud-100 text-espresso-400 hover:text-espresso-600"
          >
            <SkipBack className="w-3 h-3" />
          </button>
          <button
            onClick={() =>
              onChange(Math.min(totalChapters, currentChapter + 1))
            }
            className="p-1.5 rounded-md hover:bg-cloud-100 text-espresso-400 hover:text-espresso-600"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
