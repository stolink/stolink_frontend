// =====================================================
// 📊 Relationship Radar Chart Component
// D3.js 기반 5축 레이더 차트 with Framer Motion 애니메이션
// =====================================================

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import type {
  RelationshipAttributes,
  RadarAxisConfig,
} from "@/types/relationshipAnalysis";
import { cn } from "@/lib/utils";

interface RelationshipRadarChartProps {
  /** 관계 속성 데이터 */
  attributes: RelationshipAttributes;
  /** 차트 크기 (정사각형, 기본 200) */
  size?: number;
  /** 차트 색상 (Teal or Rose) */
  color?: "teal" | "rose" | "mocha";
  /** 애니메이션 딜레이 (초) */
  animationDelay?: number;
  /** 레이블 표시 여부 */
  showLabels?: boolean;
  /** 축 배열 (커스텀 가능) */
  axes?: RadarAxisConfig[];
  /** 추가 클래스 */
  className?: string;
}

// 기본 축 설정
const DEFAULT_AXES: RadarAxisConfig[] = [
  { key: "emotionalBond", label: "정서적 유대" },
  { key: "functionalTrust", label: "기능적 신뢰" },
  { key: "valueAlignment", label: "가치관 일치" },
  { key: "interdependence", label: "상호 의존성" },
  { key: "latentTension", label: "잠재적 긴장" },
];

// 색상 팔레트 (Light Theme: Clear & Saturated)
const COLOR_PALETTE = {
  teal: {
    fill: "rgba(13, 148, 136, 0.2)", // Teal-500 low opacity
    stroke: "#0D9488", // Teal-600
    glow: "#5EEAD4", // Teal-300
    point: "#0F766E", // Teal-700
  },
  rose: {
    fill: "rgba(225, 29, 72, 0.2)", // Rose-600 low opacity
    stroke: "#E11D48", // Rose-600
    glow: "#FDA4AF", // Rose-300
    point: "#BE123C", // Rose-700
  },
  mocha: {
    // Replacing dull mocha with clear Indigo for contrast or keep warm but clearer orange/amber
    // Let's us Clear Indigo for 'Neutral/Other' to be distinct
    fill: "rgba(79, 70, 229, 0.2)", // Indigo-600
    stroke: "#4F46E5", // Indigo-600
    glow: "#A5B4FC", // Indigo-300
    point: "#4338CA", // Indigo-700
  },
};

/**
 * 극좌표를 직교좌표로 변환
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * 폴리곤 포인트 문자열 생성
 */
function generatePolygonPoints(
  values: number[],
  center: number,
  maxRadius: number,
  maxValue: number = 10,
): string {
  const angleStep = 360 / values.length;

  return values
    .map((value, i) => {
      const radius = (value / maxValue) * maxRadius;
      const point = polarToCartesian(center, center, radius, i * angleStep);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

export function RelationshipRadarChart({
  attributes,
  size = 200,
  color = "teal",
  animationDelay = 0,
  showLabels = true,
  axes = DEFAULT_AXES,
  className,
}: RelationshipRadarChartProps) {
  const gradientId = useId();
  const glowId = useId();

  const center = size / 2;
  const maxRadius = size * 0.4; // 40% of size for chart area
  const labelRadius = size * 0.48; // Labels slightly outside

  const colors = COLOR_PALETTE[color] || COLOR_PALETTE.teal;
  const numAxes = axes.length;
  const angleStep = 360 / numAxes;

  // 속성값 배열 추출
  const values = useMemo(
    () => axes.map((axis) => attributes?.[axis.key] ?? 0),
    [attributes, axes],
  );

  // 초기 상태 (중심점) 폴리곤
  const centerPoints = useMemo(
    () => generatePolygonPoints(new Array(numAxes).fill(0), center, maxRadius),
    [numAxes, center, maxRadius],
  );

  // 현재값 폴리곤
  const currentPoints = useMemo(
    () => generatePolygonPoints(values, center, maxRadius),
    [values, center, maxRadius],
  );

  // 그리드 레벨 (0, 2.5, 5, 7.5, 10)
  const gridLevels = [2.5, 5, 7.5, 10];

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Defs: Gradient & Glow Filter */}
        <defs>
          {/* Radial Gradient for fill */}
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0.1" />
          </radialGradient>

          {/* Glow Filter */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={colors.glow} floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid - Concentric Polygons */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={generatePolygonPoints(
              new Array(numAxes).fill(level),
              center,
              maxRadius,
            )}
            fill="none"
            stroke="rgba(0, 0, 0, 0.06)" // Light gray grid lines
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {axes.map((_, i) => {
          const endPoint = polarToCartesian(
            center,
            center,
            maxRadius,
            i * angleStep,
          );
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="rgba(0, 0, 0, 0.06)" // Light gray axis lines
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon - Animated */}
        <motion.polygon
          points={centerPoints}
          fill={`url(#${gradientId})`}
          stroke={colors.stroke}
          strokeWidth="2"
          filter={`url(#${glowId})`}
          initial={{ points: centerPoints }}
          animate={{ points: currentPoints }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: animationDelay,
          }}
        />

        {/* Data Points */}
        {values.map((value, i) => {
          const radius = (value / 10) * maxRadius;
          const point = polarToCartesian(center, center, radius, i * angleStep);

          return (
            <motion.circle
              key={i}
              cx={center}
              cy={center}
              r={3.5}
              fill={colors.stroke}
              stroke="white"
              strokeWidth="1.5"
              initial={{ cx: center, cy: center, opacity: 0 }}
              animate={{ cx: point.x, cy: point.y, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: animationDelay + 0.1,
              }}
            />
          );
        })}

        {/* Axis Labels */}
        {showLabels &&
          axes.map((axis, i) => {
            const point = polarToCartesian(
              center,
              center,
              labelRadius,
              i * angleStep,
            );

            // 텍스트 정렬 결정
            const isLeft = point.x < center - 10;
            const isRight = point.x > center + 10;
            const textAnchor = isLeft ? "end" : isRight ? "start" : "middle";

            return (
              <text
                key={axis.key}
                x={point.x}
                y={point.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-espresso-500 text-[10px] font-semibold"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {axis.label}
              </text>
            );
          })}

        {/* Value Labels (on hover or always) */}
        {values.map((value, i) => {
          const radius = (value / 10) * maxRadius + 12;
          const point = polarToCartesian(center, center, radius, i * angleStep);

          return (
            <motion.text
              key={`val-${i}`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-espresso-900 text-[9px] font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: animationDelay + 0.5 }}
            >
              {value.toFixed(1)}
            </motion.text>
          );
        })}
      </svg>
    </div>
  );
}

export default RelationshipRadarChart;
