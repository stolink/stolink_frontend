// Section Strip - Bottom navigation bar for sections within a chapter
// Scrivener-inspired section navigation with visual structure indicators
import {
  Plus,
  FileText,
  GripVertical,
  BookOpen,
  PenLine,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";
import { useRef, useState, useMemo } from "react";
import { useChildDocuments, useDocumentTree } from "@/hooks/useDocuments";
import { DEMO_CHAPTERS, DEMO_CHAPTER_CONTENTS } from "@/data/demoData";

interface SectionStripProps {
  selectedFolderId: string | null;
  selectedSectionId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  projectId: string;
  isDemo?: boolean;
  liveWordCount?: number; // Real-time word count for selected section
}

export default function SectionStrip({
  selectedFolderId,
  selectedSectionId,
  onSelect,
  onAdd,
  onDelete,
  projectId,
  isDemo = false,
  liveWordCount,
}: SectionStripProps) {
  // 1. Fetch data based on mode
  const { documents } = useDocumentTree(projectId);
  // Fetch sections (child documents) for the selected folder
  const { children: sectionDocuments, isLoading } = useChildDocuments(
    selectedFolderId ?? undefined, // Handle null by passing undefined
    projectId
  );

  // 2. Compute Sections List
  const sections = useMemo(() => {
    if (isDemo) {
      return DEMO_CHAPTERS.filter(
        (ch) => ch.parentId === selectedFolderId && ch.type === "section"
      ).map((ch) => ({
        id: ch.id,
        projectId: "demo-project",
        type: "text" as const,
        title: ch.title,
        content: DEMO_CHAPTER_CONTENTS[ch.id] || "",
        synopsis: "",
        order: ch.order,
        metadata: {
          status: "draft" as const,
          wordCount: ch.characterCount || 0,
          includeInCompile: true,
          keywords: [],
          notes: "",
        },
        characterIds: [],
        foreshadowingIds: [],
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      })) as Document[];
    }
    return sectionDocuments.filter((doc) => doc.type === "text");
  }, [isDemo, selectedFolderId, sectionDocuments]);

  // 3. Compute Parent Folder Title
  const parentTitle = useMemo(() => {
    if (isDemo) {
      return (
        DEMO_CHAPTERS.find((c) => c.id === selectedFolderId)?.title || "챕터"
      );
    }
    const doc = documents.find((d) => d.id === selectedFolderId);
    return doc?.title || "폴더 선택";
  }, [isDemo, selectedFolderId, documents]);

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
    <div className="border-t bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col shrink-0">
      {/* Header Bar */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-stone-200/50">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-sage-600" />
          <span className="text-sm font-semibold text-stone-700">
            {parentTitle || "챕터"}
          </span>
          <span className="text-xs text-stone-400">
            {sections.length}개 섹션
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          {selectedSectionId && (
            <span className="text-sage-600 font-medium">
              {(liveWordCount ?? 0).toLocaleString()}자
            </span>
          )}
        </div>
      </div>

      {/* Sections Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 px-4 py-3 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300"
      >
        {!selectedFolderId ? (
          <div className="w-full h-24 flex items-center justify-center text-stone-400 text-sm">
            폴더를 선택해주세요
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-stone-300" />
            </div>
            <p className="text-sm text-stone-500 font-medium">
              섹션이 비어있습니다
            </p>
            <p className="text-xs text-stone-400 mb-3">
              새 섹션을 추가하여 챕터를 구성하세요
            </p>
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sage-600 hover:bg-sage-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />첫 섹션 만들기
            </button>
          </div>
        ) : (
          <>
            {sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index + 1}
                isSelected={section.id === selectedSectionId}
                isDragging={section.id === draggedId}
                onClick={() => onSelect(section.id)}
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragEnd={handleDragEnd}
                onDelete={() => onDelete && onDelete(section.id)}
                liveWordCount={
                  section.id === selectedSectionId ? liveWordCount : undefined
                }
              />
            ))}

            {/* Add Button Card */}
            <button
              onClick={onAdd}
              className="flex flex-col items-center justify-center min-w-[100px] px-4 py-3 border-2 border-dashed border-stone-300 rounded-xl hover:border-sage-400 hover:bg-sage-50/50 transition-all group"
            >
              <Plus className="w-5 h-5 text-stone-400 group-hover:text-sage-600 mb-1" />
              <span className="text-xs text-stone-400 group-hover:text-sage-600 font-medium">
                새 섹션
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface SectionCardProps {
  section: Document;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDelete: () => void;
  liveWordCount?: number; // Real-time count for selected section
}

function SectionCard({
  section,
  index,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDelete,
  liveWordCount,
}: SectionCardProps) {
  const statusConfig = {
    draft: {
      color: "bg-stone-400",
      label: "초안",
      icon: PenLine,
      ring: "ring-stone-200",
    },
    revised: {
      color: "bg-amber-400",
      label: "수정중",
      icon: PenLine,
      ring: "ring-amber-200",
    },
    final: {
      color: "bg-green-500",
      label: "완료",
      icon: CheckCircle2,
      ring: "ring-green-200",
    },
  };

  const status = section.metadata?.status || "draft";
  const config = statusConfig[status];
  // Use liveWordCount for selected section, otherwise use saved metadata
  const wordCount = liveWordCount ?? section.metadata?.wordCount ?? 0;
  const synopsis = section.synopsis || "";

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        // Simple confirmation via browser native menu not possible, so we use the prop
        //Ideally we should have a custom context menu here too, but for now we can just trigger the parent deletion flow which has confirmation
        // But we need a UI hint. Let's add a small delete button that appears on hover, or just context menu.
        // Let's rely on a delete button on hover for clarity as context menus can be hidden.
      }}
      className={cn(
        "group relative flex flex-col min-w-[160px] max-w-[200px] p-3 rounded-xl border-2 transition-all text-left",
        "hover:shadow-md hover:-translate-y-1",
        isSelected
          ? "bg-white border-sage-400 shadow-md ring-2 ring-sage-100"
          : "bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Header: Index + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
              isSelected
                ? "bg-sage-600 text-white"
                : "bg-stone-100 text-stone-600"
            )}
          >
            {index}
          </span>
          <div
            className={cn("w-2 h-2 rounded-full", config.color)}
            title={config.label}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete();
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-full transition-opacity text-stone-400 hover:text-red-500"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <GripVertical
            className={cn(
              "w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab",
              isDragging && "cursor-grabbing"
            )}
          />
        </div>
      </div>

      {/* Title */}
      <h4
        className={cn(
          "text-sm font-semibold truncate mb-1",
          isSelected ? "text-sage-800" : "text-stone-700"
        )}
      >
        {section.title}
      </h4>

      {/* Synopsis Preview */}
      <p className="text-xs text-stone-400 line-clamp-2 min-h-[32px] mb-2">
        {synopsis || "시놉시스 없음"}
      </p>

      {/* Footer: Word Count + Status Label */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[11px] text-stone-500 font-medium">
          {wordCount.toLocaleString()}자
        </span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            status === "final"
              ? "bg-green-100 text-green-700"
              : status === "revised"
                ? "bg-amber-100 text-amber-700"
                : "bg-stone-100 text-stone-500"
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
