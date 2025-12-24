import { useState } from "react";
import { LayoutGrid, GripVertical, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scene, SceneStatus } from "@/types";

interface CorkboardViewProps {
  scenes: Scene[];
  selectedSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onReorderScenes?: (sceneIds: string[]) => void;
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
  className,
}: CorkboardViewProps) {
  const [columns, setColumns] = useState(3);

  if (scenes.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          className,
        )}
      >
        <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-stone-700 mb-2">
          씬이 없습니다
        </h3>
        <p className="text-sm text-muted-foreground">
          챕터를 선택하고 새 씬을 추가해주세요.
        </p>
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
          gap: "16px",
        }}
      >
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isSelected={scene.id === selectedSceneId}
            onClick={() => onSelectScene?.(scene.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onClick: () => void;
}

function SceneCard({ scene, isSelected, onClick }: SceneCardProps) {
  const statusColor = STATUS_COLORS[scene.metadata?.status || "draft"];
  const labelColor = scene.metadata?.label
    ? LABEL_COLORS[scene.metadata.label] || "bg-stone-400"
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white rounded-lg shadow-sm border-2 border-l-4 cursor-pointer transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        statusColor,
        isSelected
          ? "ring-2 ring-sage-500 border-sage-300"
          : "border-stone-200",
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
