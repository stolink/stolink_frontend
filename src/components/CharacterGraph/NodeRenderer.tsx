import { memo } from "react";
import type { CharacterNode } from "@/types";
import { NODE_SIZES, ANIMATION } from "./constants";

interface NodeRendererProps {
  node: CharacterNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: (node: CharacterNode) => void;
  onHover: (nodeId: string | null) => void;
}

/**
 * SVG 노드 렌더러 컴포넌트
 */
export const NodeRenderer = memo(function NodeRenderer({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
  onHover,
}: NodeRendererProps) {
  const isProtagonist = node.role === "protagonist";
  const size = isProtagonist ? NODE_SIZES.protagonist : NODE_SIZES.default;
  const radius = size / 2;

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
      {/* 배경 원 (선택/하이라이트 표시) */}
      {(isSelected || isHighlighted) && (
        <circle
          r={radius + 6}
          fill="none"
          stroke={isSelected ? "#3b82f6" : "#facc15"}
          strokeWidth={3}
          opacity={0.8}
        />
      )}

      {/* 메인 원 */}
      <circle
        r={radius}
        fill="white"
        stroke={isProtagonist ? "#3b82f6" : "#1f2937"}
        strokeWidth={isProtagonist ? 3 : 2}
      />

      {/* 이미지 또는 이모지 */}
      {node.imageUrl ? (
        <>
          <defs>
            <clipPath id={`clip-${node.id}`}>
              <circle r={radius - 2} />
            </clipPath>
          </defs>
          <image
            href={node.imageUrl}
            x={-(radius - 2)}
            y={-(radius - 2)}
            width={(radius - 2) * 2}
            height={(radius - 2) * 2}
            clipPath={`url(#clip-${node.id})`}
            preserveAspectRatio="xMidYMid slice"
            style={{
              filter:
                isDimmed || (!isHighlighted && !isSelected)
                  ? "grayscale(100%)"
                  : "none",
              opacity: isDimmed ? 0.5 : 1,
            }}
          />
        </>
      ) : (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isProtagonist ? 24 : 18}
          style={{ userSelect: "none" }}
        >
          {getEmoji()}
        </text>
      )}

      {/* 이름 라벨 */}
      <g transform={`translate(0, ${radius + 16})`}>
        <rect
          x={-node.name.length * 4 - 8}
          y={-10}
          width={node.name.length * 8 + 16}
          height={20}
          rx={10}
          fill={isProtagonist ? "#1f2937" : "white"}
          stroke={isProtagonist ? "none" : "#e5e7eb"}
          strokeWidth={1}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill={isProtagonist ? "white" : "#1f2937"}
          style={{ userSelect: "none" }}
        >
          {node.name}
        </text>
      </g>
    </g>
  );
});
