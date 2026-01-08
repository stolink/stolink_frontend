import {
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import ForceGraph2D from "react-force-graph-2d";
import type {
  Character,
  CharacterNode,
  RelationshipLink,
} from "@/types";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import type { GraphData } from "./types";
import { FORCE_CONFIG, ZOOM_CONFIG, type UIRelationType } from "../constants";
import { calculateRelationCounts } from "../utils";
import { drawNode } from "./CanvasNodeRenderer";
import { drawLink } from "./CanvasLinkRenderer";
import { useImageCache } from "./useImageCache";
import { NetworkControls } from "../NetworkControls";
import { TimelineSlider } from "../TimelineSlider";
import { CharacterSearchOverlay } from "../CharacterSearchOverlay";
import { RelationshipDeepAnalysisModal } from "../RelationshipDeepAnalysis";
import { generateMockAnalysisData } from "../RelationshipDeepAnalysis/utils/analysisCalculations";
import { RelationshipEventTooltip } from "../RelationshipEventTooltip";

interface CharacterGraphCanvasProps {
  characters: Character[];
  links: RelationshipLink[];
  onNodeClick?: (character: Character | null) => void;
  onLinkClick?: (link: RelationshipLink | null) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: UIRelationType | "all";
  onFilterChange?: (filter: UIRelationType | "all") => void;
  highlightedNodeIds?: string[] | null;
  onSearchChange?: (matchingIds: string[] | null) => void;
  className?: string;
  showSearch?: boolean;
  onNodeDragEnd?: (node: CharacterNode) => void;
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
      onNodeClick,
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
    const graphRef = useRef<any>(null);
    const [animationPhase, setAnimationPhase] = useState(0);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = useState<{
      link: RelationshipLink;
      coords: { x: number; y: number };
    } | null>(null);
    const [internalFilter, setInternalFilter] = useState<UIRelationType | "all">(
      relationTypeFilter,
    );
    const [showMainOnly, setShowMainOnly] = useState(false);
    const [showTension] = useState(false);
    const [showLogicCheck] = useState(false);
    const [currentChapter, setCurrentChapter] = useState(1);

    // Deep Analysis Modal
    const [deepAnalysisData, setDeepAnalysisData] =
      useState<RelationshipDeepAnalysisData | null>(null);

    // 이미지 캐싱
    const imageCache = useImageCache(characters);

    // Ref 핸들 설정
    useImperativeHandle(ref, () => ({
      focusNode: async (nodeId: string) => {
        // react-force-graph-2d의 줌 기능으로 특정 노드 포커스
        if (graphRef.current) {
          const node = initialNodes.find((n) => n.id === nodeId);
          if (node && node.x !== undefined && node.y !== undefined) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(2, 1000);
          }
        }
      },
    }));

    // 애니메이션 루프 (흐름 효과)
    useEffect(() => {
      let frameId: number;
      const animate = () => {
        setAnimationPhase((prev) => (prev + 0.005) % 1);
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }, []);

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

    // 링크 필터링 (4D Timeline + Relation Type)
    const processedLinks = useMemo(() => {
      let filtered = initialLinks;

      // 4D Timeline 필터링
      const totalChapters = Math.max(
        ...initialLinks.map((l) => l.revealedInChapter || 1),
      );
      if (totalChapters > 1) {
        filtered = filtered.filter(
          (l) => (l.revealedInChapter || 0) <= currentChapter,
        );
      }

      // 관계 타입 필터링
      if (internalFilter !== "all") {
        filtered = filtered.filter((l) => l.type === internalFilter);
      }

      return filtered;
    }, [initialLinks, currentChapter, internalFilter]);

    // GraphData 생성
    const graphData: GraphData = useMemo(
      () => ({
        nodes: initialNodes,
        links: processedLinks,
      }),
      [initialNodes, processedLinks],
    );

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

    return (
      <div className={`relative w-full h-full bg-[#F1F0EC] ${className || ""}`}>
        {/* Canvas Graph */}
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={window.innerWidth}
          height={window.innerHeight}
          // Force 설정
          d3AlphaDecay={FORCE_CONFIG.alphaDecay}
          d3VelocityDecay={FORCE_CONFIG.velocityDecay}
          d3Force="charge"
          warmupTicks={50}
          cooldownTicks={200}
          // 줌 설정
          minZoom={ZOOM_CONFIG.min}
          maxZoom={ZOOM_CONFIG.max}
          // 커스텀 노드 렌더링
          nodeCanvasObject={(
            node: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const charNode = node as CharacterNode;
            const isSelected = selectedNodeId === charNode.id;
            const isHighlighted =
              connectedNodeIds?.has(charNode.id) ||
              (highlightedNodeIds && highlightedNodeIds.includes(charNode.id)) ||
              false;
            const isDimmed =
              (connectedNodeIds && !connectedNodeIds.has(charNode.id)) ||
              (showMainOnly && charNode.role !== "protagonist");

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
              changeType: null,
              showLogicCheck,
            });
          }}
          nodeCanvasObjectMode={() => "replace"}
          // 커스텀 링크 렌더링
          linkCanvasObject={(
            link: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const relLink = link as RelationshipLink;
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
            const isDimmed =
              connectedNodeIds &&
              !connectedNodeIds.has(sourceId) &&
              !connectedNodeIds.has(targetId);

            drawLink({
              ctx,
              link: relLink,
              globalScale,
              state: {
                isHighlighted,
                isDimmed,
                isSelected: false,
              },
              animationPhase,
              showTension,
              showLogicCheck,
            });
          }}
          linkCanvasObjectMode={() => "replace"}
          // 이벤트
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) =>
            setHoveredNodeId(node ? (node as CharacterNode).id : null)
          }
          onNodeDragEnd={(node: any) => {
            if (onNodeDragEnd) {
              onNodeDragEnd(node as CharacterNode);
            }
          }}
          enableNodeDrag={true}
          enablePanInteraction={true}
          enableZoomInteraction={true}
        />

        {/* UI Overlays */}
        <NetworkControls
          relationTypeFilter={internalFilter}
          onFilterChange={handleFilterChange}
          showMainOnly={showMainOnly}
          onShowMainOnlyChange={setShowMainOnly}
        />

        {/* 4D Timeline Slider */}
        <TimelineSlider
          currentChapter={currentChapter}
          totalChapters={Math.max(
            ...initialLinks.map((l) => l.revealedInChapter || 1),
          )}
          onChange={setCurrentChapter}
        />

        {/* Search Overlay */}
        {showSearch && (
          <CharacterSearchOverlay
            characters={characters}
            onSelect={(character) => {
              const node = initialNodes.find((n) => n.id === character._id);
              if (node && onNodeClick) {
                onNodeClick(character);
              }
            }}
            onSearch={onSearchChange || (() => {})}
          />
        )}
      </div>
    );
  },
);

CharacterGraphCanvas.displayName = "CharacterGraphCanvas";
