import { useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// Menu item types
export interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}

export interface MenuDivider {
  type: "divider";
}

export type MenuItemType = MenuItem | MenuDivider;

// Context menu component
export function ContextMenu({
  items,
  position,
  onClose,
}: {
  items: MenuItemType[];
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = useMemo(() => {
    const menuWidth = 180;
    const menuHeight = items.length * 32 + 8;
    return {
      x: Math.min(position.x, window.innerWidth - menuWidth - 10),
      y: Math.min(position.y, window.innerHeight - menuHeight - 10),
    };
  }, [position, items.length]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {items.map((item, idx) =>
        "type" in item ? (
          <div key={idx} className="h-px bg-stone-100 my-1.5 mx-2" />
        ) : (
          <button
            key={idx}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left",
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-stone-700 hover:bg-stone-100",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-stone-400">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}
