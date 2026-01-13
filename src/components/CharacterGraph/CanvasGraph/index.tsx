import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  startTransition,
} from "react";
import ForceGraph2D, {
  type NodeObject,
  type LinkObject,
  type ForceGraphMethods,
  type GraphData as ForceGraphData,
} from "react-force-graph-2d";
import type {
  Character,
  CharacterNode,
  RelationshipLink,
  RelationType,
} from "@/types";
import type { Event } from "@/types/event";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { FORCE_CONFIG, ZOOM_CONFIG, type UIRelationType } from "../constants";
import { calculateRelationCounts } from "../utils";
import { drawNode } from "./CanvasNodeRenderer";
import { drawLink } from "./CanvasLinkRenderer";
import { useImageCache } from "./useImageCache";
import { NetworkControls } from "../NetworkControls";

import { CharacterSearchOverlay } from "../CharacterSearchOverlay";
import { RelationshipDeepAnalysisModal } from "../RelationshipDeepAnalysis";
import { generateAnalysisData } from "../RelationshipDeepAnalysis/utils/analysisCalculations";
import { RelationshipEventTooltip } from "../RelationshipEventTooltip";
import { TiledBackground } from "../TiledBackground";
import { EventDetailPanel } from "@/components/common/character-detail/components/biography/EventDetailPanel";
import type { BiographyEvent } from "@/types/biography";
import * as d3 from "d3";
import { NODE_SIZES } from "../constants";

interface CharacterGraphCanvasProps {
  characters: Character[];
  links: RelationshipLink[];
  events?: Event[];
  onNodeClick?: (character: Character | null) => void;
  onLinkClick?: (link: RelationshipLink | null) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: UIRelationType | "all";
  onFilterChange?: (filter: UIRelationType | "all") => void;
  highlightedNodeIds?: string[] | null;
  onSearchChange?: (matchingIds: string[] | null) => void;
  className?: string;
  showSearch?: boolean;
  onNodeDragEnd?: (node: CharacterNode) => Promise<void>;
  nodeChanges?: Record<string, "new" | "updated" | null>;
  /** 편집 모드 - true일 때 내부 DeepAnalysis 모달을 열지 않음 */
  isEditMode?: boolean;
}

export interface CharacterGraphCanvasRef {
  focusNode: (nodeId: string) => Promise<void>;
}

/**
 * Canvas 기반 CharacterGraph 컴포넌트
 * react-force-graph-2d를 사용하여 1000+ 노드 지원
 */
export const CharacterGraphCanvas = forwardRef<
  CharacterGraphCanvasRef,
  CharacterGraphCanvasProps
>(
  (
    {
      characters,
      links: initialLinks,
      events = [],
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
      nodeChanges,
      isEditMode = false,
    },
    ref,
  ) => {
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const animationPhaseRef = useRef(0);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = useState<{
      link: RelationshipLink;
      coords: { x: number; y: number };
    } | null>(null);
    const [_mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Mouse tracking for accurate tooltip positioning
    const mousePosRef = useRef({ x: 0, y: 0 }); // Ref로 추가 추적 (리렌더 방지)
    const [internalFilter, setInternalFilter] = useState<
      UIRelationType | "all"
    >(relationTypeFilter);
    const [showMainOnly, setShowMainOnly] = useState(false);
    const [showTension] = useState(false);

    const [showLogicCheck] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<BiographyEvent | null>(
      null,
    );

    // Zoom State for TiledBackground
    const [zoomState, setZoomState] = useState({ x: 0, y: 0, scale: 1 });
    const hasInitialZoomedRef = useRef(false);

    // Deep Analysis Modal
    const [deepAnalysisData, setDeepAnalysisData] =
      useState<RelationshipDeepAnalysisData | null>(null);

    // 이미지 캐싱
    const imageCache = useImageCache(characters);

    // Animation Loop
    useEffect(() => {
      let frameId: number;
      let lastTime = 0;
      const targetFPS = 24; // Limit FPS for performance (flow doesn't need 60fps)
      const frameInterval = 1000 / targetFPS;

      const animate = (currentTime: number) => {
        if (currentTime - lastTime >= frameInterval) {
          // Update ref instead of state to prevent React churn
          animationPhaseRef.current = (animationPhaseRef.current + 0.015) % 1;

          // Force refresh even if simulation is idle to keep shader running
          // graphRef.current?.refresh(); // ERROR: refresh is not a function
          lastTime = currentTime;
        }
        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }, []);

    // 외부에서 필터 변경 시 내부 상태 동기화
    useEffect(() => {
      startTransition(() => {
        setInternalFilter(relationTypeFilter);
      });
    }, [relationTypeFilter]);

    // 노드 데이터 생성
    const initialNodes: CharacterNode[] = useMemo(() => {
      const relationCounts = calculateRelationCounts(initialLinks);

      return characters.map((char, index) => {
        const factionName = char.profile?.faction?.name || "무소속";
        const nodeId = char._id || `temp-node-${index}`;

        return {
          id: nodeId,
          name: char.profile?.name || "이름 없음",
          role: char.role,
          group: factionName,
          imageUrl: char.imageUrl,
          relationCount: relationCounts[nodeId] || 0,
          status: char.status,
        };
      });
    }, [characters, initialLinks]);

    // [Curvature Fix] BFS for Flow Depth & Universal Curvature + 4D Timeline Filtering
    const processedLinks = useMemo(() => {
      // 1. 4D Timeline Filtering (Removed - User Request)
      let filtered = initialLinks;

      // Relationship Type Filtering
      if (internalFilter !== "all") {
        filtered = filtered.filter((l) => l.type === internalFilter);
      }

      // 2. Initial Processing (BFS for Flow Depth & Directionality)
      // Protagonist 식별 및 BFS 탐색 (Flow Animation) - Restore BFS for Direction
      let startNodeId: string | null = null;
      const protagonist = characters.find((c) => c.role === "protagonist");
      if (protagonist) {
        startNodeId = protagonist._id || null;
      } else {
        // Fallback to first node
        startNodeId = characters[0]?._id || null;
      }

      // Prepare links with default depth
      const links = filtered.map((l) => ({
        ...l,
        curvature: 0,
        flowDepth: -1,
      }));

      if (startNodeId) {
        // Build Adjacency List for BFS
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
          adj.get(s)?.push(t);
          adj.get(t)?.push(s);
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

        // Assign depth to links and Fix Direction (Source -> Target = Low Depth -> High Depth)
        links.forEach((l) => {
          const sId =
            typeof l.source === "object"
              ? (l.source as CharacterNode).id
              : l.source;
          const tId =
            typeof l.target === "object"
              ? (l.target as CharacterNode).id
              : l.target;

          const sDepth = nodeDepths.get(sId);
          const tDepth = nodeDepths.get(tId);

          if (sDepth !== undefined && tDepth !== undefined) {
            l.flowDepth = Math.min(sDepth, tDepth);
            // Re-orient if needed: Flow should go from Parent(Low) to Child(High)
            // NOTE: FORCE GRAPH mutates objects. Swapping source/target might be dangerous if simulation is running.
            // BUT this is useMemo, creating NEW link objects (via map above). NOT mutating initialLinks.
            // However, react-force-graph expects source/target to be ID strings or objects.
            // If we swap, we must ensure consistency.
            // For flow visualization only, we might not need to swap, but CanvasLinkRenderer uses source->target gradient.
            // If we want flow from Protagonist OUT, we need Source=Propagonist.
            if (sDepth > tDepth) {
              // Swap source/target for rendering purposes?
              // Actually, let's just create a 'flowSource' property or Swap properties
              const temp = l.source;
              l.source = l.target;
              l.target = temp;
            }
          }
        });
      }

      // 3. Universal Curvature (모든 간선을 휘게 함)
      const pairMap = new Map<string, typeof links>();

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

      const finalLinks: typeof links = [];

      pairMap.forEach((group) => {
        const len = group.length;

        // [Super Edge Logic]
        // 1. Collect all unique relation types from all links in the group
        const allTypes = new Set<string>();
        group.forEach((l) => {
          if (l.relationTypes && l.relationTypes.length > 0) {
            l.relationTypes.forEach((t) => allTypes.add(t));
          } else if (l.type) {
            allTypes.add(l.type);
          }
        });

        const isMixed = allTypes.size > 1;

        // Curvature Direction (Consistent by ID hash)
        const hash = String(group[0].id)
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const direction = hash % 2 === 0 ? 1 : -1;
        const curvature = 0.15 * direction;

        // [Bidirectional Detection]
        const groupSources = new Set(
          group.map((l) =>
            typeof l.source === "object"
              ? (l.source as CharacterNode).id
              : l.source,
          ),
        );
        const isReciprocal = groupSources.size > 1;
        const isExplicitBidirectional = group.some((l) => l.bidirectional);
        const isBidirectional = isReciprocal || isExplicitBidirectional;

        if (len > 1 || isMixed) {
          // Create Super Edge (Complex or Parallel)
          const base = group[0];
          const typesArray = Array.from(allTypes);
          const primaryType = typesArray[0] || base.type;
          const superEdge = {
            ...base,
            type: primaryType as RelationType,
            relationTypes: typesArray as RelationType[],
            strength: Math.max(...group.map((l) => l.strength)),
            curvature: curvature as number,
            flowDepth: base.flowDepth ?? -1,
            isSuperEdge: true,
            originalLinks: group, // Store originals
            visualPattern: isMixed ? "braided" : "parallel",
            bidirectional: isBidirectional,
          } as const;
          finalLinks.push(superEdge);
        } else {
          // Single Link
          const link = group[0];
          link.curvature = curvature;
          finalLinks.push(link);
        }
      });

      return finalLinks;
    }, [initialLinks, internalFilter, characters]);

    // GraphData 생성 (Deep Clone 중요!)
    // react-force-graph는 데이터를 직접 변형(mutate)하므로, 원본 데이터를 보호하고
    // 리렌더링 시 깨끗한 데이터를 제공하기 위해 복제해야 함.
    const graphData = useMemo(
      () => ({
        nodes: JSON.parse(JSON.stringify(initialNodes)),
        links: JSON.parse(JSON.stringify(processedLinks)),
      }),
      [initialNodes, processedLinks],
    ) as ForceGraphData;

    // Character ID → Character 매핑
    const characterMap = useMemo(() => {
      const map = new Map<string, Character>();
      characters.forEach((char) => {
        if (char._id) {
          map.set(char._id, char);
        }
      });
      return map;
    }, [characters]);

    // Ref 핸들 설정 (graphData 선언 이후)
    useImperativeHandle(
      ref,
      () => ({
        focusNode: async (nodeId: string) => {
          if (graphRef.current) {
            const fg = graphRef.current;
            const { nodes: liveNodes } = graphData;
            const node = liveNodes.find((n: NodeObject) => n.id === nodeId);

            // 1. 하이라이트 즉시 적용
            onSearchChange?.([nodeId]);

            if (!node || node.x === undefined || node.y === undefined) return;

            setTimeout(() => {
              // 가독성과 안정성을 위한 1.2배 고정 줌 센터링
              fg.centerAt(node.x, node.y); // Instant
              fg.zoom(1.2, 500); // Animate zoom only
            }, 50);
          }
        },
      }),
      [initialNodes, graphData, onSearchChange],
    );

    // [Consolidated] Handle opening deep analysis modal
    const handleOpenDeepAnalysis = useCallback(
      (link: RelationshipLink) => {
        // 편집 모드에서는 내부 DeepAnalysis 모달을 열지 않고 외부 핸들러만 호출
        if (isEditMode) {
          onLinkClick?.(link);
          return;
        }

        // Find fresh character objects from map (Ensures full data)
        const sourceId =
          typeof link.source === "object"
            ? (link.source as CharacterNode).id
            : link.source;
        const targetId =
          typeof link.target === "object"
            ? (link.target as CharacterNode).id
            : link.target;

        const sourceChar = characterMap.get(sourceId);
        const targetChar = characterMap.get(targetId);

        if (!sourceChar || !targetChar) {
          console.warn(
            "[DeepAnalysis] Character lookup failed for:",
            sourceId,
            targetId,
          );
          return;
        }

        // Mock 데이터 생성하여 Deep Analysis 모달 데이터 설정
        // [Visual Enhancement] Restore complex types for demo pair to show off shader capabilities
        const isYubiZhuge =
          (sourceChar.profile?.name?.includes("유비") &&
            targetChar.profile?.name?.includes("제갈량")) ||
          (sourceChar.profile?.name?.includes("제갈량") &&
            targetChar.profile?.name?.includes("유비"));

        const effectiveTypes = isYubiZhuge
          ? ["ALLY", "ROMANTIC", "MENTOR", "FAMILY", "RIVAL"]
          : link.relationTypes || [link.type as string];

        // [Debug] Check incoming link data for Radar Chart Attributes
        console.log("Clicked Link Data for Analysis:", {
          source: sourceChar.profile.name,
          target: targetChar.profile.name,
          link: link,
          attributes: {
            emotionalBond: link.emotionalBond,
            functionalTrust: link.functionalTrust,
            interdependence: link.interdependence,
            latentTension: link.latentTension,
            valueAlignment: link.valueAlignment,
          },
        });

        try {
          const analysisData = generateAnalysisData(
            sourceChar,
            targetChar,
            effectiveTypes,
            link.strength,
            events,
            link.description,
          );
          console.log("[DeepAnalysis] Data generated:", analysisData);
          setDeepAnalysisData(analysisData);
          setHoveredLink(null); // Close tooltip
        } catch (error) {
          console.error("[DeepAnalysis] Generation failed:", error);
        }

        onLinkClick?.(link);
      },
      [onLinkClick, events, characterMap, isEditMode],
    );

    // 연결된 노드 계산
    const connectedNodeIds = useMemo(() => {
      if (!selectedNodeId) return null;
      const ids = new Set<string>([selectedNodeId]);
      processedLinks.forEach((link) => {
        const sourceId =
          typeof link.source === "string" ? link.source : link.source.id;
        const targetId =
          typeof link.target === "string" ? link.target : link.target.id;
        if (sourceId === selectedNodeId) ids.add(targetId);
        if (targetId === selectedNodeId) ids.add(sourceId);
      });
      return ids;
    }, [selectedNodeId, processedLinks]);

    // 노드 클릭 핸들러
    const handleNodeClick = (node: CharacterNode) => {
      const character = characterMap.get(node.id);
      if (character && onNodeClick) {
        onNodeClick(character);
      }
    };

    // 필터 변경 핸들러
    const handleFilterChange = (filter: UIRelationType | "all") => {
      setInternalFilter(filter);
      onFilterChange?.(filter);
    };

    // 링크 클릭 핸들러
    const handleLinkClick = (link: LinkObject) => {
      const relLink = link as unknown as RelationshipLink;
      handleOpenDeepAnalysis(relLink);
    };

    // 링크 호버 핸들러
    const handleLinkHover = (link: LinkObject | null) => {
      if (link) {
        setHoveredLink({
          link: link as unknown as RelationshipLink,
          coords: { x: mousePosRef.current.x, y: mousePosRef.current.y },
        });
      } else {
        setHoveredLink(null);
      }
    };

    // 창 크기 메모이제이션 (Container aware)
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({
      width: 800, // Default fallback
      height: 600,
    });

    // Dramatic Entry State
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      if (!containerRef.current) return;

      const updateDimensions = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      // Initial size
      updateDimensions();

      const observer = new ResizeObserver(() => {
        updateDimensions();
      });

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, []);

    // Force Simulation Configuration
    useEffect(() => {
      if (!graphRef.current) return;

      // Access the d3 simulation instance
      // react-force-graph exposes d3Force method
      const fg = graphRef.current;

      // Charge Force (Repulsion)
      const chargeForce = fg.d3Force(
        "charge",
      ) as d3.ForceManyBody<CharacterNode>;
      if (chargeForce) {
        chargeForce
          .strength(FORCE_CONFIG.charge)
          .distanceMin(FORCE_CONFIG.chargeDistanceMin)
          .distanceMax(FORCE_CONFIG.chargeDistanceMax);
      }

      // Link Force
      const linkForce = fg.d3Force("link") as d3.ForceLink<
        CharacterNode,
        RelationshipLink
      >;
      if (linkForce) {
        linkForce
          .distance((link: unknown) => {
            const relLink = link as RelationshipLink;
            const type = (relLink.type as UIRelationType) || "neutral";
            let configKey: keyof typeof FORCE_CONFIG.dynamic = "neutral";

            if (["friendly", "ally", "classmate"].includes(type))
              configKey = "friendly";
            else if (["hostile", "enemy", "rival"].includes(type))
              configKey = "hostile";
            else if (["family", "mentor"].includes(type)) configKey = "family";
            else if (["romantic"].includes(type)) configKey = "romantic";
            else if (["neutral", "coworker"].includes(type))
              configKey = "neutral";

            const baseDistance =
              FORCE_CONFIG.dynamic[
                configKey as keyof typeof FORCE_CONFIG.dynamic
              ]?.distance || FORCE_CONFIG.dynamic.neutral.distance;

            // Dynamics based on Strength (1-3 typically)
            // Friendly: High strength = Closer (shorter distance)
            // Hostile: High strength = Further (longer distance separation)
            const strengthVal = relLink.strength || 1;

            if (configKey === "hostile") {
              // More hate = More separation (Halved effect from 0.2 -> 0.1)
              return baseDistance * (1 + (strengthVal - 1) * 0.1);
            } else if (configKey === "friendly" || configKey === "romantic") {
              // More love = Closer (Halved effect from 0.1 -> 0.05)
              return Math.max(
                20,
                baseDistance * (1 - (strengthVal - 1) * 0.05),
              );
            }
            return baseDistance;
          })
          .strength((link: unknown) => {
            const relLink = link as RelationshipLink;
            const type = (relLink.type as UIRelationType) || "neutral";
            let configKey: keyof typeof FORCE_CONFIG.dynamic = "neutral";

            if (["friendly", "ally", "classmate"].includes(type))
              configKey = "friendly";
            else if (["hostile", "enemy", "rival"].includes(type))
              configKey = "hostile";
            else if (["family", "mentor"].includes(type)) configKey = "family";
            else if (["romantic"].includes(type)) configKey = "romantic";

            const baseStrength =
              FORCE_CONFIG.dynamic[
                configKey as keyof typeof FORCE_CONFIG.dynamic
              ]?.strength || FORCE_CONFIG.dynamic.neutral.strength;
            const strengthVal = relLink.strength || 1;

            // Stronger relationship = Stronger Spring (holds position better)
            // Works for both friendly (tight bind) and hostile (rigid separation)
            // (Halved effect from 0.15 -> 0.075)
            return Math.min(1, baseStrength * (1 + (strengthVal - 1) * 0.075));
          });
      }

      // Center Force
      const centerForce = fg.d3Force("center") as d3.ForceCenter<CharacterNode>;
      if (centerForce) {
        centerForce.strength(FORCE_CONFIG.centerStrength);
      }

      // Collision Force (Prevent Overlap)
      // Custom radius based on node role + padding
      fg.d3Force(
        "collide",
        d3
          .forceCollide<CharacterNode>()
          .radius((node: CharacterNode) => {
            const role = node.role || "other";
            // Use NODE_SIZES from constants, halved because it's radius
            const size =
              role === "protagonist"
                ? NODE_SIZES.protagonist
                : NODE_SIZES.default;
            // Add extra padding for better separation
            return size / 2 + FORCE_CONFIG.collisionPadding;
          })
          .strength(FORCE_CONFIG.collisionStrength),
      );

      // Re-heat simulation to apply changes
      fg.d3ReheatSimulation();
    }, [initialNodes]); // Re-run if nodes changed meaningfully

    // Initial Zoom to Fit & Dramatic Entry
    useEffect(() => {
      if (initialNodes.length === 0 || hasInitialZoomedRef.current) return;

      // Wait for graph to settle slightly
      const timer = setTimeout(() => {
        if (graphRef.current) {
          // Faster zoom (0.8s) for snappier entry
          graphRef.current.zoomToFit(800, 150);
          hasInitialZoomedRef.current = true;
          // Fade in
          setTimeout(() => setIsLoaded(true), 100);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [initialNodes]);

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-[#F1F0EC] overflow-hidden transition-opacity duration-1000 ease-out ${className || ""} ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ contain: "layout style paint" }} // CSS Containment - 렌더링 격리
        onMouseMove={(e) => {
          // Ref로 저장하여 리렌더 방지
          mousePosRef.current = { x: e.clientX, y: e.clientY };
          // 툴팁이 보일 때만 상태 업데이트 (스로틀링)
          if (hoveredLink) {
            setMousePos({ x: e.clientX, y: e.clientY });
          }
        }}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <TiledBackground zoomState={zoomState} className="w-full h-full" />
          {/* Ambient Glow: Warm central light */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(164, 119, 100, 0.08) 0%, rgba(241, 240, 236, 0) 70%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* Dynamic Vignette Overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 40%, rgba(61, 48, 42, 0.15) 100%)",
          }}
        />

        {/* Canvas Graph */}
        <div className="z-10 absolute inset-0">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            pixelRatio={window.devicePixelRatio} // High DPI 지원
            // Force 설정
            nodeId="id"
            linkSource="source"
            linkTarget="target"
            d3AlphaDecay={FORCE_CONFIG.alphaDecay}
            d3VelocityDecay={FORCE_CONFIG.velocityDecay}
            // d3Force="charge"  <-- REMOVED: Custom configured in useEffect
            warmupTicks={50}
            cooldownTicks={200}
            // 줌 설정
            minZoom={ZOOM_CONFIG.min}
            maxZoom={ZOOM_CONFIG.max}
            // 커스텀 노드 렌더링
            nodeCanvasObject={(
              node: NodeObject,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) => {
              const charNode = node as unknown as CharacterNode;
              const isSelected = selectedNodeId === charNode.id;
              const isHighlighted =
                connectedNodeIds?.has(charNode.id) ||
                (highlightedNodeIds &&
                  highlightedNodeIds.includes(charNode.id)) ||
                false;
              const isSearchActive = !!highlightedNodeIds;
              const isConnected = connectedNodeIds?.has(charNode.id);
              const isSearchResult = highlightedNodeIds?.includes(charNode.id);

              const isDimmed = Boolean(
                (showMainOnly && charNode.role !== "protagonist") ||
                (isSearchActive && !isSearchResult && !isConnected) || // 검색 중이라도 선택/연결된 노드면 dim 금지
                (!isSearchActive && connectedNodeIds && !isConnected), // 일반 선택 상태에서 비연결 노드 dim
              );

              drawNode({
                ctx,
                node: charNode,
                globalScale,
                state: {
                  isSelected,
                  isHighlighted,
                  isDimmed,
                  isHovered: hoveredNodeId === charNode.id,
                },
                imageCache,
                changeType: (nodeChanges && nodeChanges[charNode.id]) || null,
                showLogicCheck,
              });
            }}
            nodeCanvasObjectMode={() => "replace"}
            // Hit Area 설정: 노드 클릭 범위 확장 (기본 크기 + 10px)
            nodePointerAreaPaint={(
              node: NodeObject,
              color: string,
              ctx: CanvasRenderingContext2D,
            ) => {
              const charNode = node as unknown as CharacterNode;
              const role = charNode.role || "other";
              const baseSize =
                role === "protagonist"
                  ? NODE_SIZES.protagonist
                  : NODE_SIZES.default;
              const radius = baseSize / 2 + 10; // Extra padding for easier click

              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
              ctx.fill();
            }}
            // 커스텀 링크 렌더링
            linkCanvasObject={(
              link: LinkObject,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) => {
              const relLink = link as unknown as RelationshipLink;
              const sourceId =
                typeof relLink.source === "string"
                  ? relLink.source
                  : relLink.source.id;
              const targetId =
                typeof relLink.target === "string"
                  ? relLink.target
                  : relLink.target.id;

              const isHighlighted =
                selectedNodeId === sourceId || selectedNodeId === targetId;

              // 인성 검색/필터링 시 하이라이트되지 않은 간선은 흐리게 처리
              const isSearchActive = highlightedNodeIds !== null;
              const isDimmedBySearch =
                isSearchActive &&
                (!highlightedNodeIds.includes(sourceId) ||
                  !highlightedNodeIds.includes(targetId));

              // Fix: Strict Star Topology (User Feedback)
              // Only show links that are DIRECTLY connected to the selected node.
              // Hide links between neighbors (e.g., A->B, A->C selected. Hide B->C).
              const isDimmed =
                (selectedNodeId
                  ? sourceId !== selectedNodeId && targetId !== selectedNodeId
                  : false) || isDimmedBySearch;

              drawLink({
                ctx,
                link: relLink,
                globalScale,
                state: {
                  isHighlighted,
                  isDimmed: isDimmed || false,
                  isSelected: false,
                },
                animationPhase: animationPhaseRef.current,
                showTension,
                showLogicCheck,
              });
            }}
            linkCanvasObjectMode={() => "replace"}
            // Hit Area 설정: 링크 클릭 범위 확장 (10px 두께)
            linkPointerAreaPaint={(
              link: LinkObject,
              color: string,
              ctx: CanvasRenderingContext2D,
            ) => {
              const relLink = link as unknown as RelationshipLink;
              const source = relLink.source as CharacterNode;
              const target = relLink.target as CharacterNode;

              if (
                source.x === undefined ||
                source.y === undefined ||
                target.x === undefined ||
                target.y === undefined
              )
                return;

              const curvature = relLink.curvature || 0;
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const controlX = midX - dy * curvature;
              const controlY = midY + dx * curvature;

              ctx.lineWidth = 10; // Easier click width
              ctx.strokeStyle = color;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(source.x, source.y);
              ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
              ctx.stroke();
            }}
            // 이벤트
            onNodeClick={(node: NodeObject) =>
              handleNodeClick(node as unknown as CharacterNode)
            }
            onNodeHover={(node: NodeObject | null) =>
              setHoveredNodeId(
                node ? (node as unknown as CharacterNode).id : null,
              )
            }
            onLinkClick={handleLinkClick}
            onLinkHover={handleLinkHover}
            onNodeDragEnd={(node: NodeObject) => {
              const charNode = node as unknown as CharacterNode;
              // [Drag Fix] Fix node position after drag
              charNode.fx = charNode.x;
              charNode.fy = charNode.y;

              if (onNodeDragEnd) {
                onNodeDragEnd(charNode);
              }
            }}
            enableNodeDrag={true}
            enablePanInteraction={true}
            enableZoomInteraction={true}
            onZoom={(transform: { x: number; y: number; k: number }) => {
              // [State Conflict Fix] Wrap with requestAnimationFrame to avoid "update during render"
              requestAnimationFrame(() => {
                setZoomState({
                  x: transform.x,
                  y: transform.y,
                  scale: transform.k,
                });
              });
            }}
          />
        </div>

        {/* UI Overlays */}
        <NetworkControls
          relationTypeFilter={internalFilter}
          onFilterChange={handleFilterChange}
          showMainOnly={showMainOnly}
          onShowMainOnlyChange={setShowMainOnly}
        />

        {/* Search Overlay */}
        {showSearch && (
          <CharacterSearchOverlay
            characters={characters}
            onSelect={(character) => {
              const targetId = character._id;

              const fg = graphRef.current;
              const neighborIds = new Set<string>();

              if (fg) {
                const { links: liveLinks } = graphData;
                liveLinks.forEach((l: LinkObject) => {
                  const sId =
                    typeof l.source === "object"
                      ? (l.source as NodeObject).id
                      : l.source;
                  const tId =
                    typeof l.target === "object"
                      ? (l.target as NodeObject).id
                      : l.target;
                  if (sId === targetId) neighborIds.add(tId as string);
                  if (tId === targetId) neighborIds.add(sId as string);
                });
              }

              // 1. Update selection state
              if (selectedNodeId !== targetId) {
                onNodeClick?.(character);
              }

              // 2. Highlight (Target + Neighbors) to ensure edges are visible
              const idsToHighlight = [targetId, ...Array.from(neighborIds)];
              onSearchChange?.(idsToHighlight);

              // 3. Zoom
              if (fg) {
                const { nodes: liveNodes } = graphData;
                const node = liveNodes.find(
                  (n: NodeObject) => n.id === targetId,
                );

                if (node && node.x !== undefined && node.y !== undefined) {
                  // [Fix] Use instant transition to avoid D3 conflict between centerAt and zoom
                  // When both have duration, the second transition cancels the first.
                  setTimeout(() => {
                    fg.centerAt(node.x, node.y); // Instant
                    fg.zoom(1.2, 500); // Animate zoom only (optional) or just instant
                  }, 50);
                }
              }
            }}
            onSearch={onSearchChange || (() => {})}
          />
        )}

        {/* DEBUG: Version Indicator */}

        {/* Tooltip */}
        {hoveredLink && (
          <RelationshipEventTooltip
            events={hoveredLink.link.history || []}
            sourceName={
              typeof hoveredLink.link.source === "object"
                ? (hoveredLink.link.source as CharacterNode).name
                : "Unknown"
            }
            targetName={
              typeof hoveredLink.link.target === "object"
                ? (hoveredLink.link.target as CharacterNode).name
                : "Unknown"
            }
            sourceImage={
              typeof hoveredLink.link.source === "object"
                ? (hoveredLink.link.source as CharacterNode).imageUrl
                : undefined
            }
            targetImage={
              typeof hoveredLink.link.target === "object"
                ? (hoveredLink.link.target as CharacterNode).imageUrl
                : undefined
            }
            x={hoveredLink.coords.x}
            y={hoveredLink.coords.y}
            type={hoveredLink.link.type as UIRelationType}
            strength={hoveredLink.link.strength}
            description={hoveredLink.link.description}
            onEventClick={(event) => {
              const source =
                typeof hoveredLink.link.source === "object"
                  ? (hoveredLink.link.source as CharacterNode)
                  : { name: "Unknown" };
              const target =
                typeof hoveredLink.link.target === "object"
                  ? (hoveredLink.link.target as CharacterNode)
                  : { name: "Unknown" };

              const bioEvent: BiographyEvent = {
                eventId: event.eventId,
                eventType: (event.type as string).toLowerCase() || "transition",
                narrativeSummary: event.title,
                description: event.reason || "상세 설명이 없습니다.",
                participants: [source.name, target.name],
                locationRef: null,
                prevEventId: null,
                visualScene: null,
                timestamp: event.date || event.chapter || null,
                importance: 5,
                changesMade: null,
                projectId: (event as unknown as Event).projectId || "",
              };
              setSelectedEvent(bioEvent);
            }}
            onOpenDeepAnalysis={() => handleOpenDeepAnalysis(hoveredLink.link)}
          />
        )}

        {/* Deep Analysis Modal */}
        {deepAnalysisData && (
          <RelationshipDeepAnalysisModal
            isOpen={true}
            onClose={() => setDeepAnalysisData(null)}
            data={deepAnalysisData}
            onNavigateToEvent={(eventId) => {
              const event = events.find((e) => e.eventId === eventId);
              if (event) {
                // Convert event to BiographyEvent simple structure
                const bioEvent: BiographyEvent = {
                  eventId: event.eventId,
                  eventType: event.eventType.toLowerCase(),
                  narrativeSummary: event.narrativeSummary,
                  description: event.description,
                  participants: event.participants,
                  timestamp:
                    event.timestamp ||
                    (event.chapter ? String(event.chapter) : null),
                  importance: event.importance,
                  changesMade: null,
                  locationRef: null,
                  prevEventId: null,
                  visualScene: null,
                  projectId: event.projectId || "",
                };
                setSelectedEvent(bioEvent);
              }
            }}
          />
        )}

        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    );
  },
);

CharacterGraphCanvas.displayName = "CharacterGraphCanvas";
