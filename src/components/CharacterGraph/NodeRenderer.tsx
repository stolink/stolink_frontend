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
  dragBehavior: d3.DragBehavior<
    SVGGElement,
    CharacterNode,
    CharacterNode | unknown
  >;
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
  // node 자체를 의존성으로 사용하여 시뮬레이션과 동기화 유지
  useEffect(() => {
    if (elementRef.current) {
      // D3 selection에 node 데이터 바인딩 (시뮬레이션과 동기화)
      const selection = d3.select(elementRef.current).data([node]);

      // Attach Drag (only if behavior exists)
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
          r={radius + 10}
          fill={isSelected ? "#5F7D5F" : roleColor}
          opacity={0.15}
          style={{
            filter: "blur(6px)",
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
          r={radius + 5}
          fill="none"
          stroke="#5F7D5F"
          strokeWidth={2.5}
          opacity={0.8}
        />
      )}

      {/* 그림자 (깊이감 - 부드러운 종이 효과) */}
      <circle
        r={radius}
        fill="rgba(0,0,0,0.04)"
        transform="translate(1, 2)"
        style={{ filter: "blur(2px)" }}
      />

      {/* 메인 원 - 그라디언트 효과 (자연스러운 종이 질감) */}
      <defs>
        <radialGradient
          id={`node-gradient-${node.id}`}
          cx="35%"
          cy="35%"
          r="65%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="50%" stopColor="#F8F8F7" stopOpacity="1" />
          <stop offset="100%" stopColor="#E7E5E4" stopOpacity="1" />
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
              filter: isDimmed ? "grayscale(80%) brightness(0.9)" : "none",
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
          fill={isSelected ? "#5F7D5F" : "rgba(248,248,247,0.98)"}
          stroke={isSelected ? "none" : "rgba(0,0,0,0.05)"}
          strokeWidth={1}
          style={{
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
          }}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill={isSelected ? "#ffffff" : "#2D2A28"}
          style={{ userSelect: "none" }}
        >
          {node.name}
        </text>
      </g>
    </g>
  );
});
