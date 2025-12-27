import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import type { CharacterNode, RelationshipLink, RelationType } from "./types";
import { useForceSimulation } from "./useForceSimulation";
import { useZoom } from "./useZoom";
import { useDrag } from "./useDrag";
import { useResize } from "./useResize";
import { NodeRenderer } from "./NodeRenderer";
import { LinkRenderer } from "./LinkRenderer";

interface CharacterGraphProps {
  characters: Character[];
  links: RelationshipLink[];
  onNodeClick?: (character: Character) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: RelationType | "all";
  className?: string;
}

/**
 * D3.js Force Simulation 기반 캐릭터 관계도
 */
export function CharacterGraph({
  characters,
  links: initialLinks,
  onNodeClick,
  selectedNodeId,
  relationTypeFilter = "all",
  className,
}: CharacterGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 컨테이너 크기 감지
  const { width, height } = useResize(containerRef);

  // Character → CharacterNode 변환
  const initialNodes: CharacterNode[] = useMemo(
    () =>
      characters.map((char) => ({
        id: char.id,
        name: char.name,
        role: char.role,
        imageUrl: char.imageUrl,
      })),
    [characters],
  );

  // Force Simulation
  const { nodes, links, reheat } = useForceSimulation(
    initialNodes,
    initialLinks,
    { width, height },
  );

  // Zoom
  const { zoomState } = useZoom(svgRef, gRef);

  // Drag
  const { createDragBehavior } = useDrag({ reheat });

  // 노드에 드래그 동작 연결
  useEffect(() => {
    const g = gRef.current;
    if (!g || nodes.length === 0) return;

    const dragBehavior = createDragBehavior();

    d3.select(g)
      .selectAll<SVGGElement, CharacterNode>(".node-group")
      .data(nodes, (d) => d?.id ?? "")
      .call(dragBehavior);
  }, [nodes, createDragBehavior]);

  // 연결된 노드 ID 계산
  const connectedNodeIds = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) return null;

    const connected = new Set<string>([focusId]);
    links.forEach((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      // 필터 적용
      if (relationTypeFilter !== "all" && link.type !== relationTypeFilter)
        return;

      if (sourceId === focusId) connected.add(targetId);
      if (targetId === focusId) connected.add(sourceId);
    });
    return connected;
  }, [hoveredNodeId, selectedNodeId, links, relationTypeFilter]);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(
    (node: CharacterNode) => {
      const character = characters.find((c) => c.id === node.id);
      if (character && onNodeClick) {
        onNodeClick(character);
      }
    },
    [characters, onNodeClick],
  );

  // 노드 호버 핸들러
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  return (
    <div ref={containerRef} className={cn("w-full h-full relative", className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <g ref={gRef}>
          {/* 링크 먼저 렌더링 */}
          {links.map((link) => (
            <LinkRenderer
              key={link.id}
              link={link}
              isHighlighted={
                connectedNodeIds !== null &&
                (typeof link.source === "string"
                  ? connectedNodeIds.has(link.source)
                  : connectedNodeIds.has(link.source.id)) &&
                (typeof link.target === "string"
                  ? connectedNodeIds.has(link.target)
                  : connectedNodeIds.has(link.target.id))
              }
              isDimmed={
                connectedNodeIds !== null &&
                !(
                  (typeof link.source === "string"
                    ? connectedNodeIds.has(link.source)
                    : connectedNodeIds.has(link.source.id)) &&
                  (typeof link.target === "string"
                    ? connectedNodeIds.has(link.target)
                    : connectedNodeIds.has(link.target.id))
                )
              }
              isFiltered={
                relationTypeFilter !== "all" && link.type !== relationTypeFilter
              }
            />
          ))}

          {/* 노드 렌더링 */}
          {nodes.map((node) => (
            <NodeRenderer
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isHighlighted={connectedNodeIds?.has(node.id) ?? false}
              isDimmed={
                connectedNodeIds !== null && !connectedNodeIds.has(node.id)
              }
              onClick={handleNodeClick}
              onHover={handleNodeHover}
            />
          ))}
        </g>
      </svg>

      {/* 줌 레벨 표시 (디버그용, 필요시 제거) */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded">
        {Math.round(zoomState.scale * 100)}%
      </div>
    </div>
  );
}

// Named exports for zoom controls
export {};
export type { CharacterGraphProps };
