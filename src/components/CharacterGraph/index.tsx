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
import { GROUP_COLORS } from "./constants";
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
  const [enableGrouping, setEnableGrouping] = useState(false);

  const { width, height } = useResize(containerRef);

  /**
   * [수정 포인트 1] 데이터 역직렬화 및 그룹 할당 로직 고도화
   * Neo4j의 extras 문자열을 파싱하여 faction 정보를 group 속성에 정합성 있게 매핑합니다.
   */
  const initialNodes: CharacterNode[] = useMemo(() => {
    return characters.map((char) => {
      let factionName = "무소속";

      // 1. 최상위 faction 속성이 있는 경우
      if (char.faction) {
        factionName = char.faction;
      }
      // 2. extras가 JSON 문자열인 경우 (Neo4j 데이터 케이스)
      else if (typeof char.extras === "string") {
        try {
          const parsed = JSON.parse(char.extras);
          factionName = parsed.faction || "무소속";
        } catch {
          factionName = "무소속";
        }
      }
      // 3. extras가 이미 객체인 경우
      else if (char.extras && typeof char.extras === "object") {
        factionName =
          ((char.extras as Record<string, unknown>).faction as string) ||
          "무소속";
      }

      return {
        id: char.id,
        name: char.name,
        role: char.role,
        group: factionName, // 추출된 파벌 정보를 시뮬레이션 그룹으로 사용
        imageUrl: char.imageUrl,
      };
    });
  }, [characters]);

  const { nodes, links, reheat, simulation } = useForceSimulation(
    initialNodes,
    initialLinks,
    { width, height, enableGrouping },
  );

  /**
   * 동적 그룹 클라우드 설정
   * - initialNodes 기반으로 그룹 목록 생성
   * - 빈 그룹 숨기기는 tick 핸들러에서 visibility로 제어
   */
  const groupConfig = useMemo(() => {
    // 1. 각 그룹별 멤버 수를 카운트합니다.
    const groupCounts = initialNodes.reduce(
      (acc, node) => {
        const g = node.group;
        if (g) acc[g] = (acc[g] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 2. 멤버가 1명 이상인 그룹만 추출합니다.
    const activeGroups = Object.keys(groupCounts).filter(
      (groupName) => groupCounts[groupName] > 0,
    );

    return activeGroups.map((group, index) => ({
      name: group,
      color: GROUP_COLORS[index % GROUP_COLORS.length],
      id: `group-gradient-${index}`,
    }));
  }, [initialNodes]);

  useEffect(() => {
    if (!simulation || !gRef.current) return;

    // Tick Handler: Update DOM directly for 60fps performance w/o React re-renders
    simulation.on("tick", () => {
      const g = d3.select(gRef.current);

      // Update Links (방어적 null 체크 포함)
      g.selectAll<SVGLineElement, RelationshipLink>(".link-line")
        .attr("x1", (d) => {
          if (!d) return 0;
          const source = d.source as unknown as CharacterNode;
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

      // 그룹 클라우드 위치 및 크기 업데이트 (노드 분포 범위 기반)
      if (enableGrouping) {
        // tick마다 최신 노드 위치 기반으로 그룹별 노드 재계산
        const currentNodesByGroup: Record<string, CharacterNode[]> = {};
        simulation.nodes().forEach((node) => {
          if (node.group) {
            if (!currentNodesByGroup[node.group])
              currentNodesByGroup[node.group] = [];
            currentNodesByGroup[node.group].push(node);
          }
        });

        // groupConfig의 모든 그룹에 대해 처리
        groupConfig.forEach((config) => {
          const groupName = config.name;
          const groupNodes = currentNodesByGroup[groupName] || [];
          const safeId = groupName.replace(/\s+/g, "-");
          const cloudEl = g.select(`#cloud-${safeId}`);
          const labelEl = g.select(`#label-${safeId}`);

          // 노드가 없으면 숨김 처리
          if (groupNodes.length === 0) {
            cloudEl.attr("visibility", "hidden");
            labelEl.attr("visibility", "hidden");
            return;
          }

          // 노드가 있으면 표시
          cloudEl.attr("visibility", "visible");
          labelEl.attr("visibility", "visible");

          // 1. Centroid 계산
          let sumX = 0,
            sumY = 0;
          groupNodes.forEach((n) => {
            sumX += n.x || 0;
            sumY += n.y || 0;
          });
          const cx = sumX / groupNodes.length;
          const cy = sumY / groupNodes.length;

          // 2. 각 노드의 centroid로부터 최대 거리 계산
          let maxDistance = 0;
          groupNodes.forEach((n) => {
            const dx = (n.x || 0) - cx;
            const dy = (n.y || 0) - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDistance) maxDistance = dist;
          });

          // 3. 동적 반경: r = k * sqrt(n) 수식 적용
          // - k: 스케일링 상수 (파벌 구름의 기본 크기 결정)
          // - n: 해당 파벌의 멤버 수
          // - 노드 분포 거리(maxDistance)도 함께 고려하여 노드가 구름 밖으로 나가지 않도록 보장
          const k = 80; // 스케일링 상수: 시각적 균형을 위한 조정값
          const nodeCount = groupNodes.length;
          const baseRadius = k * Math.sqrt(nodeCount); // 멤버 수 기반 반경
          const spreadRadius = maxDistance + 80; // 노드 분포 + 패딩
          const dynamicRadius = Math.max(120, baseRadius, spreadRadius);

          cloudEl.attr("cx", cx).attr("cy", cy).attr("r", dynamicRadius);
          labelEl.attr("x", cx).attr("y", cy + dynamicRadius * 0.4);
        });
      }
    });

    return () => {
      simulation.on("tick", null); // Cleanup
    };
  }, [simulation, enableGrouping, groupConfig]);

  useZoom(svgRef, gRef);
  const { dragBehavior } = useDrag({ reheat });

  const connectedNodeIds = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) return null;
    const connected = new Set<string>([focusId]);
    links.forEach((link) => {
      const sId =
        typeof link.source === "string" ? link.source : link.source.id;
      const tId =
        typeof link.target === "string" ? link.target : link.target.id;
      if (relationTypeFilter !== "all" && link.type !== relationTypeFilter)
        return;
      if (sId === focusId) connected.add(tId);
      if (tId === focusId) connected.add(sId);
    });
    return connected;
  }, [hoveredNodeId, selectedNodeId, links, relationTypeFilter]);

  const handleNodeClick = useCallback(
    (node: CharacterNode) => {
      const char = characters.find((c) => c.id === node.id);
      if (char && onNodeClick) onNodeClick(char);
    },
    [characters, onNodeClick],
  );

  const handleNodeHover = useCallback(
    (id: string | null) => setHoveredNodeId(id),
    [],
  );

  return (
    <div ref={containerRef} className={cn("w-full h-full relative", className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: "#F8F8F7",
          backgroundImage:
            "linear-gradient(to right, rgba(215, 211, 209, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(215, 211, 209, 0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <g ref={gRef}>
          {enableGrouping && (
            <g className="group-layer">
              <defs>
                {groupConfig.map((config) => (
                  <radialGradient key={config.id} id={config.id}>
                    <stop
                      offset="0%"
                      stopColor={config.color}
                      stopOpacity="0.8"
                    />
                    <stop
                      offset="70%"
                      stopColor={config.color}
                      stopOpacity="0.4"
                    />
                    <stop
                      offset="100%"
                      stopColor={config.color}
                      stopOpacity="0"
                    />
                  </radialGradient>
                ))}
              </defs>
              {groupConfig.map((config) => (
                <circle
                  key={config.name}
                  id={`cloud-${config.name.replace(/\s+/g, "-")}`}
                  r={300}
                  fill={`url(#${config.id})`}
                  visibility="hidden"
                  style={{ transition: "all 0.5s ease-out" }}
                  className="pointer-events-none"
                />
              ))}
              {groupConfig.map((config) => (
                <text
                  key={`label-${config.name}`}
                  id={`label-${config.name.replace(/\s+/g, "-")}`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(0,0,0,0.6)"
                  fontSize="64"
                  fontWeight="700"
                  visibility="hidden"
                  className="pointer-events-none select-none tracking-tighter"
                  style={{
                    fontFamily: "'Nanum Myeongjo', serif",
                    stroke: "#FFFFFF",
                    strokeWidth: "8px",
                    strokeLinejoin: "round",
                    paintOrder: "stroke fill",
                  }}
                >
                  {config.name}
                </text>
              ))}
            </g>
          )}

          {links.map((link) => {
            const focusId = hoveredNodeId || selectedNodeId;
            const sId =
              typeof link.source === "object"
                ? (link.source as CharacterNode).id
                : link.source;
            const tId =
              typeof link.target === "object"
                ? (link.target as CharacterNode).id
                : link.target;
            const isConnected = focusId
              ? sId === focusId || tId === focusId
              : false;
            if (selectedNodeId && !isConnected) return null;

            return (
              <LinkRenderer
                key={link.id}
                link={link}
                isHighlighted={isConnected}
                isDimmed={!!focusId && !isConnected}
                isFiltered={
                  relationTypeFilter !== "all" &&
                  link.type !== relationTypeFilter
                }
              />
            );
          })}

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

      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded shadow-sm border text-sm flex items-center gap-2">
        <input
          type="checkbox"
          id="grouping-toggle"
          checked={enableGrouping}
          onChange={(e) => setEnableGrouping(e.target.checked)}
          className="cursor-pointer"
        />
        <label
          htmlFor="grouping-toggle"
          className="cursor-pointer font-medium select-none"
        >
          그룹 보기
        </label>
      </div>
    </div>
  );
}
