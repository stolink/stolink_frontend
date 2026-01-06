/**
 * 수묵화 스타일 나무 생성 알고리즘
 * - 수평 트렁크 (왼쪽→오른쪽, 시간축)
 * - 위/아래로 뻗는 가지
 * - 사건 수에 따라 동적 확장
 */
import { useMemo } from "react";
import type {
  BiographyEvent,
  TreeConfig,
  Branch,
  TreeStructure,
} from "@/types/biography";
import { getImportanceLevel } from "@/types/biography";
import { DEFAULT_TREE_CONFIG } from "./constants";

/** 시드 기반 의사 난수 생성기 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * 수평 트렁크 생성 (naturalTaper, 뾰족한 끝)
 */
function generateHorizontalTrunk(
  startX: number,
  centerY: number,
  endX: number,
  random: () => number,
): { path: string; getYAtX: (x: number) => { top: number; bottom: number } } {
  const length = endX - startX;
  const segments = 50;
  const topPoints: [number, number][] = [];
  const bottomPoints: [number, number][] = [];

  // Y 좌표 계산 함수 (나중에 가지 연결에 사용)
  const trunkProfile: { x: number; top: number; bottom: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + t * length;

    // 테이퍼: 시작 55px -> 끝 0 (뾰족하게)
    const taper = Math.pow(1 - t, 0.65);
    const baseThickness = 55 * taper;

    // 자연스러운 굴곡
    const wave = Math.sin(t * Math.PI * 1.2) * 8 * taper;
    const noise = (random() - 0.5) * 4 * taper;

    const yTop = centerY - baseThickness + wave + noise;
    const yBottom = centerY + baseThickness * 1.15 + wave - noise;

    topPoints.push([x, yTop]);
    bottomPoints.push([x, yBottom]);
    trunkProfile.push({ x, top: yTop, bottom: yBottom });
  }

  // Path 생성 (부드러운 곡선)
  let path = `M ${topPoints[0][0]} ${topPoints[0][1]}`;

  // 상단 라인
  for (let i = 1; i < topPoints.length; i++) {
    path += ` L ${topPoints[i][0]} ${topPoints[i][1]}`;
  }

  // 끝점 (뾰족하게)
  const lastTop = topPoints[topPoints.length - 1];
  const lastBottom = bottomPoints[bottomPoints.length - 1];
  path += ` L ${(lastTop[0] + lastBottom[0]) / 2} ${(lastTop[1] + lastBottom[1]) / 2}`;

  // 하단 라인 (역순)
  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    path += ` L ${bottomPoints[i][0]} ${bottomPoints[i][1]}`;
  }

  path += " Z";

  // 특정 X 좌표에서의 Y 값 반환 함수
  const getYAtX = (x: number) => {
    const idx = trunkProfile.findIndex((p) => p.x >= x);
    if (idx <= 0)
      return { top: trunkProfile[0].top, bottom: trunkProfile[0].bottom };
    if (idx >= trunkProfile.length) {
      const last = trunkProfile[trunkProfile.length - 1];
      return { top: last.top, bottom: last.bottom };
    }

    const p1 = trunkProfile[idx - 1];
    const p2 = trunkProfile[idx];
    const ratio = (x - p1.x) / (p2.x - p1.x);

    return {
      top: p1.top + ratio * (p2.top - p1.top),
      bottom: p1.bottom + ratio * (p2.bottom - p1.bottom),
    };
  };

  return { path, getYAtX };
}

/**
 * 테이퍼 가지 생성 (닫힌 도형)
 */
function generateTaperedBranch(
  startX: number,
  startY: number,
  length: number,
  angle: number, // degrees, 0 = 오른쪽, 90 = 위
  startThickness: number,
  endThickness: number,
  random: () => number,
): { path: string; tipX: number; tipY: number } {
  const segments = 10;
  const angleRad = (angle * Math.PI) / 180;

  // 방향 벡터
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // 수직 벡터
  const nx = -dy;
  const ny = dx;

  const topPoints: [number, number][] = [];
  const bottomPoints: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    // 자연스러운 휘어짐
    const bend = Math.sin(t * Math.PI) * 12 * (angle > 0 ? 1 : -1) * 0.3;
    const x = startX + t * length * dx + bend * nx;
    const y = startY + t * length * dy + bend * ny;

    // 테이퍼
    const thickness = startThickness * Math.pow(1 - t, 0.5) + endThickness * t;
    const noise = (random() - 0.5) * 1.5 * (1 - t);

    topPoints.push([
      x + nx * (thickness + noise),
      y + ny * (thickness + noise),
    ]);
    bottomPoints.push([
      x - nx * (thickness + noise),
      y - ny * (thickness + noise),
    ]);
  }

  // Path 생성
  let path = `M ${topPoints[0][0]} ${topPoints[0][1]}`;
  for (let i = 1; i < topPoints.length; i++) {
    path += ` L ${topPoints[i][0]} ${topPoints[i][1]}`;
  }
  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    path += ` L ${bottomPoints[i][0]} ${bottomPoints[i][1]}`;
  }
  path += " Z";

  // 끝점 (노드 배치용)
  const tipX = startX + length * dx;
  const tipY = startY + length * dy;

  return { path, tipX, tipY };
}

/** prevEventId 기반 정렬 */
function sortEventsByPrevId(events: BiographyEvent[]): BiographyEvent[] {
  if (events.length === 0) return [];

  const firstEvent = events.find((e) => e.prevEventId === null);
  if (!firstEvent) {
    return [...events].sort((a, b) => a.eventId.localeCompare(b.eventId));
  }

  const sorted: BiographyEvent[] = [firstEvent];
  const usedIds = new Set<string>([firstEvent.eventId]);

  let current = firstEvent;
  while (sorted.length < events.length) {
    const next = events.find(
      (e) => e.prevEventId === current.eventId && !usedIds.has(e.eventId),
    );
    if (!next) break;
    sorted.push(next);
    usedIds.add(next.eventId);
    current = next;
  }

  events.forEach((e) => {
    if (!usedIds.has(e.eventId)) sorted.push(e);
  });

  return sorted;
}

interface UseBiographyTreeOptions {
  config?: Partial<TreeConfig>;
  seed?: number;
}

/**
 * 나무 구조 생성 훅
 */
export function useBiographyTree(
  events: BiographyEvent[],
  options: UseBiographyTreeOptions = {},
): TreeStructure {
  const seed =
    options.seed ??
    events.reduce((acc, e) => acc + e.eventId.charCodeAt(0), 12345);

  const configWidth =
    options.config?.containerWidth ?? DEFAULT_TREE_CONFIG.containerWidth;
  const configHeight =
    options.config?.containerHeight ?? DEFAULT_TREE_CONFIG.containerHeight;
  const configTrunkStartX =
    options.config?.trunkStartX ?? DEFAULT_TREE_CONFIG.trunkStartX;

  return useMemo(() => {
    const random = seededRandom(seed);
    const centerY = configHeight / 2;

    // 이벤트 수에 따라 컨테이너 너비 동적 조정
    const eventSpacing = 120; // 각 이벤트 간 간격
    const minWidth = configWidth;
    const dynamicWidth = Math.max(minWidth, events.length * eventSpacing + 300);

    if (events.length === 0) {
      return {
        trunk: {
          path: "",
          startX: configTrunkStartX,
          startY: centerY,
          endX: configTrunkStartX,
        },
        branches: [],
        dynamicWidth: minWidth,
      } as TreeStructure & { dynamicWidth: number };
    }

    // 이벤트 정렬
    const sortedEvents = sortEventsByPrevId(events);

    // 트렁크 생성
    const trunkEndX = configTrunkStartX + dynamicWidth - 150;
    const trunk = generateHorizontalTrunk(
      configTrunkStartX,
      centerY,
      trunkEndX,
      random,
    );

    // 가지 생성 (각 이벤트마다 하나)
    const branches: Branch[] = [];

    sortedEvents.forEach((event, index) => {
      const isMajor = getImportanceLevel(event.importance) === "major";

      // X 위치: 시간순 균등 배치
      const progressRatio = (index + 1) / (sortedEvents.length + 1);
      const branchX =
        configTrunkStartX +
        80 +
        progressRatio * (trunkEndX - configTrunkStartX - 100);

      // 트렁크 표면 Y
      const trunkY = trunk.getYAtX(branchX);
      const isAbove = index % 2 === 0;
      const startY = isAbove ? trunkY.top : trunkY.bottom;

      // 가지 길이와 각도
      const branchLength = 80 + (isMajor ? 25 : 0) + random() * 30;
      const baseAngle = isAbove ? -70 : 70; // 위/아래 방향
      const angleVariation = (random() - 0.5) * 30;
      const branchAngle = baseAngle + angleVariation;

      // 가지 두께
      const startThickness = isMajor ? 10 : 7;
      const endThickness = 1;

      const branch = generateTaperedBranch(
        branchX,
        startY,
        branchLength,
        branchAngle,
        startThickness,
        endThickness,
        random,
      );

      // 노드 위치
      const nodeX = branch.tipX;
      const nodeY = branch.tipY;

      branches.push({
        id: `branch-${event.eventId}`,
        path: branch.path,
        startX: branchX,
        startY: startY,
        endX: nodeX,
        endY: nodeY,
        thickness: startThickness,
        node: {
          id: event.eventId,
          event,
          x: nodeX,
          y: nodeY,
          angle: branchAngle,
          depth: 0,
        },
      });
    });

    return {
      trunk: {
        path: trunk.path,
        startX: configTrunkStartX,
        startY: centerY,
        endX: trunkEndX,
      },
      branches,
      dynamicWidth,
    } as TreeStructure & { dynamicWidth: number };
  }, [events, seed, configWidth, configHeight, configTrunkStartX]);
}
