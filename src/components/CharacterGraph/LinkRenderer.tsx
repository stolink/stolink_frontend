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
 * SVG 링크(엣지) 렌더러 컴포넌트 - Obsidian 스타일 비주얼
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

  // 강도에 따른 선 두께
  const baseWidth = 1 + (link.strength / 10) * 2;
  const strokeWidth = isHighlighted ? baseWidth + 1.5 : baseWidth;

  // 강도에 따른 기본 투명도
  const baseOpacity = 0.3 + (link.strength / 10) * 0.4;

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
        strokeOpacity={0.03}
      />
    );
  }

  const finalOpacity = isDimmed
    ? ANIMATION.dimOpacity * 0.5
    : isHighlighted
      ? 0.9
      : baseOpacity;

  return (
    <g>
      {/* 글로우 효과 (하이라이트 시) */}
      {isHighlighted && (
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.2}
          strokeLinecap="round"
          style={{ filter: "blur(3px)" }}
        />
      )}

      {/* 메인 링크 */}
      <line
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
