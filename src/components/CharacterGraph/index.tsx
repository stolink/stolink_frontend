import {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import { TiledBackground } from "./TiledBackground";

interface CharacterGraphProps {
  characters: Character[];
  links: RelationshipLink[];
  onNodeClick?: (character: Character) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: RelationType | "all";
  highlightedNodeIds?: string[] | null;
  className?: string;
}

export interface CharacterGraphRef {
  focusNode: (nodeId: string) => void;
}

export const CharacterGraph = forwardRef<
  CharacterGraphRef,
  CharacterGraphProps
>(
  (
    {
      characters,
      links: initialLinks,
      onNodeClick,
      selectedNodeId,
      relationTypeFilter = "all",
      highlightedNodeIds,
      className,
    },
    ref,
  ) => {
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
      let frameCount = 0;
      simulation.on("tick", () => {
        frameCount++;
        const g = d3.select(gRef.current);

        // 1. 필수 업데이트 (매 프레임 실행 - 60fps)
        // Update Links (방어적 null 체크 포함)
        g.selectAll<SVGLineElement, RelationshipLink>(".link-line")
          .attr("x1", (d) => {
            if (!d) return 0;
            const source = d.source as unknown as CharacterNode;
            return source.x ?? 0;
          })
          .attr("y1", (d) => {
            if (!d) return 0;
            const source = d.source as unknown as CharacterNode;
            return source.y ?? 0;
          })
          .attr("x2", (d) => {
            if (!d) return 0;
            const target = d.target as unknown as CharacterNode;
            return target.x ?? 0;
          })
          .attr("y2", (d) => {
            if (!d) return 0;
            const target = d.target as unknown as CharacterNode;
            return target.y ?? 0;
          });

        // Update Nodes
        g.selectAll<SVGGElement, CharacterNode>(".node-group").attr(
          "transform",
          (d) => (d ? `translate(${d.x}, ${d.y})` : ""),
        );

        // 2. 부가 연산 업데이트 (스로틀링 적용 - 30fps)
        // 그룹 클라우드 위치 및 크기 업데이트 (노드 분포 범위 기반)
        if (enableGrouping && frameCount % 2 === 0) {
          // tick마다 최신 노드 위치 기반으로 그룹별 노드 재계산
          const currentNodesByGroup: Record<string, CharacterNode[]> = {};
          simulation.nodes().forEach((node) => {
            if (node.group) {
              if (!currentNodesByGroup[node.group])
                currentNodesByGroup[node.group] = [];
              currentNodesByGroup[node.group].push(node);
            }
          });

          // 라벨 위치 정보 저장 (충돌 감지용)
          const labelPositions: Array<{
            x: number;
            y: number;
            width: number;
            height: number;
            name: string;
          }> = [];

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

            // Centroid 계산
            let sumX = 0,
              sumY = 0;
            groupNodes.forEach((n) => {
              sumX += n.x || 0;
              sumY += n.y || 0;
            });
            const cx = sumX / groupNodes.length;
            const cy = sumY / groupNodes.length;

            // 각 노드의 centroid로부터 최대 거리 계산
            let maxDistance = 0;
            groupNodes.forEach((n) => {
              const dx = (n.x || 0) - cx;
              const dy = (n.y || 0) - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > maxDistance) maxDistance = dist;
            });

            // 동적 반경 계산
            const k = 80;
            const nodeCount = groupNodes.length;
            const baseRadius = k * Math.sqrt(nodeCount);
            const spreadRadius = maxDistance + 80;
            const dynamicRadius = Math.max(120, baseRadius, spreadRadius);

            // 그룹 크기에 따라 폰트 크기 동적 조정 (최소 32, 최대 64)
            const fontSize = Math.max(32, Math.min(64, dynamicRadius / 4));

            // 초기 라벨 위치 (클라우드 상단)
            let labelX = cx;
            let labelY = cy - dynamicRadius * 0.6;

            // 라벨 크기 추정 (폰트 크기 기반)
            const estimatedWidth = groupName.length * fontSize * 0.7;
            const estimatedHeight = fontSize * 1.2;

            // 충돌 감지 및 위치 조정
            let hasCollision = true;
            let attempts = 0;
            const maxAttempts = 8;
            const angleStep = (Math.PI * 2) / maxAttempts;

            while (hasCollision && attempts < maxAttempts) {
              hasCollision = labelPositions.some((pos) => {
                const dx = Math.abs(labelX - pos.x);
                const dy = Math.abs(labelY - pos.y);
                return (
                  dx < (estimatedWidth + pos.width) / 2 + 20 &&
                  dy < (estimatedHeight + pos.height) / 2 + 20
                );
              });

              if (hasCollision) {
                // 원형으로 위치 회전
                const angle = angleStep * attempts;
                const offset = dynamicRadius * 0.6;
                labelX = cx + Math.cos(angle) * offset;
                labelY = cy + Math.sin(angle) * offset;
                attempts++;
              }
            }

            // 라벨 위치 저장
            labelPositions.push({
              x: labelX,
              y: labelY,
              width: estimatedWidth,
              height: estimatedHeight,
              name: groupName,
            });

            cloudEl.attr("cx", cx).attr("cy", cy).attr("r", dynamicRadius);
            labelEl
              .attr("x", labelX)
              .attr("y", labelY)
              .attr("font-size", fontSize);
          });
        }
      });

      return () => {
        simulation.on("tick", null); // Cleanup
      };
    }, [simulation, enableGrouping, groupConfig]);

    const { zoomState, centerAt } = useZoom(svgRef, gRef);
    const { dragBehavior } = useDrag({ reheat });

    useImperativeHandle(
      ref,
      () => ({
        focusNode: (nodeId: string) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (node && node.x !== undefined && node.y !== undefined) {
            centerAt(node.x, node.y, 1.35);
          }
        },
      }),
      [nodes, centerAt],
    );

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

    // Search Highlighting Logic
    // null/undefined = 검색 비활성 (일반 모드)
    // [] = 검색 활성이나 결과 없음 (모두 딤 처리)
    const isSearchActive =
      highlightedNodeIds !== null && highlightedNodeIds !== undefined;

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
      <div
        ref={containerRef}
        className={cn("w-full h-full relative", className)}
      >
        <TiledBackground
          zoomState={zoomState}
          className="absolute inset-0 z-0 pointer-events-none"
        />
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="cursor-grab active:cursor-grabbing relative z-10"
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
                    fill="rgba(0,0,0,0.7)"
                    fontSize="48"
                    fontWeight="700"
                    visibility="hidden"
                    className="pointer-events-none select-none tracking-tight"
                    style={{
                      fontFamily: "'Nanum Myeongjo', serif",
                      stroke: "#FFFFFF",
                      strokeWidth: "10px",
                      strokeLinejoin: "round",
                      strokeLinecap: "round",
                      paintOrder: "stroke fill",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
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
                    (relationTypeFilter !== "all" &&
                      link.type !== relationTypeFilter) ||
                    (isSearchActive &&
                      (!highlightedNodeIds?.includes(sId) ||
                        !highlightedNodeIds?.includes(tId)))
                  }
                />
              );
            })}

            {nodes.map((node) => {
              // Determine visual state based on Search vs Selection
              let isDimmed = false;
              let isHighlighted = false;

              if (isSearchActive) {
                // Search Mode: Highlight matches, dim others
                isDimmed = !highlightedNodeIds?.includes(node.id);
                isHighlighted = highlightedNodeIds?.includes(node.id) ?? false;
              } else {
                // Selection/Hover Mode
                isDimmed =
                  connectedNodeIds !== null && !connectedNodeIds.has(node.id);
                isHighlighted = connectedNodeIds?.has(node.id) ?? false;
              }

              return (
                <NodeRenderer
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  onClick={handleNodeClick}
                  onHover={handleNodeHover}
                  dragBehavior={dragBehavior}
                />
              );
            })}
          </g>
        </svg>

        <div className="absolute top-4 right-4 bg-white/90 p-2 rounded shadow-sm border text-sm flex items-center gap-2 z-20">
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
  },
);
