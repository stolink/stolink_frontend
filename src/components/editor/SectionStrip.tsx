// Section Strip - Bottom navigation bar for sections within a chapter
import { Plus, FileText, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";
import { useRef, useState } from "react";

interface SectionStripProps {
  sections: Document[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  parentTitle?: string;
}

export default function SectionStrip({
  sections,
  selectedId,
  onSelect,
  onAdd,
  parentTitle,
}: SectionStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="h-16 border-t bg-stone-50 flex items-center shrink-0">
      {/* Parent Title */}
      <div className="px-4 border-r h-full flex items-center min-w-[140px]">
        <span className="text-xs font-medium text-stone-500 truncate">
          {parentTitle || "섹션 없음"}
        </span>
      </div>

      {/* Sections Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-2 px-3 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300"
      >
        {sections.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-stone-400 italic">
            <FileText className="w-4 h-4" />
            <span>섹션이 없습니다. 새 섹션을 추가하세요.</span>
          </div>
        ) : (
          sections.map((section, index) => (
            <SectionTab
              key={section.id}
              section={section}
              index={index + 1}
              isSelected={section.id === selectedId}
              isDragging={section.id === draggedId}
              onClick={() => onSelect(section.id)}
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>

      {/* Add Button */}
      <div className="px-3 border-l h-full flex items-center">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-sage-700 hover:bg-sage-50 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 섹션</span>
        </button>
      </div>
    </div>
  );
}

interface SectionTabProps {
  section: Document;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function SectionTab({
  section,
  index,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: SectionTabProps) {
  const statusColors = {
    draft: "bg-stone-400",
    revised: "bg-amber-400",
    final: "bg-green-500",
  };

  const statusColor = statusColors[section.metadata?.status || "draft"];

  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap",
        "hover:shadow-sm hover:-translate-y-0.5",
        isSelected
          ? "bg-white border-sage-300 shadow-sm ring-1 ring-sage-200"
          : "bg-white/60 border-stone-200 hover:bg-white hover:border-stone-300",
        isDragging && "opacity-50",
      )}
    >
      {/* Status Indicator */}
      <div
        className={cn("w-2 h-2 rounded-full shrink-0", statusColor)}
        title={section.metadata?.status || "draft"}
      />

      {/* Index */}
      <span className="text-[10px] text-stone-400 font-mono">{index}.</span>

      {/* Title */}
      <span
        className={cn(
          "text-xs font-medium max-w-[120px] truncate",
          isSelected ? "text-sage-800" : "text-stone-700",
        )}
      >
        {section.title}
      </span>

      {/* Word Count */}
      <span className="text-[10px] text-stone-400">
        {section.metadata?.wordCount?.toLocaleString() || 0}자
      </span>

      {/* Drag Handle (on hover) */}
      <GripVertical
        className={cn(
          "w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab",
          isDragging && "cursor-grabbing",
        )}
      />
    </button>
  );
}
