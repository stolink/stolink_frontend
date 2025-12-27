import { memo, useRef, useEffect } from "react";
import * as d3 from "d3";
import type { CharacterNode } from "@/types";
import { NODE_SIZES, ROLE_COLORS, ANIMATION } from "./constants";

interface NodeRendererProps {
  node: CharacterNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: (node: CharacterNode) => void;
  onHover: (nodeId: string | null) => void;
  dragBehavior: d3.DragBehavior<SVGGElement, CharacterNode, CharacterNode>;
}

/**
 * SVG 노드 렌더러 컴포넌트 - Obsidian 스타일 비주얼
 */
export const NodeRenderer = memo(function NodeRenderer({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
  onHover,
  dragBehavior,
}: NodeRendererProps) {
  // Ref for D3 Drag Attachment
  const elementRef = useRef<SVGGElement>(null);

  // Data Binding & Drag Attachment
  // Combined to ensure order: Data must be bound before drag behavior uses it.
  useEffect(() => {
    if (elementRef.current) {
      // 1. Bind Data
      const selection = d3.select(elementRef.current).data([node]);

      // 2. Attach Drag (only if behavior exists)
      if (dragBehavior) {
        selection.call(dragBehavior);
      }
    }
  }, [node, dragBehavior]);

  const isProtagonist = node.role === "protagonist";
  const size = isProtagonist ? NODE_SIZES.protagonist : NODE_SIZES.default;
  const radius = size / 2;
  const roleColor = ROLE_COLORS[node.role || "other"];

  // 위치가 아직 계산되지 않은 경우
  if (node.x === undefined || node.y === undefined) {
    return null;
  }

  // 이모지 선택
  const getEmoji = () => {
    switch (node.role) {
      case "protagonist":
        return "🦸";
      case "antagonist":
        return "🦹";
      case "mentor":
        return "🧙";
      default:
        return "👤";
    }
  };

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
        transition: `opacity ${ANIMATION.highlightDuration}ms ease`,
      }}
    >
      {/* 글로우 효과 (선택/하이라이트 시) */}
      {(isSelected || isHighlighted) && (
        <circle
          r={radius + 12}
          fill={isSelected ? "#3b82f6" : roleColor}
          opacity={0.2}
          style={{
            filter: "blur(8px)",
          }}
        />
      )}

      {/* 펄스 링 (호버/선택 시) */}
      {isHighlighted && (
        <circle
          r={radius + 4}
          fill="none"
          stroke={roleColor}
          strokeWidth={2}
          opacity={0.5}
          style={{
            animation: `pulse ${ANIMATION.pulseDuration}ms ease-in-out infinite`,
          }}
        />
      )}

      {/* 외부 링 (선택 표시) */}
      {isSelected && (
        <circle
          r={radius + 6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={3}
          opacity={0.9}
        />
      )}

      {/* 그림자 (깊이감) */}
      <circle
        r={radius}
        fill="rgba(0,0,0,0.1)"
        transform="translate(2, 2)"
        style={{ filter: "blur(3px)" }}
      />

      {/* 메인 원 - 그라디언트 효과 */}
      <defs>
        <radialGradient
          id={`node-gradient-${node.id}`}
          cx="30%"
          cy="30%"
          r="70%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle
        r={radius}
        fill={`url(#node-gradient-${node.id})`}
        stroke={roleColor}
        strokeWidth={isProtagonist ? 3 : 2}
        style={{
          transition: `stroke-width ${ANIMATION.hoverTransition}ms ease`,
        }}
      />

      {/* 이미지 또는 이모지 */}
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
              filter:
                isDimmed || (!isHighlighted && !isSelected)
                  ? "grayscale(80%) brightness(0.9)"
                  : "none",
              transition: `filter ${ANIMATION.highlightDuration}ms ease`,
            }}
          />
        </>
      ) : (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isProtagonist ? 22 : 16}
          style={{
            userSelect: "none",
            filter: isDimmed ? "grayscale(100%)" : "none",
          }}
        >
          {getEmoji()}
        </text>
      )}

      {/* 이름 라벨 */}
      <g transform={`translate(0, ${radius + 18})`}>
        {/* 라벨 배경 */}
        <rect
          x={-node.name.length * 4 - 10}
          y={-11}
          width={node.name.length * 8 + 20}
          height={22}
          rx={11}
          fill={isSelected ? "#1f2937" : "rgba(255,255,255,0.95)"}
          stroke={isSelected ? "none" : "rgba(0,0,0,0.06)"}
          strokeWidth={1}
          style={{
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
          }}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill={isSelected ? "#ffffff" : "#374151"}
          style={{ userSelect: "none" }}
        >
          {node.name}
        </text>
      </g>
    </g>
  );
});
