import { memo } from "react";
import type { RelationshipLink, CharacterNode } from "@/types";
import { RELATION_COLORS, ANIMATION } from "./constants";

interface LinkRendererProps {
  link: RelationshipLink;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFiltered: boolean;
}

/**
 * SVG 링크(엣지) 렌더러 컴포넌트
 */
export const LinkRenderer = memo(function LinkRenderer({
  link,
  isHighlighted,
  isDimmed,
  isFiltered,
}: LinkRendererProps) {
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
  const strokeWidth = isHighlighted ? 3 : link.strength / 5 + 1;

  // 필터링된 링크는 거의 보이지 않게
  if (isFiltered && !isHighlighted) {
    return (
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.05}
      />
    );
  }

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={isDimmed ? ANIMATION.dimOpacity : isHighlighted ? 1 : 0.6}
      strokeDasharray={link.type === "enemy" ? "5,5" : undefined}
      style={{
        transition: `stroke-opacity ${ANIMATION.highlightDuration}ms ease, stroke-width ${ANIMATION.highlightDuration}ms ease`,
      }}
    />
  );
});
