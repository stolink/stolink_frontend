import type { CharacterNode } from "@/types";
import type { NodeRenderOptions } from "./types";
import {
  NODE_SIZES,
  ROLE_COLORS,
  ANIMATION,
  STATUS_CONFIG,
  getFactionColor,
} from "../constants";
import { getInitial, truncateName, ROLE_GRADIENTS } from "../utils";

/**
 * Canvas에 노드를 렌더링하는 함수
 * NodeRenderer.tsx의 모든 시각적 요소를 Canvas API로 구현
 */
export function drawNode(options: NodeRenderOptions): void {
  const {
    ctx,
    node,
    globalScale,
    state,
    imageCache,
    changeType,
    showLogicCheck = false,
  } = options;

  if (node.x === undefined || node.y === undefined) return;

  const { isSelected, isHighlighted, isDimmed } = state;
  const isProtagonist = node.role === "protagonist";
  const isImportant = isProtagonist;

  // 1. 크기 계산
  const baseSize = isProtagonist ? NODE_SIZES.protagonist : NODE_SIZES.default;
  const importanceFactor = isProtagonist ? 2.5 : 1.5;
  const dynamicBonus = (node.relationCount || 0) * importanceFactor;
  const finalSize = Math.min(baseSize + dynamicBonus, 180);
  const radius = finalSize / 2;
  const roleColor = ROLE_COLORS[node.role || "other"];

  const isIsolated = (node.relationCount || 0) === 0;

  // 투명도 설정
  const opacity = isDimmed ? ANIMATION.dimOpacity : ANIMATION.normalOpacity;
  ctx.globalAlpha = opacity;

  // 2. 글로우/펄스 효과 (중요 인물/선택/하이라이트)
  if (isImportant || isSelected || isHighlighted) {
    ctx.fillStyle = isSelected ? "#5F7D5F" : roleColor;
    ctx.globalAlpha = isImportant ? 0.15 : 0.12;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (isImportant ? 16 : 12), 0, Math.PI * 2);
    ctx.fill();

    // 펄스 링 (외곽)
    if (isHighlighted || isImportant) {
      ctx.strokeStyle = roleColor;
      ctx.lineWidth = isImportant ? 3 : 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isImportant ? 8 : 4), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 투명도 복원
  ctx.globalAlpha = opacity;

  // 3. 선택 링
  if (isSelected) {
    ctx.strokeStyle = "#5F7D5F";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = opacity;
  }

  // 4. 그림자 (중요 인물만)
  if (isImportant) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.arc(node.x + 1, node.y + 2, radius + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Faction 테두리 링 (진영 식별)
  if (node.group && node.group !== "무소속") {
    const factionColor = getFactionColor(node.group);
    ctx.strokeStyle = factionColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = isDimmed ? 0.3 : 0.85;
    ctx.setLineDash(isProtagonist ? [] : [6, 3]);
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
    ctx.globalAlpha = opacity;
  }

  // 6. 메인 원
  ctx.strokeStyle = roleColor;
  ctx.lineWidth = isProtagonist ? 4 : 2;
  ctx.fillStyle = isImportant ? "#F5F5F4" : "#F5F5F4";
  ctx.setLineDash(isIsolated ? [4, 4] : []);
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // 7. 고립된 노드 경고 링
  if (isIsolated) {
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = opacity;
  }

  // 8. 아바타: 이미지 또는 이니셜 기반
  const img = imageCache.get(node.imageUrl || "");
  if (img && img.complete) {
    // 이미지 있음: 원형 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius - 3, 0, Math.PI * 2);
    ctx.clip();

    // 필터 제거 - 성능 최적화 (ctx.filter는 매우 비싼 연산)
    // isDimmed 상태는 globalAlpha로만 처리

    ctx.drawImage(
      img,
      node.x - (radius - 3),
      node.y - (radius - 3),
      (radius - 3) * 2,
      (radius - 3) * 2,
    );

    ctx.restore();
  } else {
    // 이미지 없음: 이니셜 기반 아바타 - 역할별 그라데이션
    const initial = getInitial(node.name);
    const gradient =
      ROLE_GRADIENTS[node.role || "other"] || ROLE_GRADIENTS.other;

    // 그라데이션 원
    const grad = ctx.createLinearGradient(
      node.x - radius,
      node.y - radius,
      node.x + radius,
      node.y + radius,
    );
    grad.addColorStop(0, gradient.from);
    grad.addColorStop(1, gradient.to);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 이니셜 텍스트
    ctx.save();
    ctx.font = `bold ${isImportant ? radius * 0.8 : radius * 0.7}px "Playfair Display", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Halo Effect for Initials (Optional, but good for consistency)
    ctx.strokeStyle = "#FDFDFB";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.strokeText(initial, node.x, node.y);

    ctx.fillStyle = "white";
    ctx.fillText(initial, node.x, node.y);
    ctx.restore();
  }

  // 9. 상태 배지 OR 변경 배지
  drawBadges(ctx, node, radius, state, changeType, showLogicCheck);

  // 10. 이름 라벨 - 줌 반응형
  const showLabel = globalScale > 0.35;
  if (showLabel) {
    const displayName = truncateName(node.name, isImportant ? 12 : 8);

    ctx.save();
    // Dimming removed for text (User Feedback): Always clear visibility
    // Force 100% opacity regardless of zoom level
    ctx.globalAlpha = 1;

    // Typography: Serif with Premium Feel
    // Switched to Playfair Display for true 900 weight support
    // Increased size by +4px per request (was +20, now +24)
    const fontSize = Math.max(16, radius * 0.38 + 5);
    ctx.font = `900 ${fontSize + 24}px "Playfair Display", "DM Serif Display", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const textX = node.x;
    const textY = node.y + radius + (isImportant ? 20 : 12);

    // 1. Halo Effect (Warm White Stroke for separation)
    ctx.strokeStyle = "#FDFDFB";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round"; // Smooth corners
    ctx.miterLimit = 2;
    ctx.strokeText(displayName, textX, textY);

    // 2. Drop Shadow (Floating Effect)
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.shadowOffsetX = 0;

    // 3. Solid Color Fill (Max Contrast, no gradient)
    ctx.fillStyle = "#2A211D"; // Espresso 950 (Very Dark) for max readability
    // ctx.fillStyle = gradient; // Replaced with solid color per user request

    ctx.fillText(displayName, textX, textY);
    ctx.restore();
    ctx.restore();
  }

  // 투명도 복원
  ctx.globalAlpha = 1;
}

/**
 * 배지 렌더링 헬퍼 함수
 */
function drawBadges(
  ctx: CanvasRenderingContext2D,
  node: CharacterNode,
  radius: number,
  _state: { isDimmed: boolean },
  changeType?: "new" | "updated" | null,
  showLogicCheck?: boolean,
): void {
  if (node.x === undefined || node.y === undefined) return;

  // 1. Change Indicator (Priority over status) - Premium Badge
  if (changeType) {
    const isNew = changeType === "new";
    const badgeRadius = Math.max(16, radius * 0.42);
    const badgeX = node.x + radius * 0.72;
    const badgeY = node.y - radius * 0.72;

    const gradientColors = isNew
      ? { from: "#10B981", to: "#059669", glow: "rgba(16, 185, 129, 0.4)" }
      : { from: "#3B82F6", to: "#2563EB", glow: "rgba(59, 130, 246, 0.4)" };

    // 글로우 링 (애니메이션은 Canvas에서 불가하므로 정적)
    ctx.strokeStyle = gradientColors.from;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 배경 (그라데이션)
    const grad = ctx.createLinearGradient(
      badgeX - badgeRadius,
      badgeY - badgeRadius,
      badgeX + badgeRadius,
      badgeY + badgeRadius,
    );
    grad.addColorStop(0, gradientColors.from);
    grad.addColorStop(1, gradientColors.to);

    // 흰색 테두리 링
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius + 3, 0, Math.PI * 2);
    ctx.fill();

    // 메인 배지
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // 아이콘
    ctx.fillStyle = "white";
    if (isNew) {
      // Plus icon
      ctx.fillRect(
        badgeX - badgeRadius * 0.5,
        badgeY - badgeRadius * 0.12,
        badgeRadius,
        badgeRadius * 0.24,
      );
      ctx.fillRect(
        badgeX - badgeRadius * 0.12,
        badgeY - badgeRadius * 0.5,
        badgeRadius * 0.24,
        badgeRadius,
      );
    } else {
      // Check icon
      ctx.save();
      ctx.strokeStyle = "white";
      ctx.lineWidth = badgeRadius * 0.22;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(badgeX - badgeRadius * 0.4, badgeY + badgeRadius * 0.05);
      ctx.lineTo(badgeX - badgeRadius * 0.1, badgeY + badgeRadius * 0.35);
      ctx.lineTo(badgeX + badgeRadius * 0.45, badgeY - badgeRadius * 0.3);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  // 2. Existing Status Badge
  if (
    node.status &&
    node.status !== "active" &&
    node.status !== "alive" &&
    node.status !== "생존"
  ) {
    const statusConfig = STATUS_CONFIG[node.status] || STATUS_CONFIG.unknown;
    const badgeRadius = Math.max(13, radius * 0.35);
    const badgeX = node.x + radius * 0.65;
    const badgeY = node.y + radius * 0.65;

    // 배경 - 원형
    ctx.fillStyle = "white";
    ctx.strokeStyle = statusConfig.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = statusConfig.color;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // 아이콘
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = `${badgeRadius * 1.1 + 3}px "Pretendard"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(statusConfig.icon, badgeX, badgeY);
    ctx.restore();
    return;
  }

  // 3. Logic Check Warning Badge
  if (showLogicCheck && node.status === "contradictory") {
    const badgeRadius = Math.max(13, radius * 0.35);
    const badgeX = node.x - radius * 0.65;
    const badgeY = node.y - radius * 0.65;

    ctx.fillStyle = "white";
    ctx.strokeStyle = "#C49545";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#C49545";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = `${badgeRadius * 1.1 + 3}px "Pretendard"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚠️", badgeX, badgeY);
    ctx.restore();
  }
}
