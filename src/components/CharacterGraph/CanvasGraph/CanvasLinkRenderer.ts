import type { CharacterNode } from "@/types";
import type { LinkRenderOptions } from "./types";
import { getRelationshipColor, type UIRelationType } from "../utils";

/**
 * Canvas에 링크를 렌더링하는 함수
 * LinkRenderer.tsx의 7계층 렌더링 로직을 Canvas API로 구현
 */
export function drawLink(options: LinkRenderOptions): void {
  const {
    ctx,
    link,
    state,
    animationPhase,
    changeType,
    showTension = false,
    showLogicCheck = false,
  } = options;

  const source = link.source as CharacterNode;
  const target = link.target as CharacterNode;

  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return;
  }

  const { isHighlighted, isDimmed } = state;

  // Bezier 제어점 계산 (Universal Curvature)
  const curvature = link.curvature || 0;
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const controlX = midX - dy * curvature;
  const controlY = midY + dx * curvature;

  // 색상 로직
  const primaryColor = (() => {
    if (changeType === "inversion") return "#EF4444";
    if (changeType === "collapse") return "#9CA3AF";
    if (changeType === "new") return "#EAB308";
    if (changeType === "conflict") return "#F59E0B";
    if (changeType === "updated") return "#3B82F6";
    return getRelationshipColor(link.type as UIRelationType, link.strength);
  })();

  // 밝은 색 (흐름 애니메이션용)
  const secondaryColor = lightenColor(primaryColor, 120);

  // 점선 패턴
  const dashArray: number[] = (() => {
    if (changeType === "collapse") return [4, 6];
    if (changeType === "new") return [];
    if (link.type === "hostile") {
      return [6 + link.strength, 4 + (10 - link.strength) / 2];
    }
    return [];
  })();

  // 강도 기반 선 굵기
  const baseWidth = 1 + ((link.strength - 1) / 9) * 4;
  const activeBonus = isHighlighted ? 1.5 : 0;
  const strokeWidth = baseWidth + activeBonus;

  // 투명도
  const opacity = (() => {
    if (changeType === "collapse") return 0.3;
    if (isDimmed) return 0.08;
    if (isHighlighted) return 0.95;
    return 0.4 + (link.strength / 10) * 0.2;
  })();

  const isActive = isHighlighted && !isDimmed;
  const showFlow = changeType !== "collapse";

  // AI Insights Detection
  const isTense =
    showTension &&
    ((link.type as string) === "hostile" || (link.type as string) === "ENEMY") &&
    link.strength >= 7;

  const isContradictory = showLogicCheck && link.logicCheck?.isContradictory;

  // === Layer 2: 깊은 그림자 (입체감) ===
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = strokeWidth + 3;
  ctx.globalAlpha = opacity * 0.4;
  ctx.lineCap = "round";
  ctx.setLineDash(dashArray);
  ctx.beginPath();
  ctx.moveTo(source.x + 1, source.y + 2);
  ctx.quadraticCurveTo(controlX + 1, controlY + 2, target.x + 1, target.y + 2);
  ctx.stroke();
  ctx.restore();

  // === Layer 3: 부드러운 외부 글로우 ===
  if (!isDimmed && changeType !== "collapse") {
    ctx.save();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = strokeWidth + 6;
    ctx.globalAlpha = isActive ? 0.25 : 0.08;
    ctx.lineCap = "round";
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }

  // === Tension Heatmap Overlay (Red Glow) ===
  if (isTense && !isDimmed) {
    ctx.save();
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = strokeWidth + 10;
    ctx.globalAlpha = 0.4;
    ctx.lineCap = "round";
    ctx.shadowColor = "#EF4444";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }

  // === Logic Check Contradiction Overlay (Amber) ===
  if (isContradictory && !isDimmed) {
    ctx.save();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = strokeWidth + 4;
    ctx.globalAlpha = 0.9;
    ctx.lineCap = "round";
    ctx.setLineDash([4, 4]);
    ctx.shadowColor = "#F59E0B";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }

  // === Layer 4: Base Line (Solid) ===
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = strokeWidth;
  ctx.globalAlpha = isDimmed ? 0.1 : 0.6;
  ctx.lineCap = "round";
  ctx.setLineDash(dashArray);
  ctx.beginPath();
  ctx.moveTo(source.x, source.y);
  ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
  ctx.stroke();
  ctx.restore();

  // === Layer 5: Flow Overlay (Directionality) ===
  if (showFlow && !link.bidirectional && !isDimmed) {
    ctx.save();

    // 흐름 그라데이션 (animationPhase 기반)
    const gradient = ctx.createLinearGradient(
      source.x,
      source.y,
      target.x,
      target.y,
    );
    const pos = animationPhase;

    gradient.addColorStop(Math.max(0, pos - 0.25), "transparent");
    gradient.addColorStop(pos, secondaryColor);
    gradient.addColorStop(Math.min(1, pos + 0.25), "transparent");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = strokeWidth + (isActive ? 2 : 1);
    ctx.globalAlpha = isActive ? 1 : 0.9;
    ctx.lineCap = "round";
    ctx.setLineDash(dashArray);
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }

  // === Layer 6: 하이라이트 (상단 빛 반사) ===
  if (changeType !== "collapse") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = Math.max(0.8, strokeWidth * 0.3);
    ctx.globalAlpha = isDimmed ? 0.05 : isActive ? 0.5 : 0.2;
    ctx.lineCap = "round";
    ctx.setLineDash(dashArray);
    ctx.beginPath();
    ctx.moveTo(source.x - 0.3, source.y - 0.8);
    ctx.quadraticCurveTo(
      controlX - 0.3,
      controlY - 0.8,
      target.x - 0.3,
      target.y - 0.8,
    );
    ctx.stroke();
    ctx.restore();
  }

  // Reset
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * 색상을 밝게 만드는 헬퍼 함수
 */
function lightenColor(hex: string, amount: number): string {
  const cleanHex = hex.replace("#", "");
  const r = Math.min(255, parseInt(cleanHex.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(cleanHex.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(cleanHex.slice(4, 6), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}
