import { useState } from "react";
import { LayoutGrid, GripVertical, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scene, SceneStatus } from "@/types";

interface CorkboardViewProps {
  scenes: Scene[];
  selectedSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onReorderScenes?: (sceneIds: string[]) => void;
  onAddScene?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<SceneStatus, string> = {
  draft: "border-l-stone-400",
  revised: "border-l-amber-400",
  final: "border-l-green-400",
};

const LABEL_COLORS: Record<string, string> = {
  "POV: 주인공": "bg-blue-500",
  "POV: 히로인": "bg-pink-500",
  과거: "bg-gray-400",
  현재: "bg-green-500",
  미래: "bg-amber-500",
};

export default function CorkboardView({
  scenes,
  selectedSceneId,
  onSelectScene,
  onReorderScenes,
  onAddScene,
  className,
}: CorkboardViewProps) {
  const [columns, setColumns] = useState(3);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedSceneId(sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    if (!draggedSceneId || draggedSceneId === targetSceneId || !onReorderScenes)
      return;

    const currentIds = scenes.map((s) => s.id);
    const draggedIndex = currentIds.indexOf(draggedSceneId);
    const targetIndex = currentIds.indexOf(targetSceneId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Fix: adjust target index after splice
    const newIds = [...currentIds];
    const [draggedItem] = newIds.splice(draggedIndex, 1);
    const adjustedTargetIndex =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newIds.splice(adjustedTargetIndex, 0, draggedItem);

    onReorderScenes(newIds);
    setDraggedSceneId(null);
  };

  if (scenes.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center h-full",
          className,
        )}
      >
        <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-stone-700 mb-2">
          씬이 없습니다
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          새로운 씬을 추가하여 이야기를 시작해보세요.
        </p>
        {onAddScene && (
          <button
            onClick={onAddScene}
            className="flex items-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 transition-colors"
          >
            <Plus className="w-4 h-4" />새 씬 만들기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-stone-50">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Corkboard</span>
          <span className="text-xs text-muted-foreground">
            ({scenes.length}개 씬)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">열:</span>
          {[2, 3, 4, 5].map((col) => (
            <button
              key={col}
              onClick={() => setColumns(col)}
              className={cn(
                "w-6 h-6 text-xs rounded",
                columns === col
                  ? "bg-sage-600 text-white"
                  : "bg-white border hover:bg-stone-50",
              )}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div
        className="flex-1 p-4 overflow-y-auto bg-amber-50/50"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: "max-content",
          gap: "16px",
        }}
      >
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isSelected={scene.id === selectedSceneId}
            onClick={() => onSelectScene?.(scene.id)}
            draggable={!!onReorderScenes}
            onDragStart={(e) => handleDragStart(e, scene.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, scene.id)}
            isDragging={draggedSceneId === scene.id}
          />
        ))}

        {/* Add Button Card */}
        {onAddScene && (
          <button
            onClick={onAddScene}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 rounded-lg hover:border-sage-500 hover:bg-sage-50/50 transition-all group min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-sage-100 transition-colors mb-2">
              <Plus className="w-5 h-5 text-stone-400 group-hover:text-sage-600" />
            </div>
            <span className="text-sm font-medium text-stone-500 group-hover:text-sage-700">
              새 씬 추가
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

function SceneCard({
  scene,
  isSelected,
  onClick,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: SceneCardProps) {
  const statusColor = STATUS_COLORS[scene.metadata?.status || "draft"];
  const labelColor = scene.metadata?.label
    ? LABEL_COLORS[scene.metadata.label] || "bg-stone-400"
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`씬: ${scene.title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group relative bg-white rounded-lg shadow-sm border-2 border-l-4 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-sage-500",
        "hover:shadow-md hover:-translate-y-0.5",
        statusColor,
        isSelected
          ? "ring-2 ring-sage-500 border-sage-300"
          : "border-stone-200",
        isDragging && "opacity-50 border-dashed border-stone-400",
      )}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      </div>

      {/* Label Dot */}
      {labelColor && (
        <div
          className={cn(
            "absolute top-2 left-2 w-3 h-3 rounded-full",
            labelColor,
          )}
          title={scene.metadata?.label}
        />
      )}

      {/* Content */}
      <div className="p-4 pt-6">
        {/* Title */}
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <h4 className="font-medium text-sm line-clamp-2">{scene.title}</h4>
        </div>

        {/* Synopsis */}
        <p className="text-xs text-muted-foreground line-clamp-4 min-h-[60px]">
          {scene.metadata?.synopsis || "(시놉시스 없음)"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t text-[10px] text-muted-foreground">
          <span>{scene.metadata?.wordCount?.toLocaleString() || 0}자</span>
          {scene.characterIds && scene.characterIds.length > 0 && (
            <span>👥 {scene.characterIds.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}
