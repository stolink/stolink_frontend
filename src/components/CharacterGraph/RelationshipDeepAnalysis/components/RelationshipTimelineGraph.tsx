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

  // 중요도 기반 필터링 (데이터가 적으면 기준 완화)
  const keyEvents = useMemo(() => {
    // 1. High importance
    const high = data.filter((d) => d.importance >= 8);
    if (high.length > 0) return high;

    // 2. Medium importance
    const medium = data.filter((d) => d.importance >= 5);
    if (medium.length > 0) return medium;

    // 3. Low importance (show all but limit to fit graph nicely if too many, e.g. top 10 by importance)
    // If very few, just show all.
    return [...data].sort((a, b) => b.importance - a.importance).slice(0, 10);
  }, [data]);

  // 스케일 계산
  const scales = useMemo(() => {
    if (keyEvents.length === 0 || innerWidth <= 0) {
      return {
        x: d3
          .scaleLinear()
          .domain([0, 1])
          .range([0, Math.max(1, innerWidth)]),
        y: d3.scaleLinear().domain([-100, 100]).range([innerHeight, 0]),
      };
    }

    // X축: 인덱스 기반 (균등 배치)
    const x = d3
      .scaleLinear()
      .domain([0, keyEvents.length - 1])
      .range([0, innerWidth]);

    // Y축: 정규화된 지수 스케일 (-100 ~ 100)
    const y = d3.scaleLinear().domain([-105, 105]).range([innerHeight, 0]);

    return { x, y };
  }, [keyEvents.length, innerWidth, innerHeight]);

  // 라인 생성기 (Cubic Spline)
  const lineGenerator = useMemo(
    () =>
      d3
        .line<{ val: number; idx: number }>()
        .x((d) => scales.x(d.idx))
        .y((d) => scales.y(d.val))
        .curve(d3.curveCatmullRom.alpha(0.5)),
    [scales],
  );

  // 통합 유대 곡선 경로 생성
  const sentimentPath = useMemo(() => {
    const points = keyEvents.map((d, i) => ({
      val: d.sentimentTrajectory,
      idx: i,
    }));
    return lineGenerator(points) ?? "";
  }, [lineGenerator, keyEvents]);

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
            {/* Unified Sentiment Gradient (Dynamic vertical gradient) */}
            <linearGradient
              id="sentiment-gradient"
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor={HOSTILE_COLOR} />
              <stop offset="45%" stopColor={HOSTILE_COLOR} />
              <stop offset="50%" stopColor="#94a3b8" /> {/* Neutral Gray */}
              <stop offset="55%" stopColor={FRIENDLY_COLOR} />
              <stop offset="100%" stopColor={FRIENDLY_COLOR} />
            </linearGradient>

            {/* Glow Filter for the trajectory */}
            <filter
              id="sentiment-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="white" floodOpacity="0.2" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid Lines & Labels */}
            {[-100, -50, 0, 50, 100].map((tick) => (
              <g key={tick} transform={`translate(0, ${scales.y(tick)})`}>
                <line
                  x1={0}
                  x2={innerWidth}
                  stroke={
                    tick === 0 ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.08)"
                  }
                  strokeDasharray={tick === 0 ? "none" : "4 4"}
                />
                <text
                  x={-8}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className={cn(
                    "text-[10px] font-bold",
                    tick > 0
                      ? "fill-teal-600"
                      : tick < 0
                        ? "fill-rose-600"
                        : "fill-espresso-400",
                  )}
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              </g>
            ))}

            {/* Neutal Zone Indicator */}
            <rect
              x={0}
              y={scales.y(10)}
              width={innerWidth}
              height={scales.y(-10) - scales.y(10)}
              fill="rgba(0, 0, 0, 0.02)"
              pointerEvents="none"
            />

            {/* X Axis & Labels */}
            <g transform={`translate(0, ${innerHeight})`}>
              <line x1={0} x2={innerWidth} stroke="rgba(0, 0, 0, 0.1)" />
              {keyEvents.map((d, i) => {
                const shouldShowLabel =
                  keyEvents.length < 10 ||
                  i === 0 ||
                  i === keyEvents.length - 1 ||
                  i % Math.ceil(keyEvents.length / 5) === 0;

                return (
                  <g key={d.eventId} transform={`translate(${scales.x(i)}, 0)`}>
                    <line y1={0} y2={6} stroke="rgba(0, 0, 0, 0.15)" />
                    {shouldShowLabel && (
                      <text
                        y={18}
                        textAnchor="middle"
                        className="fill-espresso-400 text-[10px] font-medium"
                      >
                        Ch.{d.chapter}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Y Axis Section Labels */}
            <text
              transform={`translate(-40, ${scales.y(75)}) rotate(-90)`}
              textAnchor="middle"
              className="fill-teal-600 text-[9px] font-bold uppercase tracking-widest opacity-60"
            >
              우호 (Ally)
            </text>
            <text
              transform={`translate(-40, ${scales.y(-75)}) rotate(-90)`}
              textAnchor="middle"
              className="fill-rose-600 text-[9px] font-bold uppercase tracking-widest opacity-60"
            >
              적대 (Hostile)
            </text>

            {/* Unified Sentiment Path */}
            <motion.path
              d={sentimentPath}
              fill="none"
              stroke="url(#sentiment-gradient)"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#sentiment-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isAnimated ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Data Points on the path */}
            {keyEvents.map((d, i) => {
              const val = d.sentimentTrajectory;
              const pointColor =
                val > 0.01
                  ? FRIENDLY_COLOR
                  : val < -0.01
                    ? HOSTILE_COLOR
                    : "#64748b"; // Neutral slate-500

              return (
                <motion.circle
                  key={d.eventId}
                  cx={scales.x(i)}
                  cy={scales.y(val)}
                  r={4.5}
                  fill={pointColor}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer shadow-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isAnimated ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.5 }}
                  onMouseEnter={(e) => handlePointHover(d, e)}
                  onMouseLeave={() => handlePointHover(null)}
                />
              );
            })}

            {/* Legend */}
            <g transform={`translate(${innerWidth / 2 - 60}, -15)`}>
              <rect
                x={-5}
                y={-8}
                width={130}
                height={16}
                rx={8}
                fill="rgba(0,0,0,0.03)"
              />
              <text
                x={60}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-espresso-600 text-[10px] font-bold tracking-tight"
              >
                나레이티브 본드 (Narrative Bond)
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
            left: tooltip.x + 340 > width ? tooltip.x - 335 : tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div className="bg-white/98 backdrop-blur-md border border-cloud-200 rounded-lg p-4 shadow-2xl w-[320px]">
            <div className="flex justify-between items-start mb-1.5">
              <span
                className="text-espresso-400 text-[10px] uppercase font-bold tracking-tighter"
                title={tooltip.point.title}
              >
                Ch.{tooltip.point.chapter} | {tooltip.point.title.slice(0, 15)}
                {tooltip.point.title.length > 15 ? "..." : ""}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold",
                  tooltip.point.sentimentTrajectory > 10
                    ? "bg-teal-50 text-teal-700"
                    : tooltip.point.sentimentTrajectory < -10
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-50 text-slate-600",
                )}
              >
                {tooltip.point.sentimentTrajectory > 0.01 ? "+" : ""}
                {Math.abs(tooltip.point.sentimentTrajectory) < 0.01
                  ? "0"
                  : tooltip.point.sentimentTrajectory.toFixed(0)}
              </span>
            </div>

            <div className="text-espresso-800 text-xs mb-2 leading-relaxed line-clamp-3">
              {tooltip.point.description}
            </div>

            <div className="pt-2 border-t border-cloud-100 flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-espresso-400">사건 극성</span>
                <span
                  className={cn(
                    "font-bold",
                    tooltip.point.emotionalPolarity > 0
                      ? "text-teal-600"
                      : "text-rose-600",
                  )}
                >
                  {tooltip.point.emotionalPolarity > 0
                    ? "Positive"
                    : "Negative"}{" "}
                  ({tooltip.point.emotionalPolarity > 0 ? "+" : ""}
                  {tooltip.point.emotionalPolarity})
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-espresso-400">사건 중요도</span>
                <span className="text-espresso-700 font-bold">
                  {tooltip.point.importance}/10
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default RelationshipTimelineGraph;
