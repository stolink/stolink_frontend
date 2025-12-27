import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";
import type {
  Character,
  CharacterNode,
  RelationshipLink,
  RelationType,
} from "@/types";
import { useForceSimulation } from "@/hooks/useCharacterGraphSimulation";
import { useZoom } from "@/hooks/useCharacterGraphZoom";
import { useDrag } from "@/hooks/useCharacterGraphDrag";
import { useResize } from "@/hooks/useCharacterGraphResize";
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
  const { nodes, links, reheat, simulation } = useForceSimulation(
    initialNodes,
    initialLinks,
    { width, height },
  );

  // Imperative Animation Loop (D3 Tick)
  useEffect(() => {
    if (!simulation || !gRef.current) return;

    // Tick Handler: Update DOM directly for 60fps performance w/o React re-renders
    simulation.on("tick", () => {
      const g = d3.select(gRef.current);

      // Update Links
      g.selectAll<SVGLineElement, RelationshipLink>(".link-line")
        .attr("x1", (d) => {
          if (!d) return 0;
          const source = d.source as unknown as CharacterNode;
          // D3 mutates d.source to object, valid check:
          if (source && typeof source === "object" && "x" in source)
            return source.x ?? 0;
          return 0;
        })
        .attr("y1", (d) => {
          if (!d) return 0;
          const source = d.source as unknown as CharacterNode;
          if (source && typeof source === "object" && "y" in source)
            return source.y ?? 0;
          return 0;
        })
        .attr("x2", (d) => {
          if (!d) return 0;
          const target = d.target as unknown as CharacterNode;
          if (target && typeof target === "object" && "x" in target)
            return target.x ?? 0;
          return 0;
        })
        .attr("y2", (d) => {
          if (!d) return 0;
          const target = d.target as unknown as CharacterNode;
          if (target && typeof target === "object" && "y" in target)
            return target.y ?? 0;
          return 0;
        });

      // Update Nodes (Groups)
      g.selectAll<SVGGElement, CharacterNode>(".node-group").attr(
        "transform",
        (d) => (d ? `translate(${d.x}, ${d.y})` : ""),
      );
    });

    return () => {
      simulation.on("tick", null); // Cleanup
    };
  }, [simulation]);

  // Zoom
  const { zoomState } = useZoom(svgRef, gRef);

  // Drag
  const { dragBehavior } = useDrag({ reheat });

  // (Removed faulty useEffect that re-attached drag on every render)

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
          {/* 링크 먼저 렌더링 */}
          {links.map((link) => {
            const focusId = hoveredNodeId || selectedNodeId;

            // Defensive ID extraction
            const getId = (
              nodeOrId: string | CharacterNode | unknown,
            ): string => {
              if (
                typeof nodeOrId === "object" &&
                nodeOrId !== null &&
                "id" in nodeOrId
              ) {
                return String((nodeOrId as { id: unknown }).id);
              }
              return String(nodeOrId);
            };

            const focusIdStr = focusId ? String(focusId) : null;
            const sourceIdStr = getId(link.source);
            const targetIdStr = getId(link.target);

            // Strict Star Topology Check
            const isDirectlyConnected = focusIdStr
              ? sourceIdStr === focusIdStr || targetIdStr === focusIdStr
              : false;

            // If a node is SELECTED (not just hovered), we strictly HIDE unconnected links
            if (selectedNodeId && !isDirectlyConnected) {
              return null;
            }

            const isHighlighted = focusIdStr ? isDirectlyConnected : false;
            const isDimmed = focusIdStr ? !isHighlighted : false;

            return (
              <LinkRenderer
                key={link.id}
                link={link}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                isFiltered={
                  relationTypeFilter !== "all" &&
                  link.type !== relationTypeFilter
                }
              />
            );
          })}

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
              dragBehavior={dragBehavior}
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
