import { memo, useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import type { RelationshipLink, CharacterNode } from "@/types";
import { getRelationshipColor } from "./utils";

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
}

/**
 * SVG 링크(엣지) 렌더러 - Premium Flowing Animation
 *
 * Features:
 * - 물 흐르듯 부드러운 그라데이션 애니메이션
 * - 관계 타입별 고유 색상/패턴
 * - 강도 기반 굵기/속도/입체감
 * - 호버 시 강화된 글로우 + 파티클 느낌
 */
export const LinkRenderer = memo(function LinkRenderer({
  link,
  isHighlighted,
  isDimmed,
  isFiltered,
  onClick,
  onHover,
}: LinkRendererProps) {
  const groupRef = useRef<SVGGElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 고유 ID 생성 (그라데이션용)
  const gradientId = useMemo(() => `flow-gradient-${link.id}`, [link.id]);
  const glowFilterId = useMemo(() => `glow-${link.id}`, [link.id]);

  // Fallback random delay (stable across renders) - Moved up to avoid conditional hook call
  // Using useState initializer to avoid impure function in useMemo
  const [randomDelay] = useState(() => Math.random() * 2);

  // D3 데이터 바인딩
  useEffect(() => {
    if (groupRef.current) {
      // [Fix] Bind data to the GROUP element so the parent's optimized tick handler can access it
      d3.select(groupRef.current).datum(link);

      // Also bind to paths to ensure child elements have access if needed
      d3.select(groupRef.current).selectAll("path").datum(link);
    }
  }, [link]);

  const source = link.source as CharacterNode;
  const target = link.target as CharacterNode;

  const primaryColor = getRelationshipColor(link.type, link.strength);

  // 보조 색상 (그라데이션용 - 더 밝은 버전, 거의 흰색에 가깝게)
  const secondaryColor = useMemo(() => {
    // Electric feel needs very bright color
    const hex = primaryColor.replace("#", "");
    const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 120);
    const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 120);
    const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 120);
    return `rgb(${r}, ${g}, ${b})`;
  }, [primaryColor]);

  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return null;
  }

  // 강도 기반 스타일 계산
  const baseWidth = 2 + ((link.strength - 1) / 9) * 3; // 2-5px
  const activeBonus = (isHovered ? 2 : 0) + (isHighlighted ? 1.5 : 0);
  const strokeWidth = baseWidth + activeBonus;

  // 투명도
  const getOpacity = () => {
    if (isFiltered) return 0.02;
    if (isDimmed) return 0.08;
    if (isHighlighted) return 0.95;
    if (isHovered) return 1;
    return 0.4 + (link.strength / 10) * 0.2;
  };
  const opacity = getOpacity();
  // 적대 관계 점선
  const dashArray =
    link.type === "hostile"
      ? `${6 + link.strength}, ${4 + (10 - link.strength) / 2}`
      : undefined;

  // 활성 상태 (호버 또는 하이라이트)
  const isActive = (isHighlighted || isHovered) && !isFiltered && !isDimmed;

  // Idle 상태 (아무것도 선택/호버 안됨 - 주인공 흐름 애니메이션용)
  // const isIdle = !isHighlighted && !isDimmed && !isFiltered && !isActive;

  // 흐름 애니메이션 활성화 조건 (Active or Idle)
  // [Modified] 항상 흐름 애니메이션 표시 (필터링된 것 제외)
  const showFlow = !isFiltered;

  // Animation Parameters based on State
  // [Modified] 항상 BFS Rhythmic 속도 유지 (Interaction에 따라 빨라지지 않음 - Global Wave 유지)
  const flowDuration = 3 - (link.strength / 10) * 1.5;

  // BFS depth 기반 딜레이 (Protagonist로부터 퍼져나가는 효과)
  // [Modified] Interaction 여부와 관계없이 항상 BFS Depth 따름
  const flowDelay =
    link.flowDepth !== undefined && link.flowDepth >= 0
      ? link.flowDepth * 0.2
      : randomDelay;

  // [Modified] Interaction 시 애니메이션 리셋 방지 (Constant Key)
  const animKey = "constant-flow";

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

        {/* 글로우 필터 */}
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isActive ? 4 : 2} result="blur" />
          <feFlood
            floodColor={primaryColor}
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
        style={{ transform: "translate(1px, 2px)" }}
      />

      {/* === Layer 3: 부드러운 외부 글로우 === */}
      {!isFiltered && !isDimmed && (
        <path
          className="link-path"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth + 6}
          strokeOpacity={isActive ? 0.25 : 0.08}
          strokeLinecap="round"
          style={{ filter: "blur(6px)" }}
        />
      )}

      {/* === Layer 4: Base Line (Solid) - 항상 잘 보이게 === */}
      <path
        className="link-path"
        fill="none"
        stroke={primaryColor}
        strokeWidth={strokeWidth}
        // 기본 0.5 이상 유지하여 "너무 연해지지 않도록"
        strokeOpacity={isFiltered ? 0.05 : isDimmed ? 0.1 : 0.5}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{
          transition: "stroke-width 200ms, stroke-opacity 200ms",
        }}
      />

      {/* === Layer 5: Flow Overlay (Electric Pulse) === */}
      {showFlow && (
        <path
          className="link-path"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth + (isActive ? 2 : 1)}
          strokeOpacity={1}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          // Remove mixBlendMode: screen (causes invisibility on light bg)
        />
      )}

      {/* === Layer 6: 하이라이트 (상단 빛 반사) - 더 subtle하게 === */}
      <path
        className="link-path"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={Math.max(0.8, strokeWidth * 0.3)}
        strokeOpacity={isFiltered ? 0 : isDimmed ? 0.05 : isActive ? 0.5 : 0.2}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{ transform: "translate(-0.3px, -0.8px)" }}
      />

      {/* === Layer 7: Removed Pulse Sphere per user request === */}
    </g>
  );
});
