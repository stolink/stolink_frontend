import { memo, useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import type { CharacterNode } from "@/types";
import { NODE_SIZES, ROLE_COLORS, ANIMATION } from "./constants";
import { getInitial, truncateName, ROLE_GRADIENTS } from "./utils";

interface NodeRendererProps {
  node: CharacterNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: (node: CharacterNode) => void;
  onHover: (nodeId: string | null) => void;
  dragBehavior: d3.DragBehavior<
    SVGGElement,
    CharacterNode,
    CharacterNode | unknown
  >;
  /** 현재 줌 레벨 (0.2 ~ 4) - 라벨 가시성 조절용 */
  zoomScale?: number;
}

/**
 * SVG 노드 렌더러 컴포넌트 - Enhanced with Initial Avatars & Pill Labels
 * - 이미지 없는 노드: 역할별 그라데이션 + 이니셜 표시
 * - 라벨: Pill 배경 + 줌 반응형 가시성 + 텍스트 truncation
 */
export const NodeRenderer = memo(function NodeRenderer({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
  onHover,
  dragBehavior,
  zoomScale = 1,
}: NodeRendererProps) {
  // Ref for D3 Drag Attachment
  const elementRef = useRef<SVGGElement>(null);

  // Data Binding & Drag Attachment
  useEffect(() => {
    if (elementRef.current) {
      const selection = d3.select(elementRef.current).data([node]);
      if (dragBehavior) {
        selection.call(dragBehavior);
      }
    }
  }, [node, dragBehavior]);

  const isProtagonist = node.role === "protagonist";
  const isImportant = isProtagonist;

  const baseSize = isProtagonist ? NODE_SIZES.protagonist : NODE_SIZES.default;
  const importanceFactor = isProtagonist ? 2.5 : 1.5;
  const dynamicBonus = (node.relationCount || 0) * importanceFactor;
  const finalSize = Math.min(baseSize + dynamicBonus, 180);
  const radius = finalSize / 2;
  const roleColor = ROLE_COLORS[node.role || "other"];

  // 줌 반응형 라벨 설정
  const showLabel = zoomScale > 0.35;
  const labelOpacity = Math.max(0, Math.min(1, (zoomScale - 0.35) * 3));

  // 라벨 텍스트 처리 (truncation)
  const displayName = useMemo(() => {
    const maxLen = isImportant ? 12 : 8;
    return truncateName(node.name, maxLen);
  }, [node.name, isImportant]);

  // Initial-based avatar (이미지 없는 노드용)
  const initial = getInitial(node.name);
  const gradient = ROLE_GRADIENTS[node.role || "other"] || ROLE_GRADIENTS.other;

  if (node.x === undefined || node.y === undefined) {
    return null;
  }

  return (
    <g
      ref={elementRef}
      className="node-group"
      transform={`translate(${node.x}, ${node.y})`}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        cursor: "pointer",
        opacity: isDimmed ? ANIMATION.dimOpacity : ANIMATION.normalOpacity,
        transition: `opacity ${ANIMATION.highlightDuration}ms ease-out`,
      }}
    >
      {/* 글로우/펄스 효과 (중요 인물/선택/하이라이트) */}
      {(isImportant || isSelected || isHighlighted) && (
        <>
          <circle
            r={radius + (isImportant ? 16 : 12)}
            fill={isSelected ? "#5F7D5F" : roleColor}
            opacity={isImportant ? 0.15 : 0.12}
            pointerEvents="none"
          />
          {(isHighlighted || isImportant) && (
            <circle
              r={radius + (isImportant ? 8 : 4)}
              fill="none"
              stroke={roleColor}
              strokeWidth={isImportant ? 3 : 2}
              opacity={0.5}
              style={{
                animation: `pulse ${ANIMATION.pulseDuration}ms ease-in-out infinite`,
              }}
            />
          )}
        </>
      )}

      {/* 선택 링 */}
      {isSelected && (
        <circle
          r={radius + 5}
          fill="none"
          stroke="#5F7D5F"
          strokeWidth={2.5}
          opacity={0.8}
        />
      )}

      {/* 그림자 (중요 인물만) */}
      {isImportant && (
        <circle
          r={radius + 2}
          fill="rgba(0,0,0,0.1)"
          transform="translate(1, 2)"
          pointerEvents="none"
        />
      )}

      {/* 메인 원 */}
      <circle
        r={radius}
        fill={isImportant ? "url(#node-gradient-common)" : "#F5F5F4"}
        stroke={roleColor}
        strokeWidth={isProtagonist ? 4 : 2}
        style={{
          transition: `stroke-width ${ANIMATION.hoverTransition}ms ease`,
        }}
      />

      {/* 아바타: 이미지 또는 이니셜 기반 */}
      {node.imageUrl ? (
        <>
          <defs>
            <clipPath id={`clip-${node.id}`}>
              <circle r={radius - 3} />
            </clipPath>
          </defs>
          <image
            href={node.imageUrl}
            x={-(radius - 3)}
            y={-(radius - 3)}
            width={(radius - 3) * 2}
            height={(radius - 3) * 2}
            clipPath={`url(#clip-${node.id})`}
            preserveAspectRatio="xMidYMid slice"
            style={{
              filter: isDimmed ? "grayscale(80%) brightness(0.9)" : "none",
              transition: `filter ${ANIMATION.highlightDuration}ms ease`,
            }}
          />
        </>
      ) : (
        <>
          {/* 이니셜 기반 아바타 - 역할별 그라데이션 */}
          <defs>
            <linearGradient
              id={`initial-gradient-${node.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>
          <circle
            r={radius - 3}
            fill={`url(#initial-gradient-${node.id})`}
            style={{
              filter: isDimmed ? "grayscale(80%) brightness(0.9)" : "none",
              transition: `filter ${ANIMATION.highlightDuration}ms ease`,
            }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isImportant ? radius * 0.8 : radius * 0.7}
            fontWeight={700}
            fill="white"
            style={{
              userSelect: "none",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {initial}
          </text>
        </>
      )}

      {/* 이름 라벨 - Minimalist Serif style */}
      {showLabel && (
        <g
          transform={`translate(0, ${radius + (isImportant ? 20 : 12)})`}
          style={{
            opacity: labelOpacity,
            transition: "opacity 200ms ease-out",
          }}
        >
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(16, radius * 0.38 + 4)}
            fontWeight={isImportant ? 700 : 500}
            fontFamily="'DM Serif Display', serif"
            fill="#3D302A"
            style={{
              userSelect: "none",
              textShadow:
                "0 1px 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.4)",
            }}
          >
            {node.name}
          </text>
        </g>
      )}

      {/* Full name tooltip (줌 아웃 시 또는 hover 시 title로 표시) */}
      {displayName !== node.name && <title>{node.name}</title>}
    </g>
  );
});
