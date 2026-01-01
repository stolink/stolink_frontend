import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyIndicatorProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyIndicator({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyIndicatorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        "bg-white/40 rounded-2xl border border-dashed border-stone-200",
        className,
      )}
    >
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-700 mb-2">{title}</h3>
      {description && (
        <p className="text-stone-500 max-w-md text-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
