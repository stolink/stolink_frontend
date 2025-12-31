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
 * SVG 노드 렌더러 컴포넌트 - Obsidian 스타일 비주얼 (Liquid Glass Effect Restored)
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
  const baseSize = isProtagonist ? NODE_SIZES.protagonist : NODE_SIZES.default;

  // Dynamic Sizing: Base + (RelationCount * Factor)
  // 연결이 많을수록 노드가 커짐 (중요도 시각화)
  const importanceFactor = 1.5;
  const dynamicBonus = (node.relationCount || 0) * importanceFactor;
  // Cap the size to prevent massive nodes
  const finalSize = Math.min(baseSize + dynamicBonus, 100);

  const radius = finalSize / 2;
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
        transition: `opacity ${ANIMATION.highlightDuration}ms ease-out`,
      }}
    >
      {/* 글로우 효과 (성능 최적화: blur 제거, 더 큰 원 + 낮은 opacity로 대체) */}
      {(isSelected || isHighlighted) && (
        <circle
          r={radius + 12}
          fill={isSelected ? "#5F7D5F" : roleColor}
          opacity={0.12}
          pointerEvents="none"
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

      {/* 그림자 (성능 최적화: blur 대신 그라디언트 기반 소프트 그림자) */}
      <circle
        r={radius + 2}
        fill="rgba(0,0,0,0.03)"
        transform="translate(1, 2)"
        pointerEvents="none"
      />

      {/* 메인 원 - 그라디언트 효과 (자연스러운 종이 질감, 공용 그라디언트 사용) */}
      <circle
        r={radius}
        fill="url(#node-gradient-common)"
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

      {/* 이름 라벨 - SVG 필터로 텍스트 그림자 적용 */}
      <text
        transform={`translate(0, ${radius + 18})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
        fontFamily="'Noto Serif KR', 'Playfair Display', Georgia, serif"
        fill={isSelected ? "#5F7D5F" : "#3D3A38"}
        filter="url(#textLabelShadow)"
        style={{
          userSelect: "none",
          letterSpacing: "0.02em",
        }}
      >
        {node.name}
      </text>
    </g>
  );
});
