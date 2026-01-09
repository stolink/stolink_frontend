import { memo, useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import type { RelationshipLink, CharacterNode } from "@/types";
import { getRelationshipColor, type UIRelationType } from "./utils";

interface LinkRendererProps {
  link: RelationshipLink;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFiltered: boolean;
  onHover?: (
    link: RelationshipLink | null,
    coords?: { x: number; y: number }
  ) => void;
  onClick?: (link: RelationshipLink) => void;
  /** 네트워크 붕괴 시각화를 위한 변경 상태 */
  changeType?: "inversion" | "collapse" | "new" | "conflict" | "updated";
  /** 붉은 파동이 도달하는 시간 (ms) */
  rippleDelay?: number;
  /** AI Insights */
  showTension?: boolean;
  showLogicCheck?: boolean;
}

/**
 * SVG 링크(엣지) 렌더러 - Premium Flowing Animation & Network Collapse
 */
export const LinkRenderer = memo(function LinkRenderer({
  link,
  isHighlighted,
  isDimmed,
  isFiltered,
  onClick,
  onHover,
  changeType,
  rippleDelay = 0,
  showTension = false,
  showLogicCheck = false,
}: LinkRendererProps) {
  const groupRef = useRef<SVGGElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 고유 ID 생성
  const gradientId = useMemo(() => `flow-gradient-${link.id}`, [link.id]);
  const glowFilterId = useMemo(() => `glow-${link.id}`, [link.id]);

  // Fallback random delay
  const [randomDelay] = useState(() => Math.random() * 2);

  // D3 데이터 바인딩
  useEffect(() => {
    if (groupRef.current) {
      d3.select(groupRef.current).datum(link);
      d3.select(groupRef.current).selectAll("path").datum(link);
    }
  }, [link]);

  const source = link.source as CharacterNode;
  const target = link.target as CharacterNode;

  // === Color & Style Logic for network collapse ===
  const primaryColor = useMemo(() => {
    if (changeType === "inversion") return "#EF4444"; // Red-500 (Hostile)
    if (changeType === "collapse") return "#9CA3AF"; // Gray-400 (Broken)
    if (changeType === "new") return "#EAB308"; // Yellow-500 (Gold)
    if (changeType === "conflict") return "#F59E0B"; // Amber-500 (Warning)
    if (changeType === "updated") return "#3B82F6"; // Blue-500 (Updated)
    return getRelationshipColor(link.type as UIRelationType, link.strength);
  }, [link.type, link.strength, changeType]);

  const secondaryColor = useMemo(() => {
    const hex = primaryColor.replace("#", "");
    const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 120);
    const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 120);
    const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 120);
    return `rgb(${r}, ${g}, ${b})`;
  }, [primaryColor]);

  // Collapse 상태일 때 점선 처리
  const dashArray = useMemo(() => {
    if (changeType === "collapse") return "4, 6"; // 점선 (붕괴)
    if (changeType === "new") return undefined; // 실선
    return link.type === "hostile"
      ? `${6 + link.strength}, ${4 + (10 - link.strength) / 2}`
      : undefined;
  }, [changeType, link.type, link.strength]);

  // 강도 기반 스타일 (Multi-Dimensional Mapping: 1~10 -> 1px~5px)
  // Strength 1 -> 1px
  // Strength 10 -> 5px
  const baseWidth = 1 + ((link.strength - 1) / 9) * 4;
  const activeBonus = (isHovered ? 2 : 0) + (isHighlighted ? 1.5 : 0);
  const strokeWidth = baseWidth + activeBonus;

  // 애니메이션용 CSS 클래스
  const transitionStyle = {
    transitionProperty:
      "stroke, stroke-width, stroke-opacity, stroke-dasharray",
    transitionDuration: "800ms", // 천천히 변함
    transitionDelay: `${rippleDelay}ms`, // 파동 도달 시간
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  };

  // 투명도
  const opacity = (() => {
    if (changeType === "collapse") return 0.3; // 붕괴된 관계는 희미하게
    if (isFiltered) return 0.02;
    if (isDimmed) return 0.08;
    if (isHighlighted) return 0.95;
    if (isHovered) return 1;
    return 0.4 + (link.strength / 10) * 0.2;
  })();

  const isActive = (isHighlighted || isHovered) && !isFiltered && !isDimmed;
  const showFlow = !isFiltered && changeType !== "collapse"; // 붕괴된 라인은 흐름 없음

  // AI Insights Detection
  const isTense = useMemo(() => {
    if (!showTension) return false;
    // High strength negative relation (MetaCategory = negative)
    const isNegative =
      (link.type as string) === "hostile" || (link.type as string) === "ENEMY";
    return isNegative && link.strength >= 7;
  }, [showTension, link.type, link.strength]);

  const isContradictory = useMemo(() => {
    return showLogicCheck && link.logicCheck?.isContradictory;
  }, [showLogicCheck, link.logicCheck]);

  // Inversion/New Animation: Pulse/Flash effect handled via CSS Keyframes in global styles or inline styles?
  // We'll use the transition logic for color change.

  const flowDuration = 3 - (link.strength / 10) * 1.5;
  const flowDelay =
    link.flowDepth !== undefined && link.flowDepth >= 0
      ? link.flowDepth * 0.2
      : randomDelay;
  const animKey = "constant-flow";

  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return null;
  }

  return (
    <g
      ref={groupRef}
      className={
        (onClick
          ? "cursor-pointer pointer-events-auto"
          : "pointer-events-none") + " link-group" // Add class for D3 selection
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(link);
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onHover?.(link, { x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
    >
      {/* === Defs: 그라데이션 & 필터 === */}
      <defs>
        {/* 흐르는 그라데이션 (Electric Feel: 경계 뚜렷하게) */}
        <linearGradient
          id={gradientId}
          key={`${gradientId}-${animKey}`} // Fixed Key
          gradientUnits="userSpaceOnUse"
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
        >
          {/* 흐름 패턴: 투명 -> 밝음(pulse) -> 투명 */}
          {/* Base stroke is drawn separately, so this is just the overlay highlight */}
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0">
            <animate
              attributeName="offset"
              values="-1; 1"
              dur={`${flowDuration}s`}
              begin={`${flowDelay}s`}
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="25%"
            stopColor={secondaryColor}
            // [Modified] Dimmed 상태일 때는 흐름도 연하게 (Visual Hierarchy)
            stopOpacity={isActive ? 1 : isDimmed ? 0.3 : 0.9}
          >
            <animate
              attributeName="offset"
              values="-0.75; 1.25"
              dur={`${flowDuration}s`}
              begin={`${flowDelay}s`}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor={secondaryColor} stopOpacity="0">
            <animate
              attributeName="offset"
              values="-0.5; 1.5"
              dur={`${flowDuration}s`}
              begin={`${flowDelay}s`}
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* 화살표 마커 Removed */}

        {/* Super Edge Gradient (Heartbeat Intertwined) */}
        {link.segments && link.segments.length > 1 && (
          <linearGradient
            id={`super-edge-${link.id}`}
            gradientUnits="userSpaceOnUse"
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
          >
            {(() => {
              // Create repeating pattern of colors
              const colors = link.segments.map((s) =>
                getRelationshipColor(s.type as UIRelationType, link.strength)
              );
              // Intertwine them: A -> B -> C -> A -> B ...
              const stops = [];
              const numPeats = 3; // How many times pattern repeats
              const totalStops = colors.length * numPeats;

              for (let i = 0; i <= totalStops; i++) {
                const colorIndex = i % colors.length;
                stops.push(
                  <stop
                    key={i}
                    offset={`${(i / totalStops) * 100}%`}
                    stopColor={colors[colorIndex]}
                  />
                );
              }
              return stops;
            })()}
          </linearGradient>
        )}

        {/* 글로우 필터 */}
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isActive ? 4 : 2} result="blur" />
          <feFlood
            floodColor={link.segments ? "#ffffff" : primaryColor} // White glow for multi-color
            floodOpacity={isActive ? 0.6 : 0.3}
          />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* === Layer 1: 히트박스 (투명) === */}
      <path
        className="link-path-hitbox"
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        strokeLinecap="round"
      />

      {/* === Layer 2: 깊은 그림자 (입체감) === */}
      <path
        className="link-path"
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={strokeWidth + 3}
        strokeOpacity={isFiltered ? 0 : opacity * 0.4}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{
          transform: "translate(1px, 2px)",
          ...transitionStyle, // Apply Ripple Transition
        }}
      />

      {/* === Layer 3: 부드러운 외부 글로우 === */}
      {!isFiltered && !isDimmed && changeType !== "collapse" && (
        <path
          className="link-path"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth + 6}
          strokeOpacity={isActive ? 0.25 : 0.08}
          strokeLinecap="round"
          style={{
            filter: "blur(6px)",
            ...transitionStyle, // Apply Ripple Transition
          }}
        />
      )}

      {/* Tension Heatmap Overlay (Red Glow) */}
      {isTense && !isFiltered && (
        <path
          className="link-path-tension animate-pulse"
          fill="none"
          stroke="#EF4444"
          strokeWidth={strokeWidth + 10}
          strokeOpacity={0.4}
          strokeLinecap="round"
          style={{
            filter: "blur(12px)",
            ...transitionStyle,
          }}
        />
      )}

      {/* Logic Check Contradiction Overlay (Amber Glow/Mark) */}
      {isContradictory && !isFiltered && (
        <path
          className="link-path-contradiction"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.9}
          strokeLinecap="round"
          strokeDasharray="4, 4"
          style={{
            filter: "drop-shadow(0 0 4px #F59E0B)",
            ...transitionStyle,
          }}
        />
      )}

      {/* === Layer 4: Base Line (Solid) - 항상 잘 보이게 === */}
      <path
        className="link-path"
        fill="none"
        stroke={
          link.segments && link.segments.length > 1
            ? `url(#super-edge-${link.id})`
            : primaryColor
        }
        strokeWidth={strokeWidth}
        // 기본 0.5 이상 유지하여 "너무 연해지지 않도록"
        strokeOpacity={isFiltered ? 0.05 : isDimmed ? 0.1 : 0.6}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{
          ...transitionStyle, // Apply Ripple Transition
        }}
        // Removed markerEnd as per "High-Dimensional" design request (clunky arrows removed)
      />

      {/* === Layer 5: Flow Overlay (Directionality) === */}
      {/* Bidirectional: No flow (Pulse maybe?) | Unidirectional: Flow A -> B */}
      {showFlow && !link.bidirectional && (
        <path
          className="link-path"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth + (isActive ? 2 : 1)}
          strokeOpacity={1}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          style={{
            ...transitionStyle, // Match base line movement/color
          }}
        />
      )}

      {/* === Layer 6: 하이라이트 (상단 빛 반사) - 더 subtle하게 === */}
      {changeType !== "collapse" && (
        <path
          className="link-path"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={Math.max(0.8, strokeWidth * 0.3)}
          strokeOpacity={
            isFiltered ? 0 : isDimmed ? 0.05 : isActive ? 0.5 : 0.2
          }
          strokeLinecap="round"
          strokeDasharray={dashArray}
          style={{
            transform: "translate(-0.3px, -0.8px)",
            ...transitionStyle,
          }}
        />
      )}

      {/* === Layer 7: Conflict Warning Icon === */}
      {changeType === "conflict" && (
        <foreignObject
          x={(source.x + target.x) / 2 - 12}
          y={(source.y + target.y) / 2 - 12}
          width={24}
          height={24}
          className="pointer-events-none overflow-visible"
          style={{
            opacity: 0,
            animation: `fadeIn 0.5s forwards ${rippleDelay}ms`, // Pop in with ripple
          }}
        >
          <div className="flex items-center justify-center w-full h-full text-xl animate-bounce">
            ⚠️
          </div>
        </foreignObject>
      )}

      {isContradictory && !isFiltered && (
        <foreignObject
          x={(source.x + target.x) / 2 - 12}
          y={(source.y + target.y) / 2 - 32}
          width={24}
          height={24}
          className="pointer-events-none overflow-visible"
        >
          <div className="flex items-center justify-center w-full h-full text-xl animate-bounce">
            🚫
          </div>
        </foreignObject>
      )}
    </g>
  );
});
