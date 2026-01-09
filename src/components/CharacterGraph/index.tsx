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
import { Delaunay } from "d3-delaunay";
import { cn } from "@/lib/utils";
import type { Character, CharacterNode, RelationshipLink } from "@/types";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { useForceSimulation } from "@/hooks/useCharacterGraphSimulation";
import { useZoom } from "@/hooks/useCharacterGraphZoom";
import { useDrag } from "@/hooks/useCharacterGraphDrag";
import { useResize } from "@/hooks/useCharacterGraphResize";
import { type UIRelationType, toUIRelationType } from "./constants";
import { calculateRelationCounts } from "./utils";
import { NodeRenderer } from "./NodeRenderer";
import { LinkRenderer } from "./LinkRenderer";
import { TiledBackground } from "./TiledBackground";
import { NetworkControls } from "./NetworkControls";
import { CharacterSearchOverlay } from "./CharacterSearchOverlay";
import { TimelineSlider } from "./TimelineSlider";
import { RelationshipDeepAnalysisModal } from "./RelationshipDeepAnalysis";
import { generateMockAnalysisData } from "./RelationshipDeepAnalysis/utils/analysisCalculations";
import { RelationshipEventTooltip } from "./RelationshipEventTooltip";

export { RelationshipDeepAnalysisModal } from "./RelationshipDeepAnalysis";
export { GROUP_COLORS } from "./constants";

interface CharacterGraphProps {
  characters: Character[];

  links: RelationshipLink[];
  onNodeClick?: (character: Character | null) => void;
  onLinkClick?: (link: RelationshipLink | null) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: UIRelationType | "all";
  onFilterChange?: (filter: UIRelationType | "all") => void;
  highlightedNodeIds?: string[] | null;
  /** 검색 결과 노드 ID 변경 콜백 */
  onSearchChange?: (matchingIds: string[] | null) => void;
  className?: string;
  /** 검색 오버레이 표시 여부 (기본 true) */
  showSearch?: boolean;
  /** 노드 드래그 종료 시 콜백 (위치 저장용) */
  onNodeDragEnd?: (node: CharacterNode) => void;
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
      onFilterChange,
      highlightedNodeIds,
      onSearchChange,
      className,
      showSearch = true,
      onNodeDragEnd,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);

    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [hoveredRelationType, setHoveredRelationType] =
      useState<UIRelationType | null>(null);
    const [internalFilter, setInternalFilter] = useState<
      UIRelationType | "all"
    >(relationTypeFilter);
    const [showMainOnly, setShowMainOnly] = useState(false);
    const [showTension, setShowTension] = useState(false);
    const [showLogicCheck, setShowLogicCheck] = useState(false);
    const [enableGrouping, setEnableGrouping] = useState(false);

    // --- Deep Analysis Modal State ---
    const [deepAnalysisData, setDeepAnalysisData] =
      useState<RelationshipDeepAnalysisData | null>(null);

    // --- Timeline State (4D Visualization) ---
    const [currentChapter, setCurrentChapter] = useState(1);
    const totalChapters = useMemo(() => {
      if (initialLinks.length === 0) return 1;
      const max = Math.max(
        ...initialLinks.map((l) => l.revealedInChapter || 0),
        1,
      );
      return max;
    }, [initialLinks]);

    // --- Hover Tooltip State ---

    // 외부에서 필터 변경 시 내부 상태 동기화
    useEffect(() => {
      setInternalFilter(relationTypeFilter);
    }, [relationTypeFilter]);

    const handleFilterChange = useCallback(
      (filter: UIRelationType | "all") => {
        setInternalFilter(filter);
        onFilterChange?.(filter);
      },
      [onFilterChange],
    );

    // 검색 결과 처리
    const handleSearchChange = useCallback(
      (matchingIds: string[] | null) => {
        onSearchChange?.(matchingIds);
      },
      [onSearchChange],
    );

    // Handle ESC key to clear selection
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onNodeClick?.(null);
          onLinkClick?.(null);
          // Optional: Clear search if active?
          // onSearchChange?.(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onNodeClick, onLinkClick]);
    // State for Link Hover Tooltip
    const [hoveredLinkData, setHoveredLinkData] = useState<{
      link: RelationshipLink;
      x: number;
      y: number;
    } | null>(null);

    // Tooltip close timer for smooth interaction
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Group Selection Cache (Optimized D3)
    const groupSelectionCache = useRef<
      Map<
        string,
        {
          cloud: d3.Selection<d3.BaseType, unknown, null, undefined>;
          label: d3.Selection<d3.BaseType, unknown, null, undefined>;
        }
      >
    >(new Map());

    // Map to store node ID -> original Character for reliable lookup
    const nodeCharacterMapRef = useRef<Map<string, Character>>(new Map());

    const { width, height } = useResize(containerRef);

    /**
     * [수정 포인트 1] 데이터 역직렬화 및 그룹 할당 로직 고도화
     * Neo4j의 extras 문자열을 파싱하여 faction 정보를 group 속성에 정합성 있게 매핑합니다.
     */
    const initialNodes: CharacterNode[] = useMemo(() => {
      // 1. 관계 수 계산 (중요도 지표) for Dynamic Sizing
      const relationCounts = calculateRelationCounts(initialLinks);

      const nodes = characters.map((char, index) => {
        // 새 스키마: profile.faction.name 사용
        const factionName = char.profile?.faction?.name || "무소속";

        // Fallback: _id가 null이면 인덱스 기반 임시 ID 사용
        const nodeId = char._id || `temp-node-${index}`;

        return {
          id: nodeId,
          name: char.profile?.name || "이름 없음",
          role: char.role,
          group: factionName,
          imageUrl: char.imageUrl, // Map imageUrl from character conversion
          relationCount: relationCounts[char._id] || 0,
          status: char.status, // 캐릭터 상태 (alive, dead, unknown 등)
        };
      });

      return nodes;
    }, [characters, initialLinks]);

    // Update node character map separately (fix useMemo side effect)
    useEffect(() => {
      nodeCharacterMapRef.current.clear();
      initialNodes.forEach((node) => {
        // Find original char by id (fallback to index logic if needed, but id is safest)
        // Since initialNodes are derived from characters, we can match by ID
        const originalChar = characters.find(
          (c) =>
            c._id === node.id || (node.id.startsWith("temp-node-") && !c._id),
        );
        if (originalChar) {
          nodeCharacterMapRef.current.set(node.id, originalChar);
        }
      });
    }, [initialNodes, characters]);

    // [수정 포인트] BFS for Flow Depth & Universal Curvature + 4D Timeline Filtering
    const processedLinks = useMemo(() => {
      // 1. 4D Timeline Filtering
      let filtered = initialLinks;
      if (totalChapters > 1) {
        filtered = initialLinks.filter(
          (l) => (l.revealedInChapter || 0) <= currentChapter,
        );
      }

      // 2. Initial Processing setup
      const links = filtered.map((l) => ({
        ...l,
        curvature: 0,
        flowDepth: -1,
      })); // Default depth -1

      // 2. Protagonist 식별 및 BFS 탐색 (Flow Animation)
      // Protagonist 찾기 (role === 'protagonist' 우선, 없으면 degree가 가장 높은 노드)
      let startNodeId: string | null = null;

      // nodeCharacterMapRef가 초기화되지 않았을 수 있으므로 characters prop 사용
      const protagonist = characters.find((c) => c.role === "protagonist");
      if (protagonist) {
        startNodeId = protagonist._id;
      } else {
        // Fallback: Max Degree Node (중심점)
        // (간단히 첫 번째 노드 사용하거나 추후 고도화)
        startNodeId = characters[0]?._id || null;
      }

      if (startNodeId) {
        // Build Adjacency List
        const adj = new Map<string, string[]>();
        links.forEach((l) => {
          const s =
            typeof l.source === "object"
              ? (l.source as CharacterNode).id
              : l.source;
          const t =
            typeof l.target === "object"
              ? (l.target as CharacterNode).id
              : l.target;
          if (!adj.has(s)) adj.set(s, []);
          if (!adj.has(t)) adj.set(t, []);
          adj.get(s)!.push(t);
          adj.get(t)!.push(s);
        });

        // BFS
        const queue: { id: string; depth: number }[] = [
          { id: startNodeId, depth: 0 },
        ];
        const visited = new Set<string>([startNodeId]);
        const nodeDepths = new Map<string, number>();
        nodeDepths.set(startNodeId, 0);

        while (queue.length > 0) {
          const { id, depth } = queue.shift()!;
          const neighbors = adj.get(id) || [];

          neighbors.forEach((nextId) => {
            if (!visited.has(nextId)) {
              visited.add(nextId);
              nodeDepths.set(nextId, depth + 1);
              queue.push({ id: nextId, depth: depth + 1 });
            }
          });
        }

        // Assign depth to links (min depth of source/target)
        links.forEach((l) => {
          const s =
            typeof l.source === "object"
              ? (l.source as CharacterNode).id
              : l.source;
          const t =
            typeof l.target === "object"
              ? (l.target as CharacterNode).id
              : l.target;
          const sDepth = nodeDepths.get(s);
          const tDepth = nodeDepths.get(t);

          if (sDepth !== undefined && tDepth !== undefined) {
            l.flowDepth = Math.min(sDepth, tDepth);
          } else if (sDepth !== undefined) {
            l.flowDepth = sDepth;
          } else if (tDepth !== undefined) {
            l.flowDepth = tDepth;
          }
        });
      }

      // 3. Universal Curvature (모든 간선을 휘게 함)
      const pairMap = new Map<string, RelationshipLink[]>();

      links.forEach((link) => {
        const s =
          typeof link.source === "object"
            ? (link.source as CharacterNode).id
            : link.source;
        const t =
          typeof link.target === "object"
            ? (link.target as CharacterNode).id
            : link.target;
        const key = [s, t].sort().join("-");
        if (!pairMap.has(key)) pairMap.set(key, []);
        pairMap.get(key)!.push(link);
      });

      pairMap.forEach((group) => {
        const len = group.length;

        // 일관된 순서를 위해 ID 정렬
        group.sort((a, b) => a.id.localeCompare(b.id));

        const spacing = 0.25; // 휘어짐 정도 (기존 0.3보다 살짝 줄임)

        if (len === 1) {
          // 단일 간선도 휘어지게 함 (Random-seeded direction for variety but consistency)
          // ID 해시를 사용하여 일관된 방향 결정
          const hash = group[0].id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const direction = hash % 2 === 0 ? 1 : -1;
          group[0].curvature = 0.15 * direction; // 기본 곡률 0.15
        } else {
          // 다중 간선 분산
          group.forEach((l, i) => {
            let c = (i - (len - 1) / 2) * spacing;
            // 0에 너무 가까우면(직선) 강제로 벌림
            if (Math.abs(c) < 0.05) c = 0.15; // 중앙에 위치할 놈도 휘게 만듦
            l.curvature = c;

            // 방향 보정 (B->A)
            const s =
              typeof l.source === "object"
                ? (l.source as CharacterNode).id
                : l.source;
            const t =
              typeof l.target === "object"
                ? (l.target as CharacterNode).id
                : l.target;
            if (s > t) {
              l.curvature *= -1;
            }
          });
        }
      });

      return links;
    }, [initialLinks, characters, currentChapter, totalChapters]);

    const { nodes, links, simulation } = useForceSimulation(
      initialNodes,
      processedLinks,
      { width, height },
    );

    /**
     * 동적 그룹 클라우드 설정
     * - initialNodes 기반으로 그룹 목록 생성
     * - 빈 그룹 숨기기는 tick 핸들러에서 visibility로 제어
     */
    const groupConfig = useMemo(() => {
      const GROUP_COLORS_LIST = [
        "rgba(164, 119, 100, 0.15)", // Mocha
        "rgba(91, 123, 75, 0.15)", // Success/Green
        "rgba(184, 134, 11, 0.15)", // Gold/Warning
        "rgba(163, 58, 58, 0.15)", // Error/Red
      ];
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
        color: GROUP_COLORS_LIST[index % GROUP_COLORS_LIST.length],
        id: `group-gradient-${index}`,
      }));
    }, [initialNodes]);
    // 주요 캐릭터만 보기 필터 적용
    const filteredNodeIds = useMemo(() => {
      if (!showMainOnly) return null; // null = 필터 비활성화 (모든 노드 표시)

      const mainNodeIds = new Set<string>();
      nodes.forEach((node) => {
        // 주인공, 적대자는 무조건 포함
        if (node.role === "protagonist" || node.role === "antagonist") {
          mainNodeIds.add(node.id);
        }
        // 관계가 3개 이상인 캐릭터도 포함
        else if ((node.relationCount ?? 0) >= 3) {
          mainNodeIds.add(node.id);
        }
      });
      return mainNodeIds;
    }, [nodes, showMainOnly]);

    useEffect(() => {
      if (!simulation || !gRef.current) return;

      const g = d3.select(gRef.current);

      // Tick Handler: Update DOM directly for 60fps performance w/o React re-renders
      simulation.on("tick", () => {
        // 매 tick마다 새로운 선택자 사용 (Hitbox 포함)
        // [Optimized] Select GROUPS instead of individual paths to reduce DOM operations and recalculations
        const linkGroupSel = g.selectAll<SVGGElement, RelationshipLink>(
          ".link-group",
        );
        const nodeSel = g.selectAll<SVGGElement, CharacterNode>(".node-group");

        // 1. 필수 업데이트 - 링크 위치 (매 프레임)
        linkGroupSel.each(function (d) {
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
          const curvature = (d as RelationshipLink).curvature || 0;

          // Quadratic Bezier Curve Calculation
          const dx = x2 - x1;
          const dy = y2 - y1;
          const midX = (x1 + x2) * 0.5;
          const midY = (y1 + y2) * 0.5;

          // Control point offset perpendicular to the line
          // 오프셋 = (dx, dy)의 수직 벡터(-dy, dx) * curvature
          const controlX = midX - dy * curvature;
          const controlY = midY + dx * curvature;

          const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

          // [Optimized] Apply 'd' attribute to ALL paths within this group at once
          // This avoids re-calculating the geometry for each layer (shadow, glow, flow, hitbox...)
          // 'this' refers to the <g> element
          d3.select(this).selectAll("path").attr("d", pathD);
        });

        // 2. 필수 업데이트 - 노드 위치 (매 프레임)
        nodeSel.attr("transform", (d) =>
          d ? `translate(${d.x}, ${d.y})` : "",
        );

        // 3. 그룹 클라우드 업데이트 (활성화된 경우)
        if (enableGrouping && groupConfig.length > 0) {
          // 현재 활성화된 노드들을 그룹별로 수집
          const currentNodesByGroup: Record<string, CharacterNode[]> = {};
          nodes.forEach((node) => {
            if (node.group) {
              if (!currentNodesByGroup[node.group])
                currentNodesByGroup[node.group] = [];
              currentNodesByGroup[node.group].push(node);
            }
          });

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

            // 원형 클라우드 위치/크기 업데이트 (Glassmorphism 스타일)
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
    }, [simulation, enableGrouping, groupConfig, nodes]);

    const { zoomState, centerAt, zoomIn, zoomOut, resetZoom } = useZoom(
      svgRef,
      gRef,
    );

    // 캐릭터 선택 처리 (검색에서 - 줌/하이라이트 포함)
    const handleCharacterSelect = useCallback(
      (character: Character) => {
        onNodeClick?.(character);

        // 검색으로 선택 시 해당 노드로 줌 이동
        const targetNode = nodes.find((n) => n.id === character._id);
        if (
          targetNode &&
          targetNode.x !== undefined &&
          targetNode.y !== undefined
        ) {
          centerAt(targetNode.x, targetNode.y, 1.35);
        }
      },
      [onNodeClick, nodes, centerAt],
    );

    // Optimize handlers to avoid re-binding D3 events on every render (fix zoom lag)
    const onDragStart = useCallback((node: CharacterNode) => {
      setIsDragging(true);
      setDraggedNodeId(node.id);
    }, []);
    const onDragEnd = useCallback(
      (node: CharacterNode) => {
        setIsDragging(false);
        setDraggedNodeId(null);
        onNodeDragEnd?.(node);
      },
      [onNodeDragEnd],
    );

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

    // Handle opening deep analysis modal
    const handleOpenDeepAnalysis = useCallback(
      (link: RelationshipLink) => {
        onLinkClick?.(link);

        const sourceNode =
          typeof link.source === "object"
            ? (link.source as CharacterNode)
            : null;
        const targetNode =
          typeof link.target === "object"
            ? (link.target as CharacterNode)
            : null;

        if (!sourceNode || !targetNode) return;

        // Generate mock data for now (replace with real API call later)
        const mockData = generateMockAnalysisData(
          {
            id: sourceNode.id,
            name: sourceNode.name,
            imageUrl: sourceNode.imageUrl,
          },
          {
            id: targetNode.id,
            name: targetNode.name,
            imageUrl: targetNode.imageUrl,
          },
          link.relationTypes || [link.type as string],
          link.strength,
        );

        setDeepAnalysisData(mockData);
        setHoveredLinkData(null); // Close tooltip
      },
      [onLinkClick],
    );

    // Handle Link Hover for Tooltip

    const handleLinkHover = useCallback(
      (link: RelationshipLink | null, coords?: { x: number; y: number }) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

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
        // Use the reliable Map lookup instead of array indexing
        const char = nodeCharacterMapRef.current.get(node.id);

        if (char && onNodeClick) {
          onNodeClick(char);
        } else {
          console.warn(
            "[CharacterGraph] Character not found for node.id:",
            node.id,
          );
          console.warn(
            "[CharacterGraph] Available keys:",
            Array.from(nodeCharacterMapRef.current.keys()),
          );
        }
      },
      [onNodeClick],
    );

    const handleNodeHover = useCallback(
      (id: string | null) => {
        if (isDragging) return;
        setHoveredNodeId(id);
      },
      [isDragging],
    );

    // Voronoi 인터랙션: 마우스가 가장 가까운 노드 자동 하이라이트
    const delaunayRef = useRef<Delaunay<CharacterNode> | null>(null);

    // Delaunay 삼각분할 업데이트 (시뮬레이션 tick마다)
    useEffect(() => {
      if (!simulation) return;

      const updateDelaunay = () => {
        const validNodes = simulation
          .nodes()
          .filter((n) => n.x !== undefined && n.y !== undefined);
        if (validNodes.length >= 2) {
          delaunayRef.current = Delaunay.from(
            validNodes,
            (d) => d.x!,
            (d) => d.y!,
          );
        }
      };

      // 시뮬레이션 안정화 후 한번 생성
      simulation.on("end.delaunay", updateDelaunay);
      // 드래그 시에도 업데이트
      simulation.on("tick.delaunay", () => {
        if (simulation.alpha() < 0.1) updateDelaunay();
      });

      return () => {
        simulation.on("end.delaunay", null);
        simulation.on("tick.delaunay", null);
      };
    }, [simulation]);

    // SVG 마우스 이동 핸들러 (Voronoi)
    const handleSvgMouseMove = useCallback(
      (e: React.MouseEvent<SVGSVGElement>) => {
        if (isDragging || !delaunayRef.current || !gRef.current) return;

        // 현재 줌 transform 적용하여 실제 좌표 계산
        const svg = e.currentTarget;
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const ctm = gRef.current.getScreenCTM();
        if (!ctm) return;

        const transformed = point.matrixTransform(ctm.inverse());
        const nearestIndex = delaunayRef.current.find(
          transformed.x,
          transformed.y,
        );

        if (nearestIndex !== -1 && simulation) {
          const nodes = simulation.nodes();
          if (nodes[nearestIndex]) {
            // 거리 체크: 노드 크기에 따라 임계값 동적 설정
            const node = nodes[nearestIndex];
            const dx = (node.x || 0) - transformed.x;
            const dy = (node.y || 0) - transformed.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Protagonist: 100px size -> 50px radius
            // Others: 50px size -> 25px radius
            // Threshold = Radius + 20px padding
            const isProtagonist = node.role === "protagonist";
            const threshold = isProtagonist ? 70 : 45;

            if (distance < threshold) {
              setHoveredNodeId(node.id);
            } else {
              setHoveredNodeId(null);
            }
          }
        }
      },
      [isDragging, simulation],
    );

    const handleSvgMouseLeave = useCallback(() => {
      setHoveredNodeId(null);
    }, []);

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
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
          onClick={(e) => {
            // Background click clears selection
            if (
              e.target === e.currentTarget ||
              (e.target as Element).tagName === "svg"
            ) {
              onNodeClick?.(null);
              onLinkClick?.(null);
              onSearchChange?.(null); // Clear search too if desired? Maybe not.
            }
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
              {/* 텍스트 라벨용 그림자 필터 (CSS textShadow 대체) */}
              <filter
                id="textLabelShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  in="SourceAlpha"
                  stdDeviation="2"
                  result="blur"
                />
                <feOffset in="blur" dx="0" dy="1" result="offsetBlur" />
                <feFlood floodColor="rgba(248,248,247,0.95)" result="color" />
                <feComposite
                  in="color"
                  in2="offsetBlur"
                  operator="in"
                  result="shadow"
                />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
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
                    r={200}
                    fill={`url(#${config.id})`}
                    visibility="hidden"
                    style={{
                      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                      filter: "blur(8px)",
                    }}
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
                    className="font-heading pointer-events-none select-none font-bold italic mix-blend-multiply opacity-30"
                    visibility="hidden"
                    style={{
                      transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    {config.name}
                  </text>
                ))}
              </g>
            )}

            {links
              .filter((link) => {
                // 주요 캐릭터만 필터가 활성화된 경우, 양쪽 노드 모두 필터에 포함되어야 함
                if (filteredNodeIds) {
                  const sId =
                    typeof link.source === "object"
                      ? (link.source as CharacterNode).id
                      : link.source;
                  const tId =
                    typeof link.target === "object"
                      ? (link.target as CharacterNode).id
                      : link.target;
                  return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
                }
                return true;
              })
              .map((link, linkIndex) => {
                const focusId =
                  hoveredNodeId || draggedNodeId || selectedNodeId;
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
                // [Modified] Remove strictly hiding edges. Allow them to be rendered as "dimmed" for global BFS animation.
                // if ((selectedNodeId || draggedNodeId) && !isConnected) return null;

                return (
                  <LinkRenderer
                    key={`${link.id}-${linkIndex}`}
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
                    onClick={handleOpenDeepAnalysis}
                    onHover={handleLinkHover}
                    showTension={showTension}
                    showLogicCheck={showLogicCheck}
                  />
                );
              })}

            {/* Tooltip on Hover */}

            {nodes
              .filter(
                (node) => !filteredNodeIds || filteredNodeIds.has(node.id),
              )
              .map((node, index) => {
                // Determine visual state based on Search vs Selection
                let isDimmed = false;
                let isHighlighted = false;

                if (isSearchActive) {
                  // Search Mode: Highlight matches, dim others
                  isDimmed = !highlightedNodeIds?.includes(node.id);
                  isHighlighted =
                    highlightedNodeIds?.includes(node.id) ?? false;
                } else {
                  // Selection/Hover Mode
                  isDimmed =
                    connectedNodeIds !== null && !connectedNodeIds.has(node.id);
                  isHighlighted = connectedNodeIds?.has(node.id) ?? false;
                }

                return (
                  <NodeRenderer
                    key={node.id || `node-${index}`}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    isHighlighted={isHighlighted}
                    isDimmed={isDimmed}
                    onClick={handleNodeClick}
                    onHover={handleNodeHover}
                    dragBehavior={dragBehavior}
                    zoomScale={zoomState.scale}
                    showLogicCheck={showLogicCheck}
                  />
                );
              })}
          </g>
        </svg>

        {/* Relationship Event Tooltip on Hover */}
        {hoveredLinkData && (
          <RelationshipEventTooltip
            events={hoveredLinkData.link.history || []}
            sourceName={
              nodeCharacterMapRef.current.get(
                typeof hoveredLinkData.link.source === "object"
                  ? (hoveredLinkData.link.source as CharacterNode).id
                  : hoveredLinkData.link.source,
              )?.profile?.name || "???"
            }
            targetName={
              nodeCharacterMapRef.current.get(
                typeof hoveredLinkData.link.target === "object"
                  ? (hoveredLinkData.link.target as CharacterNode).id
                  : hoveredLinkData.link.target,
              )?.profile?.name || "???"
            }
            x={hoveredLinkData.x}
            y={hoveredLinkData.y}
            type={toUIRelationType(hoveredLinkData.link.type)}
            strength={hoveredLinkData.link.strength}
            description={hoveredLinkData.link.description}
            onEventClick={() => {}} // TODO: Handle event click
            onMouseEnter={() => {
              if (hoverTimeoutRef.current)
                clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => handleLinkHover(null)}
            onOpenDeepAnalysis={() =>
              handleOpenDeepAnalysis(hoveredLinkData.link)
            }
          />
        )}

        {/* Timeline Slider (4D Visualization) */}
        {totalChapters > 1 && (
          <TimelineSlider
            currentChapter={currentChapter}
            totalChapters={totalChapters}
            onChange={setCurrentChapter}
          />
        )}

        {/* Zoom Controls (Floating) */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white/90 shadow-md rounded-lg hover:bg-cloud-50 text-espresso-600 transition-colors"
            title="Zoom In"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white/90 shadow-md rounded-lg hover:bg-cloud-50 text-espresso-600 transition-colors"
            title="Zoom Out"
          >
            <span className="text-lg font-bold">-</span>
          </button>
          <button
            onClick={resetZoom}
            className="p-2 bg-white/90 shadow-md rounded-lg hover:bg-cloud-50 text-espresso-600 transition-colors text-xs font-medium"
            title="Fit View"
          >
            Fit
          </button>
        </div>

        {/* 향상된 컨트롤 패널 */}
        <NetworkControls
          relationTypeFilter={internalFilter}
          onFilterChange={handleFilterChange}
          hoveredType={hoveredRelationType}
          onHoverType={setHoveredRelationType}
          showMainOnly={showMainOnly}
          onShowMainOnlyChange={setShowMainOnly}
          showTension={showTension}
          onToggleTension={setShowTension}
          showLogicCheck={showLogicCheck}
          onToggleLogicCheck={setShowLogicCheck}
          enableGrouping={enableGrouping}
          onGroupingChange={setEnableGrouping}
        />

        {/* 캐릭터 검색 오버레이 */}
        {showSearch && (
          <CharacterSearchOverlay
            characters={characters}
            onSelect={handleCharacterSelect}
            onSearch={handleSearchChange}
          />
        )}

        {/* 관계 심층 분석 모달 */}
        <RelationshipDeepAnalysisModal
          isOpen={deepAnalysisData !== null}
          onClose={() => setDeepAnalysisData(null)}
          data={deepAnalysisData}
        />
      </div>
    );
  },
);

export { AnalysisSummaryModal } from "./AnalysisSummaryModal";
export default CharacterGraph;
