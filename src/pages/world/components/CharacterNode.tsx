import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

// Custom Character Node - reference 디자인 반영
export function CharacterNode({ data, selected }: NodeProps) {
  const isProtagonist = data.role === "protagonist";
  const isDimmed = data.dimmed; // 필터링 시 블러 처리
  const isHighlighted = data.highlighted; // 필터링 시 하이라이트

  // 역할별 노드 크기
  const nodeSize = isProtagonist ? "w-24 h-24" : "w-16 h-16";
  const avatarPx = isProtagonist ? 96 : 64; // px 값

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center gap-2 transition-all duration-300",
        isDimmed && "opacity-20 blur-[1px] pointer-events-none",
        isHighlighted && "scale-110"
      )}
    >
      {/* 원형 아바타 */}
      <div
        className={cn(
          "relative rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer",
          nodeSize,
          isProtagonist
            ? "border-4 border-blue-500 shadow-xl hover:scale-105"
            : "border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:scale-105",
          selected && "ring-4 ring-blue-300",
          isHighlighted &&
            "ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
        )}
      >
        {/* Handles 위치를 아바타 중심에 맞춤 */}
        <Handle
          type="target"
          position={Position.Left}
          className="!opacity-0 !w-2 !h-2"
          style={{ left: -4, top: avatarPx / 2 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!opacity-0 !w-2 !h-2"
          style={{ right: -4, top: avatarPx / 2 }}
        />

        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              !isHighlighted &&
                "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100",
              isHighlighted && "grayscale-0 opacity-100"
            )}
          />
        ) : (
          <span
            className={cn(
              "transition-all",
              isProtagonist ? "text-3xl" : "text-2xl"
            )}
          >
            {data.role === "protagonist"
              ? "🦸"
              : data.role === "antagonist"
                ? "🦹"
                : data.role === "mentor"
                  ? "🧙"
                  : "👤"}
          </span>
        )}
      </div>

      {/* 이름 라벨 */}
      <div
        className={cn(
          "whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold shadow-md",
          isProtagonist
            ? "bg-slate-900 text-white tracking-wide"
            : "bg-white text-slate-800 border border-slate-200",
          isHighlighted && "bg-yellow-400 text-slate-900 border-yellow-500"
        )}
      >
        {data.name}
      </div>
    </div>
  );
}
