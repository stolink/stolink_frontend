import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportBookCardProps {
  onClick: () => void;
  className?: string;
}

export function ImportBookCard({ onClick, className }: ImportBookCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center h-full min-h-[320px] w-full rounded-2xl",
        "border-2 border-dashed border-stone-300 hover:border-sage-400",
        "bg-gradient-to-br from-stone-50 to-stone-100/50 hover:from-sage-50/50 hover:to-stone-100",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
        className,
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          "bg-white shadow-sm border border-stone-200",
          "group-hover:bg-sage-50 group-hover:border-sage-200 group-hover:shadow-md",
          "transition-all duration-300",
        )}
      >
        <Upload
          className={cn(
            "w-7 h-7 text-stone-400",
            "group-hover:text-sage-600 group-hover:scale-110",
            "transition-all duration-300",
          )}
        />
      </div>

      {/* Text */}
      <span
        className={cn(
          "text-sm font-semibold text-stone-500",
          "group-hover:text-sage-700",
          "transition-colors duration-300",
        )}
      >
        기존 책 가져오기
      </span>
      <span className="text-xs text-stone-400 mt-1">TXT, MD 파일 지원</span>

      {/* Decorative Corners */}
      <div className="absolute top-3 left-3 w-3 h-3 border-l-2 border-t-2 border-stone-300 group-hover:border-sage-400 transition-colors rounded-tl-lg" />
      <div className="absolute top-3 right-3 w-3 h-3 border-r-2 border-t-2 border-stone-300 group-hover:border-sage-400 transition-colors rounded-tr-lg" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-l-2 border-b-2 border-stone-300 group-hover:border-sage-400 transition-colors rounded-bl-lg" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-r-2 border-b-2 border-stone-300 group-hover:border-sage-400 transition-colors rounded-br-lg" />
    </button>
  );
}
