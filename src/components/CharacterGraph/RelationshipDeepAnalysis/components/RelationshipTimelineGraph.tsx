// =====================================================
// 📈 Relationship Timeline Graph Component (Responsive)
// D3.js 기반 Dual-Axis 타임라인 그래프
// =====================================================

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import type { RelationshipTimelinePoint } from "@/types/relationshipAnalysis";
import { cn } from "@/lib/utils";

interface RelationshipTimelineGraphProps {
  /** 타임라인 데이터 */
  data: RelationshipTimelinePoint[];
  /** 높이 (너비는 부모 컨테이너에 맞춤) */
  height?: number;
  /** 애니메이션 딜레이 (초) */
  animationDelay?: number;
  /** 추가 클래스 */
  className?: string;
}

interface TooltipData {
  point: RelationshipTimelinePoint;
  x: number;
  y: number;
}

// 색상 상수
const FRIENDLY_COLOR = "#0D9488"; // Teal-600
const HOSTILE_COLOR = "#E11D48"; // Rose-600

export function RelationshipTimelineGraph({
  data,
  height = 200,
  animationDelay = 0,
  className,
}: RelationshipTimelineGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Resize Observer for Responsive Width
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          setWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 마진 설정
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // 중요도 8 이상만 필터링
  const keyEvents = useMemo(
    () => data.filter((d) => d.importance >= 8),
    [data],
  );

  // 스케일 계산
  const scales = useMemo(() => {
    if (keyEvents.length === 0 || innerWidth <= 0) {
      return {
        x: d3
          .scaleLinear()
          .domain([0, 1])
          .range([0, Math.max(1, innerWidth)]),
        y: d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]),
      };
    }

    // X축: 챕터 기반
    const xDomain = d3.extent(keyEvents, (d) => d.chapter) as [number, number];
    const x = d3
      .scaleLinear()
      .domain([xDomain[0] - 0.5, xDomain[1] + 0.5])
      .range([0, innerWidth]);

    // Y축: 누적 점수 (우호/적대 중 최대값 기준)
    const maxFriendly = d3.max(keyEvents, (d) => d.cumulativeFriendly) ?? 100;
    const maxHostile = d3.max(keyEvents, (d) => d.cumulativeHostile) ?? 100;
    const yMax = Math.max(maxFriendly, maxHostile) * 1.1;
    const y = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    return { x, y };
  }, [keyEvents, innerWidth, innerHeight]);

  // 라인 생성기 (Cubic Spline)
  const lineGenerator = useMemo(
    () =>
      d3
        .line<RelationshipTimelinePoint>()
        .x((d) => scales.x(d.chapter))
        .curve(d3.curveCatmullRom.alpha(0.5)),
    [scales],
  );

  // 우호/적대 라인 경로
  const friendlyPath = useMemo(
    () =>
      lineGenerator.y((d) => scales.y(d.cumulativeFriendly))(keyEvents) ?? "",
    [lineGenerator, scales, keyEvents],
  );

  const hostilePath = useMemo(
    () =>
      lineGenerator.y((d) => scales.y(d.cumulativeHostile))(keyEvents) ?? "",
    [lineGenerator, scales, keyEvents],
  );

  // 포인트 호버 핸들러
  const handlePointHover = useCallback(
    (point: RelationshipTimelinePoint | null, event?: React.MouseEvent) => {
      if (point && event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          point,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      } else {
        setTooltip(null);
      }
    },
    [],
  );

  // 애니메이션 트리거
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, animationDelay * 1000);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  if (keyEvents.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center text-espresso-400 text-base w-full",
          className,
        )}
        style={{ height }}
      >
        분석할 주요 이벤트가 없습니다
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {width > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            {/* Friendly Line Gradient */}
            <linearGradient
              id="friendly-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={FRIENDLY_COLOR} stopOpacity="0.3" />
              <stop offset="50%" stopColor={FRIENDLY_COLOR} stopOpacity="1" />
              <stop
                offset="100%"
                stopColor={FRIENDLY_COLOR}
                stopOpacity="0.3"
              />
            </linearGradient>

            {/* Hostile Line Gradient */}
            <linearGradient
              id="hostile-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={HOSTILE_COLOR} stopOpacity="0.3" />
              <stop offset="50%" stopColor={HOSTILE_COLOR} stopOpacity="1" />
              <stop offset="100%" stopColor={HOSTILE_COLOR} stopOpacity="0.3" />
            </linearGradient>

            {/* Glow Filters */}
            <filter
              id="friendly-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={FRIENDLY_COLOR} floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter
              id="hostile-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={HOSTILE_COLOR} floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid Lines */}
            {scales.y.ticks(5).map((tick) => (
              <g key={tick} transform={`translate(0, ${scales.y(tick)})`}>
                <line
                  x1={0}
                  x2={innerWidth}
                  stroke="rgba(0, 0, 0, 0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={-8}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-espresso-400 text-xs"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}

            {/* X Axis */}
            <g transform={`translate(0, ${innerHeight})`}>
              <line x1={0} x2={innerWidth} stroke="rgba(0, 0, 0, 0.1)" />
              {keyEvents.map((d) => (
                <g
                  key={d.eventId}
                  transform={`translate(${scales.x(d.chapter)}, 0)`}
                >
                  <line y1={0} y2={6} stroke="rgba(0, 0, 0, 0.15)" />
                  <text
                    y={18}
                    textAnchor="middle"
                    className="fill-espresso-400 text-xs"
                  >
                    Ch.{d.chapter}
                  </text>
                </g>
              ))}
            </g>

            {/* Y Axis Label */}
            <text
              transform={`translate(-35, ${innerHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              className="fill-espresso-400 text-xs"
            >
              누적 지수
            </text>

            {/* Friendly Line */}
            <motion.path
              d={friendlyPath}
              fill="none"
              stroke="url(#friendly-gradient)"
              strokeWidth={3}
              filter="url(#friendly-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isAnimated ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Hostile Line */}
            <motion.path
              d={hostilePath}
              fill="none"
              stroke="url(#hostile-gradient)"
              strokeWidth={3}
              strokeDasharray="8 4"
              filter="url(#hostile-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isAnimated ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            />

            {/* Data Points - Friendly */}
            {keyEvents.map((d, i) => (
              <motion.circle
                key={`friendly-${d.eventId}`}
                cx={scales.x(d.chapter)}
                cy={scales.y(d.cumulativeFriendly)}
                r={5}
                fill={FRIENDLY_COLOR}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={isAnimated ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.3 }}
                onMouseEnter={(e) => handlePointHover(d, e)}
                onMouseLeave={() => handlePointHover(null)}
              />
            ))}

            {/* Data Points - Hostile */}
            {keyEvents.map((d, i) => (
              <motion.circle
                key={`hostile-${d.eventId}`}
                cx={scales.x(d.chapter)}
                cy={scales.y(d.cumulativeHostile)}
                r={5}
                fill={HOSTILE_COLOR}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={isAnimated ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.3 }}
                onMouseEnter={(e) => handlePointHover(d, e)}
                onMouseLeave={() => handlePointHover(null)}
              />
            ))}

            {/* Legend */}
            <g transform={`translate(${innerWidth - 100}, -10)`}>
              <circle cx={0} cy={0} r={5} fill={FRIENDLY_COLOR} />
              <text
                x={10}
                y={0}
                dominantBaseline="middle"
                className="fill-espresso-500 text-xs"
              >
                우호
              </text>
              <circle cx={50} cy={0} r={5} fill={HOSTILE_COLOR} />
              <text
                x={60}
                y={0}
                dominantBaseline="middle"
                className="fill-espresso-500 text-xs"
              >
                적대
              </text>
            </g>
          </g>
        </svg>
      )}

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute pointer-events-none z-50"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm border border-cloud-200 rounded-lg p-3 shadow-xl max-w-[200px]">
            <div className="text-espresso-900 text-sm font-semibold mb-1">
              Ch.{tooltip.point.chapter}: {tooltip.point.title}
            </div>
            <div className="text-espresso-600 text-xs mb-2 line-clamp-2">
              {tooltip.point.description}
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-teal-600 font-medium">
                우호: {tooltip.point.cumulativeFriendly.toFixed(1)}
              </span>
              <span className="text-rose-600 font-medium">
                적대: {tooltip.point.cumulativeHostile.toFixed(1)}
              </span>
            </div>
            <div className="text-espresso-400 text-[10px] mt-1">
              중요도: {tooltip.point.importance}/10 | 극성:{" "}
              {tooltip.point.emotionalPolarity > 0 ? "+" : ""}
              {tooltip.point.emotionalPolarity}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default RelationshipTimelineGraph;
