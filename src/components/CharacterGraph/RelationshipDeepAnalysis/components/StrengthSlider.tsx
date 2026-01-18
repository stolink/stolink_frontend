// =====================================================
// 관계 강도 슬라이더 컴포넌트
// =====================================================

import { cn } from "@/lib/utils";

interface StrengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function StrengthSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}: StrengthSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const getStrengthLabel = (val: number): string => {
    if (val <= 2) return "매우 약함";
    if (val <= 4) return "약함";
    if (val <= 6) return "보통";
    if (val <= 8) return "강함";
    return "매우 강함";
  };

  const getStrengthColor = (val: number): string => {
    if (val <= 2) return "text-slate-400";
    if (val <= 4) return "text-blue-400";
    if (val <= 6) return "text-emerald-500";
    if (val <= 8) return "text-orange-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-espresso-700">관계 강도</label>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold", getStrengthColor(value))}>
            {getStrengthLabel(value)}
          </span>
          <span className="text-lg font-black text-espresso-900">{value}</span>
        </div>
      </div>

      <div className="relative">
        {/* Track Background */}
        <div className="h-2 bg-cloud-200 rounded-full overflow-hidden">
          {/* Filled Track */}
          <div
            className="h-full bg-gradient-to-r from-mocha-400 to-mocha-600 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input Range */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={cn(
            "absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-mocha-500",
            "[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab",
            "[&::-webkit-slider-thumb]:active:cursor-grabbing",
            "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-mocha-500",
            "[&::-moz-range-thumb]:shadow-lg",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
      </div>

      {/* Scale Markers */}
      <div className="flex justify-between px-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
          <span
            key={n}
            className={cn(
              "text-[10px] font-medium",
              n === value ? "text-mocha-600 font-bold" : "text-espresso-300",
            )}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
