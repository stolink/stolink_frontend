/**
 * SortableDocumentItem - 드래그 앤 드롭 가능한 섹션 아이템
 * dnd-kit을 사용하여 섹션 순서 변경 지원
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export interface DocumentItem {
  id: string;
  title: string;
  isPublished: boolean;
  wordCount: number;
  order: number;
  content?: string;
}

interface SortableDocumentItemProps {
  item: DocumentItem;
  index: number;
  onRemove?: (id: string) => void;
  showDragHandle?: boolean;
}

export function SortableDocumentItem({
  item,
  index,
  onRemove,
  showDragHandle = true,
}: SortableDocumentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white rounded-xl border border-cloud-200",
        "hover:shadow-paper-hover transition-shadow duration-200",
        isDragging && "shadow-paper-floating opacity-80 z-10",
      )}
    >
      {/* 드래그 핸들 */}
      {showDragHandle && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-espresso-400 hover:text-espresso-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* 순서 번호 */}
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-mocha-100 text-mocha-700 text-xs font-bold">
        {index + 1}
      </span>

      {/* 제목 및 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-espresso-900 truncate">
            {item.title || "제목 없음"}
          </span>
          <StatusBadge isPublished={item.isPublished} />
        </div>
        <span className="text-xs text-espresso-400">
          {item.wordCount.toLocaleString()}자
        </span>
      </div>

      {/* 제거 버튼 */}
      {onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 text-espresso-400 hover:text-status-error transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default SortableDocumentItem;
