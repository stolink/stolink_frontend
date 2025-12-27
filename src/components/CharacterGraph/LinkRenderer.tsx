import { memo, useRef, useEffect } from "react";
import * as d3 from "d3";
import type { RelationshipLink, CharacterNode } from "@/types";
import { RELATION_COLORS, ANIMATION } from "./constants";

interface LinkRendererProps {
  link: RelationshipLink;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFiltered: boolean;
}

/**
 * SVG 링크(엣지) 렌더러 컴포넌트 - Obsidian 스타일 비주얼
 */
export const LinkRenderer = memo(function LinkRenderer({
  link,
  isHighlighted,
  isDimmed,
  isFiltered,
}: LinkRendererProps) {
  // Ref for D3 Data Binding
  const groupRef = useRef<SVGGElement>(null);

  // Bind data to children lines for Imperative D3 Updates
  useEffect(() => {
    if (groupRef.current) {
      // Just bind the single link data to ALL link-line elements
      // We let React handle the lifecycle (enter/exit), we just tag the data.
      d3.select(groupRef.current).selectAll(".link-line").datum(link);
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

  const color = RELATION_COLORS[link.type] || "#9ca3af";

  // 강도에 따른 선 두께
  const baseWidth = 1 + (link.strength / 10) * 2;
  const strokeWidth = isHighlighted ? baseWidth + 1.5 : baseWidth;

  // 강도에 따른 기본 투명도
  const baseOpacity = 0.3 + (link.strength / 10) * 0.4;

  // 필터링된 링크는 거의 보이지 않게 (하이라이트보다 우선 적용)
  const finalOpacity = isFiltered
    ? 0.03
    : isDimmed
      ? ANIMATION.dimOpacity * 0.5
      : isHighlighted
        ? 0.9
        : baseOpacity;

  return (
    <g ref={groupRef}>
      {/* 글로우 효과 (하이라이트 시, 필터 제외) */}
      {isHighlighted && !isFiltered && (
        <line
          className="link-line"
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke={color}
          strokeWidth={strokeWidth + 3}
          strokeOpacity={0.12}
          strokeLinecap="round"
          style={{ filter: "blur(2px)" }}
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
        strokeDasharray={link.type === "enemy" ? "6,4" : undefined}
        style={{
          transition: `
            stroke-opacity ${ANIMATION.highlightDuration}ms ease,
            stroke-width ${ANIMATION.highlightDuration}ms ease
          `,
        }}
      />
    </g>
  );
});
