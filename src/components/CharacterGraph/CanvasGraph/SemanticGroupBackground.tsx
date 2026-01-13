import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { CharacterNode } from "@/types";
import { getFactionColor } from "../constants";

interface SemanticGroupBackgroundProps {
  nodes: CharacterNode[];
  zoomState: { x: number; y: number; scale: number };
  width: number;
  height: number;
}

/**
 * Faction별 군집 영역(Hull)을 배경에 그리는 컴포넌트
 * ForceGraph2D 뒤에 위치하여 은은한 네온 글로우 효과 제공
 */
export const SemanticGroupBackground: React.FC<
  SemanticGroupBackgroundProps
> = ({ nodes, zoomState, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 2. Transform Context (Match ForceGraph Zoom)
      ctx.save();
      ctx.translate(zoomState.x, zoomState.y);
      ctx.scale(zoomState.scale, zoomState.scale);

      // 3. Calculate Hulls per Faction
      const factionPoints = new Map<string, Array<[number, number]>>();

      nodes.forEach((node) => {
        if (
          !node.group ||
          node.group === "무소속" ||
          node.x === undefined ||
          node.y === undefined
        )
          return;

        const points = factionPoints.get(node.group) || [];
        points.push([node.x, node.y]);
        factionPoints.set(node.group, points);
      });

      // 4. Draw Cloud-like Backgrounds
      factionPoints.forEach((points, factionName) => {
        if (points.length < 2) return;

        // Convex Hull 계산
        const hull = d3.polygonHull(points);
        if (!hull) return;

        // Centroid 계산
        const centroid = d3.polygonCentroid(hull);
        if (!centroid) return;

        const [cx, cy] = centroid;
        const color = getFactionColor(factionName);

        // 점들과 중심 간 평균 거리 계산 (반지름)
        const avgRadius =
          points.reduce((sum, p) => {
            const dx = p[0] - cx;
            const dy = p[1] - cy;
            return sum + Math.sqrt(dx * dx + dy * dy);
          }, 0) / points.length;

        // 구름 효과: 여러 겹의 원형 그라데이션
        const cloudRadius = avgRadius + 150; // 패딩 추가

        // Layer 1: 가장 큰 희미한 구름 (최하단)
        ctx.save();
        const gradient1 = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          cloudRadius * 1.5,
        );
        gradient1.addColorStop(0, `${color}20`); // 약 12% 투명도
        gradient1.addColorStop(0.5, `${color}10`); // 약 6% 투명도
        gradient1.addColorStop(1, `${color}00`); // 완전 투명
        ctx.fillStyle = gradient1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, cloudRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Layer 2: 중간 구름
        ctx.save();
        const gradient2 = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          cloudRadius,
        );
        gradient2.addColorStop(0, `${color}30`); // 약 19% 투명도
        gradient2.addColorStop(0.6, `${color}15`); // 약 8% 투명도
        gradient2.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, cloudRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Layer 3: 코어 영역 (가장 진한 부분)
        ctx.save();
        const gradient3 = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          cloudRadius * 0.6,
        );
        gradient3.addColorStop(0, `${color}40`); // 약 25% 투명도
        gradient3.addColorStop(0.7, `${color}20`);
        gradient3.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient3;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, cloudRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Faction Label (큰 배경 텍스트 + 작은 선명한 텍스트)
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 배경 큰 텍스트 (워터마크 스타일)
        ctx.font = `bold 120px "Pretendard"`;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.08;
        ctx.fillText(factionName, cx, cy);

        // 선명한 작은 라벨
        ctx.font = `bold 28px "Pretendard"`;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.95;
        ctx.fillText(factionName, cx, cy);

        // 배경 박스 (선택 사항)
        ctx.globalAlpha = 0.3;
        const textWidth = ctx.measureText(factionName).width;
        ctx.fillStyle = color;
        ctx.fillRect(cx - textWidth / 2 - 10, cy - 20, textWidth + 20, 40);

        // 텍스트 다시 그리기 (배경 위)
        ctx.shadowBlur = 8;
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.fillText(factionName, cx, cy);

        ctx.restore();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, zoomState, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-0" // ForceGraph 뒤에 위치
    />
  );
};
