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
import { GROUP_COLORS, CURVE_FACTOR } from "./constants";
import { calculateRelationCounts } from "./utils";
import { NodeRenderer } from "./NodeRenderer";
import { LinkRenderer } from "./LinkRenderer";
import { TiledBackground } from "./TiledBackground";
import { RelationshipEventTooltip } from "./RelationshipEventTooltip";

interface CharacterGraphProps {
  characters: Character[];
  links: RelationshipLink[];
  onNodeClick?: (character: Character) => void;
  onLinkClick?: (link: RelationshipLink) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: RelationType | "all";
  highlightedNodeIds?: string[] | null;
  className?: string;
}

export interface CharacterGraphRef {
  focusNode: (nodeId: string) => Promise<void>;
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
      onLinkClick,
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
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

    // State for Link Hover Tooltip
    const [hoveredLinkData, setHoveredLinkData] = useState<{
      link: RelationshipLink;
      x: number;
      y: number;
    } | null>(null);

    // Tooltip close timer for smooth interaction
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { width, height } = useResize(containerRef);

    /**
     * [수정 포인트 1] 데이터 역직렬화 및 그룹 할당 로직 고도화
     * Neo4j의 extras 문자열을 파싱하여 faction 정보를 group 속성에 정합성 있게 매핑합니다.
     */
    const initialNodes: CharacterNode[] = useMemo(() => {
      // 1. 관계 수 계산 (중요도 지표) for Dynamic Sizing
      const relationCounts = calculateRelationCounts(initialLinks);

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
          relationCount: relationCounts[char.id] || 0, // 관계 수 할당
        };
      });
    }, [characters, initialLinks]);

    const { nodes, links, simulation } = useForceSimulation(
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

    // Cache for D3 selections to avoid DOM querying in every tick
    const groupSelectionCache = useRef<
      Map<
        string,
        {
          cloud: d3.Selection<d3.BaseType, unknown, null, undefined>;
          label: d3.Selection<d3.BaseType, unknown, null, undefined>;
        }
      >
    >(new Map());

    // Cleanup cache on unmount
    useEffect(() => {
      const cache = groupSelectionCache.current;
      return () => {
        cache.clear();
      };
    }, []);

    // Clear cache when group config changes
    useEffect(() => {
      groupSelectionCache.current.clear();
    }, [groupConfig]);

    useEffect(() => {
      if (!simulation || !gRef.current) return;

      const g = d3.select(gRef.current);

      // Tick Handler: Update DOM directly for 60fps performance w/o React re-renders
      let frameCount = 0;
      simulation.on("tick", () => {
        frameCount++;

        // 매 tick마다 새로운 선택자 사용 (Hitbox 포함)
        const linkSel = g.selectAll<SVGPathElement, RelationshipLink>(
          "path[class*='link-path']",
        );
        const nodeSel = g.selectAll<SVGGElement, CharacterNode>(".node-group");

        // 1. 필수 업데이트 - 링크 위치 (매 프레임)
        linkSel.each(function (d) {
          if (!d) return;
          const source = d.source as unknown as CharacterNode;
          const target = d.target as unknown as CharacterNode;

          const x1 = source.x;
          const y1 = source.y;
          const x2 = target.x;
          const y2 = target.y;

          // 좌표가 유효하지 않으면 업데이트 건너뜀 (깜빡임 방지)
          if (
            x1 === undefined ||
            y1 === undefined ||
            x2 === undefined ||
            y2 === undefined ||
            Number.isNaN(x1) ||
            Number.isNaN(y1) ||
            Number.isNaN(x2) ||
            Number.isNaN(y2)
          ) {
            return;
          }

          // 빠른 경로: 직선 또는 곡선 (Math.sqrt 최적화)
          const dx = x2 - x1;
          const dy = y2 - y1;
          const distSq = dx * dx + dy * dy;

          let pathD: string;
          if (distSq < 1) {
            pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
          } else {
            // sqrt는 비용이 높으므로 실제 필요할 때만 계산
            const distance = Math.sqrt(distSq);
            const midX = (x1 + x2) * 0.5;
            const midY = (y1 + y2) * 0.5;
            const invDist = 1 / distance;
            const curveOffset =
              distance * CURVE_FACTOR > 60 ? 60 : distance * CURVE_FACTOR;
            const controlX = midX - dy * invDist * curveOffset;
            const controlY = midY + dx * invDist * curveOffset;
            pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
          }

          this.setAttribute("d", pathD);
        });

        // 2. 필수 업데이트 - 노드 위치 (매 프레임)
        nodeSel.attr("transform", (d) =>
          d ? `translate(${d.x}, ${d.y})` : "",
        );

        // 2. 부가 연산 업데이트 (스로틀링 심화 - 12fps 정도)
        // 그룹 클라우드 위치 및 크기 업데이트 (노드 분포 범위 기반)
        if (enableGrouping && frameCount % 5 === 0) {
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

            // Use Cached Selection
            let cached = groupSelectionCache.current.get(safeId);
            if (!cached) {
              cached = {
                cloud: g.select(`#cloud-${safeId}`),
                label: g.select(`#label-${safeId}`),
              };
              groupSelectionCache.current.set(safeId, cached);
            }
            const { cloud: cloudEl, label: labelEl } = cached;

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

    // Optimize handlers to avoid re-binding D3 events on every render (fix zoom lag)
    const onDragStart = useCallback((node: CharacterNode) => {
      setIsDragging(true);
      setDraggedNodeId(node.id);
    }, []);
    const onDragEnd = useCallback(() => {
      setIsDragging(false);
      setDraggedNodeId(null);
    }, []);

    const { dragBehavior } = useDrag({
      simulation,
      onDragStart,
      onDragEnd,
    });

    useImperativeHandle(
      ref,
      () => ({
        focusNode: (nodeId: string) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (node && node.x !== undefined && node.y !== undefined) {
            return centerAt(node.x, node.y, 1.35);
          }
          return Promise.resolve();
        },
      }),
      [nodes, centerAt],
    );

    const connectedNodeIds = useMemo(() => {
      const focusId = hoveredNodeId || draggedNodeId || selectedNodeId;
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
    }, [
      hoveredNodeId,
      draggedNodeId,
      selectedNodeId,
      links,
      relationTypeFilter,
    ]);

    // Handle Link Hover with Delay
    const handleLinkHover = useCallback(
      (link: RelationshipLink | null, coords?: { x: number; y: number }) => {
        // Clear any pending close timer
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }

        if (link && coords) {
          // Open immediately
          setHoveredLinkData({ link, x: coords.x, y: coords.y });
        } else {
          // Link not active on this tick; delay closing to allow entering tooltip
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredLinkData(null);
          }, 150);
        }
      },
      [],
    );

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
      (id: string | null) => {
        if (isDragging) return;
        setHoveredNodeId(id);
      },
      [isDragging],
    );

    return (
      <div
        ref={containerRef}
        className={cn("w-full h-full relative", className)}
        style={{ contain: "layout paint" }}
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
          style={{
            // SVG 렌더링 최적화 (잔상 방지)
            shapeRendering: "auto",
            willChange: "transform",
          }}
        >
          {/* 줌/패닝용 그룹 */}
          <g ref={gRef}>
            {/* Always available shared defs */}
            <defs>
              <radialGradient
                id="node-gradient-common"
                cx="35%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="50%" stopColor="#F8F8F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#E7E5E4" stopOpacity="1" />
              </radialGradient>
            </defs>

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
              const focusId = hoveredNodeId || draggedNodeId || selectedNodeId;
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

              // Hide unconnected EDGES if a node is selected OR dragged (Strict 1:1 rule)
              if ((selectedNodeId || draggedNodeId) && !isConnected)
                return null;

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
                  onClick={onLinkClick}
                  onHover={handleLinkHover}
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

        {/* Relationship Event Tooltip on Hover */}
        {hoveredLinkData && (
          <RelationshipEventTooltip
            type={hoveredLinkData.link.type}
            strength={hoveredLinkData.link.strength}
            description={hoveredLinkData.link.description}
            events={hoveredLinkData.link.history || []}
            sourceName={
              typeof hoveredLinkData.link.source === "object"
                ? (hoveredLinkData.link.source as CharacterNode).name
                : String(hoveredLinkData.link.source)
            }
            targetName={
              typeof hoveredLinkData.link.target === "object"
                ? (hoveredLinkData.link.target as CharacterNode).name
                : String(hoveredLinkData.link.target)
            }
            x={hoveredLinkData.x}
            y={hoveredLinkData.y}
            onEventClick={() => {
              // Clicking an event opens the details panel for that link
              onLinkClick?.(hoveredLinkData.link);
              setHoveredLinkData(null); // Close tooltip
            }}
            onMouseEnter={() => {
              // Keep open when entering tooltip
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Close when leaving tooltip
              setHoveredLinkData(null);
            }}
          />
        )}

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
