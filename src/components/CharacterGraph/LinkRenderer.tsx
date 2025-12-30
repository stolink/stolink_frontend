import { memo, useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { RelationshipLink, CharacterNode } from "@/types";
import { RELATION_COLORS, ANIMATION, MOCHA_COLORS } from "./constants";

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
 * SVG 링크(엣지) 렌더러 컴포넌트 - Obsidian 스타일 비주얼
 */
export const LinkRenderer = memo(function LinkRenderer({
  link,
  isHighlighted,
  isDimmed,
  isFiltered,
  onClick,
  onHover,
}: LinkRendererProps) {
  // Ref for D3 Data Binding
  const groupRef = useRef<SVGGElement>(null);

  // Local hover state for micro-interaction
  const [isHovered, setIsHovered] = useState(false);

  // Bind data to children lines for Imperative D3 Updates
  useEffect(() => {
    if (groupRef.current) {
      // Just bind the single link data to ALL link-line elements
      // We let React handle the lifecycle (enter/exit), we just tag the data.
      d3.select(groupRef.current).selectAll(".link-line").datum(link);
    }
  }, [link, isHighlighted, isDimmed, isFiltered, isHovered]);

  // 소스/타겟 좌표 가져오기
  const source = link.source as CharacterNode;
  const target = link.target as CharacterNode;

  // 위치가 아직 계산되지 않은 경우
  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return null;
  }

  const color = RELATION_COLORS[link.type] || "#9ca3af";

  // 강도에 따른 선 두께 (strength 1-10, 1:10 = 1:4.5 비율)
  const baseWidth = 2 + ((link.strength - 1) / 9) * 7; // 2px ~ 9px (4.5배 차이)
  // Hover increases width significantly for feedback
  const hoverWidthBonus = isHovered ? 2.5 : 0;
  const strokeWidth = isHighlighted
    ? baseWidth + 1.5 + hoverWidthBonus
    : baseWidth + hoverWidthBonus;

  // 강도에 따른 기본 투명도 (가독성 위해 최소값 상향)
  const baseOpacity = 0.6 + (link.strength / 10) * 0.4;

  // 투명도 계산 (가독성 개선)
  const getOpacity = () => {
    if (isFiltered) return 0.05;
    if (isDimmed) return ANIMATION.dimOpacity * 0.5;
    if (isHighlighted) return 0.95;
    if (isHovered) return 0.9; // High opacity on hover
    return baseOpacity;
  };
  const finalOpacity = getOpacity();

  return (
    <g
      ref={groupRef}
      className={
        onClick ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(link);
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        // Report hover with client coordinates for tooltip positioning
        onHover?.(link, { x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
    >
      {/* Hitbox (Invisible wide line for easier clicking) */}
      <line
        className="link-line-hitbox"
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke="transparent"
        strokeWidth={20} // Wide hitbox
        strokeLinecap="round"
      />
      {/* 글로우 효과 (하이라이트 또는 호버 시) */}
      {(isHighlighted || isHovered) && !isFiltered && (
        <line
          className="link-line"
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          // Hover uses bright Mocha color for highlights, Highlighted uses relation color
          stroke={isHovered ? MOCHA_COLORS[400] : color}
          strokeWidth={strokeWidth + (isHovered ? 6 : 4)} // Wider glow on hover
          strokeOpacity={isHovered ? 0.6 : 0.15} // Much stronger opacity on hover
          strokeLinecap="round"
        />
      )}

      {/* 메인 링크 */}
      <line
        className="link-line"
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={finalOpacity}
        strokeLinecap="round"
        strokeDasharray={link.type === "hostile" ? "6,4" : undefined}
        style={{
          transition: "stroke-width 200ms ease-out",
        }}
      />
    </g>
  );
});
