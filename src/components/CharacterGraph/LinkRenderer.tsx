import { memo, useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { RelationshipLink, CharacterNode } from "@/types";
import { MOCHA_COLORS } from "./constants";
import { getRelationshipColor } from "./utils";

interface LinkRendererProps {
  link: RelationshipLink;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFiltered: boolean;
  onHover?: (
    link: RelationshipLink | null,
    coords?: { x: number; y: number },
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

  // Bind data only when link changes (not on highlight/dimmed state changes)
  useEffect(() => {
    if (groupRef.current) {
      // 모든 path(hitbox 포함)에 데이터 바인딩
      const sel = d3.select(groupRef.current).selectAll("path");
      sel.datum(link);

      // 초기 경로 설정 (React 충돌 방지용 1회성 설정)
      // pathD 계산이 필요하지만 여기서 계산하기 번거로우므로
      // CharacterGraph처럼 tick을 한번 돌리거나, 간단히 직선으로 초기화
      const s = link.source as CharacterNode;
      const t = link.target as CharacterNode;

      if (
        s.x !== undefined &&
        s.y !== undefined &&
        t.x !== undefined &&
        t.y !== undefined
      ) {
        // 초기에는 직선으로 설정 (어차피 다음 tick에서 곡선됨)
        sel.attr("d", `M ${s.x} ${s.y} L ${t.x} ${t.y}`);
      }
    }
  }, [link]);

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

  const color = getRelationshipColor(link.type, link.strength);

  // 강도에 따른 선 두께 (더 얇게 조정)
  const baseWidth = 2 + ((link.strength - 1) / 9) * 3;
  const hoverWidthBonus = isHovered ? 2 : 0;
  const strokeWidth = isHighlighted
    ? baseWidth + 1 + hoverWidthBonus
    : baseWidth + hoverWidthBonus;

  // 투명도 계산 (기본 40-50%, 호버 시 100%)
  const baseOpacity = 0.4 + (link.strength / 10) * 0.15; // 0.4 ~ 0.55
  const getOpacity = () => {
    if (isFiltered) return 0.03;
    if (isDimmed) return 0.15;
    if (isHighlighted) return 0.95;
    if (isHovered) return 1.0;
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
        onHover?.(link, { x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
    >
      {/* Hitbox (Invisible wide path for easier clicking) */}
      <path
        className="link-path-hitbox"
        // d 속성 제거: D3 전담
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        strokeLinecap="round"
      />
      {/* 글로우 효과 */}
      {(isHighlighted || isHovered) && !isFiltered && (
        <path
          className="link-path"
          // d 속성 제거
          fill="none"
          stroke={isHovered ? MOCHA_COLORS[400] : color}
          strokeWidth={strokeWidth + (isHovered ? 6 : 4)}
          strokeOpacity={isHovered ? 0.6 : 0.15}
          strokeLinecap="round"
        />
      )}

      {/* 메인 링크 */}
      <path
        className="link-path"
        // d 속성 제거
        fill="none"
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
