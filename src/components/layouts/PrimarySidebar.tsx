import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores";

interface PrimarySidebarProps {
  children: ReactNode;
  className?: string;
}

export function PrimarySidebar({ children, className }: PrimarySidebarProps) {
  const { leftSidebarOpen, toggleLeftSidebar } = useUIStore();

  if (!leftSidebarOpen) {
    return null;
  }

  return (
    <aside
      className={cn(
        "w-64 bg-stone-50/50 border-r border-stone-200 flex flex-col h-full shrink-0",
        className
      )}
      role="complementary"
      aria-label="보조 네비게이션"
    >
      {/* Close button (optional) */}
      <div className="flex items-center justify-end p-2 border-b border-stone-200">
        <button
          onClick={toggleLeftSidebar}
          className="p-1.5 hover:bg-stone-200 rounded transition-colors"
          aria-label="사이드바 닫기"
          title="사이드바 닫기 (Ctrl+B)"
        >
          <X className="h-4 w-4 text-stone-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </aside>
  );
}
