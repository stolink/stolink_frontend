// =====================================================
// 📈 Relationship Analysis Calculations
// 관계 분석 지수 계산 및 데이터 변환 로직
// =====================================================

import type { Event } from "@/types/event";
import type { CharacterRelation } from "@/types/character";
import type {
  RelationshipAttributes,
  RelationshipTimelinePoint,
  RelationshipInsights,
  RelationshipDeepAnalysisData,
  AnalysisCharacterInfo,
  TimelineCalculationConfig,
} from "@/types/relationshipAnalysis";
import { DEFAULT_TIMELINE_CONFIG } from "@/types/relationshipAnalysis";

/**
 * 시간 감쇠를 적용한 누적 점수 계산
 * @param events 시간순 정렬된 이벤트 배열
 * @param decayFactor 감쇠 계수 (기본 0.95)
 */
export function calculateCumulativeScores(
  events: Array<{ importance: number; emotionalPolarity: number }>,
  decayFactor: number = 0.95,
): { friendlyScores: number[]; hostileScores: number[] } {
  const friendlyScores: number[] = [];
  const hostileScores: number[] = [];

  let cumulativeFriendly = 0;
  let cumulativeHostile = 0;

  events.forEach((event) => {
    // 이전 누적값에 감쇠 적용
    cumulativeFriendly *= decayFactor;
    cumulativeHostile *= decayFactor;

    // 새 이벤트 영향 추가
    const impact = event.importance * Math.abs(event.emotionalPolarity);

    if (event.emotionalPolarity > 0) {
      cumulativeFriendly += impact;
    } else if (event.emotionalPolarity < 0) {
      cumulativeHostile += impact;
    }

    friendlyScores.push(cumulativeFriendly);
    hostileScores.push(cumulativeHostile);
  });

  return { friendlyScores, hostileScores };
}

/**
 * 이벤트 배열을 타임라인 데이터로 변환
 * @param events 원본 이벤트 배열
 * @param config 계산 설정
 */
export function transformEventsToTimeline(
  events: Event[],
  sourceCharacterId: string,
  targetCharacterId: string,
  config: TimelineCalculationConfig = DEFAULT_TIMELINE_CONFIG,
): RelationshipTimelinePoint[] {
  // 두 캐릭터가 모두 참여한 이벤트만 필터링
  const relevantEvents = events.filter(
    (e) =>
      e.participants.includes(sourceCharacterId) &&
      e.participants.includes(targetCharacterId),
  );

  // 챕터/시간순 정렬 (placeholder - 실제 구현 시 chapter 필드 필요)
  const sortedEvents = [...relevantEvents].sort((a, b) => {
    // timestamp가 있으면 사용, 없으면 eventId로 정렬
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return a.eventId.localeCompare(b.eventId);
  });

  // 정서 극성 추정 (실제 구현 시 NLP 또는 백엔드 데이터 사용)
  const eventsWithPolarity = sortedEvents.map((e) => ({
    ...e,
    emotionalPolarity: estimateEmotionalPolarity(e),
  }));

  // 누적 점수 계산
  const { friendlyScores, hostileScores } = calculateCumulativeScores(
    eventsWithPolarity.map((e) => ({
      importance: e.importance,
      emotionalPolarity: e.emotionalPolarity,
    })),
    config.decayFactor,
  );

  // 타임라인 데이터 생성
  return eventsWithPolarity.map((event, index) => ({
    eventId: event.eventId,
    chapter: extractChapterNumber(event),
    timestamp: event.timestamp,
    title: event.narrativeSummary || event.description.slice(0, 50),
    description: event.description,
    importance: event.importance,
    emotionalPolarity: event.emotionalPolarity,
    cumulativeFriendly: friendlyScores[index],
    cumulativeHostile: hostileScores[index],
  }));
}

/**
 * 이벤트에서 챕터 번호 추출 (placeholder)
 */
function extractChapterNumber(event: Event): number {
  // 실제 구현 시 locationRef 또는 별도 필드에서 추출
  // 현재는 eventId의 숫자 부분 사용
  const match = event.eventId.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

/**
 * 이벤트의 정서 극성 추정 (간단한 휴리스틱)
 * 실제 구현 시 NLP 또는 백엔드 분석 결과 사용
 */
function estimateEmotionalPolarity(event: Event): number {
  const type = event.eventType.toLowerCase();

  // 이벤트 타입에 따른 기본 극성
  const typePolarity: Record<string, number> = {
    conflict: -5,
    confrontation: -4,
    betrayal: -8,
    reconciliation: 6,
    alliance: 5,
    dialogue: 0,
    discovery: 2,
    revelation: -1,
    transformation: 3,
    resolution: 4,
    romantic: 7,
    friendly: 5,
    hostile: -5,
  };

  // 중요도에 따른 스케일링
  const basePolarity = typePolarity[type] ?? 0;
  const scale = event.importance / 10;

  return Math.round(basePolarity * scale * 10) / 10;
}

/**
 * 키워드 추출 (간단한 빈도 분석)
 */
export function extractKeywords(
  events: Event[],
  maxKeywords: number = 5,
): string[] {
  // 이벤트 타입 빈도 계산
  const typeCount: Record<string, number> = {};
  events.forEach((e) => {
    const type = e.eventType;
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // 빈도순 정렬 후 상위 키워드 반환
  return Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([type]) => formatKeyword(type));
}

/**
 * 키워드 포맷팅
 */
function formatKeyword(type: string): string {
  const labels: Record<string, string> = {
    conflict: "갈등",
    confrontation: "대결",
    dialogue: "대화",
    discovery: "발견",
    revelation: "폭로",
    transformation: "변화",
    resolution: "해결",
    action: "행동",
    romantic: "로맨스",
    alliance: "동맹",
    betrayal: "배신",
  };
  return labels[type.toLowerCase()] || type;
}

/**
 * 관계 타입에서 기본 속성값 추정
 */
export function estimateAttributesFromRelation(
  relation: CharacterRelation | null,
  strength: number = 5,
): RelationshipAttributes {
  if (!relation) {
    return {
      emotionalBond: 5,
      functionalTrust: 5,
      valueAlignment: 5,
      interdependence: 5,
      latentTension: 2,
    };
  }

  const type = (relation.type || "NEUTRAL").toUpperCase();
  const s = relation.strength || strength;

  // 관계 타입별 기본 프로파일
  const profiles: Record<string, RelationshipAttributes> = {
    ALLY: {
      emotionalBond: s * 0.8,
      functionalTrust: s * 0.9,
      valueAlignment: s * 0.7,
      interdependence: s * 0.6,
      latentTension: 10 - s * 0.8,
    },
    FRIEND: {
      emotionalBond: s * 0.9,
      functionalTrust: s * 0.7,
      valueAlignment: s * 0.6,
      interdependence: s * 0.5,
      latentTension: 10 - s * 0.9,
    },
    RIVAL: {
      emotionalBond: s * 0.3,
      functionalTrust: s * 0.4,
      valueAlignment: s * 0.3,
      interdependence: s * 0.7,
      latentTension: s * 0.8,
    },
    ENEMY: {
      emotionalBond: 10 - s * 0.8,
      functionalTrust: 10 - s * 0.9,
      valueAlignment: 10 - s * 0.7,
      interdependence: s * 0.4,
      latentTension: s * 0.9,
    },
    ROMANTIC: {
      emotionalBond: s * 0.95,
      functionalTrust: s * 0.7,
      valueAlignment: s * 0.6,
      interdependence: s * 0.8,
      latentTension: (10 - s) * 0.5,
    },
    MENTOR: {
      emotionalBond: s * 0.6,
      functionalTrust: s * 0.9,
      valueAlignment: s * 0.8,
      interdependence: s * 0.5,
      latentTension: 10 - s * 0.8,
    },
    FAMILY: {
      emotionalBond: s * 0.85,
      functionalTrust: s * 0.6,
      valueAlignment: s * 0.5,
      interdependence: s * 0.7,
      latentTension: (10 - s) * 0.6,
    },
    MASTER_SERVANT: {
      emotionalBond: s * 0.5,
      functionalTrust: s * 0.9,
      valueAlignment: s * 0.6,
      interdependence: s * 0.8,
      latentTension: (10 - s) * 0.7,
    },
    COWORKER: {
      emotionalBond: s * 0.4,
      functionalTrust: s * 0.85,
      valueAlignment: s * 0.5,
      interdependence: s * 0.6,
      latentTension: (10 - s) * 0.8,
    },
    CLASSMATE: {
      emotionalBond: s * 0.6,
      functionalTrust: s * 0.5,
      valueAlignment: s * 0.5,
      interdependence: s * 0.3,
      latentTension: (10 - s) * 0.9,
    },
    COMPLEX: {
      emotionalBond: s * 0.9,
      functionalTrust: s * 0.4,
      valueAlignment: 10 - s * 0.5, // 가치관 충돌
      interdependence: s * 0.7,
      latentTension: s * 0.9, // 높은 긴장도
    },
    NEUTRAL: {
      emotionalBond: 5,
      functionalTrust: 5,
      valueAlignment: 5,
      interdependence: 3,
      latentTension: 3,
    },
  };

  const profile = profiles[type] || profiles.NEUTRAL;

  // 0-10 범위로 클램핑
  return {
    emotionalBond: Math.min(10, Math.max(0, profile.emotionalBond)),
    functionalTrust: Math.min(10, Math.max(0, profile.functionalTrust)),
    valueAlignment: Math.min(10, Math.max(0, profile.valueAlignment)),
    interdependence: Math.min(10, Math.max(0, profile.interdependence)),
    latentTension: Math.min(10, Math.max(0, profile.latentTension)),
  };
}

/**
 * Mock 분석 데이터 생성 (개발/테스트용)
 */
export function generateMockAnalysisData(
  source: AnalysisCharacterInfo,
  target: AnalysisCharacterInfo,
  relationshipType: string = "ALLY",
  strength: number = 7,
): RelationshipDeepAnalysisData {
  // 비대칭 관계 시뮬레이션 (Source는 Target을 더 신뢰)
  const sourceToTarget: RelationshipAttributes = {
    emotionalBond: 7,
    functionalTrust: 8,
    valueAlignment: 6,
    interdependence: 5,
    latentTension: 3,
  };

  const targetToSource: RelationshipAttributes = {
    emotionalBond: 5,
    functionalTrust: 9,
    valueAlignment: 7,
    interdependence: 4,
    latentTension: 2,
  };

  // Mock 타임라인
  const timeline: RelationshipTimelinePoint[] = [
    {
      eventId: "evt-001",
      chapter: 1,
      timestamp: "2024-01-15",
      title: "첫 만남",
      description: "두 캐릭터가 처음 마주친 순간",
      importance: 8,
      emotionalPolarity: 3,
      cumulativeFriendly: 24,
      cumulativeHostile: 0,
    },
    {
      eventId: "evt-002",
      chapter: 3,
      timestamp: "2024-02-10",
      title: "갈등의 시작",
      description: "의견 충돌로 인한 첫 번째 갈등",
      importance: 9,
      emotionalPolarity: -4,
      cumulativeFriendly: 22.8,
      cumulativeHostile: 36,
    },
    {
      eventId: "evt-003",
      chapter: 5,
      timestamp: "2024-03-20",
      title: "화해와 이해",
      description: "서로의 입장을 이해하게 된 계기",
      importance: 10,
      emotionalPolarity: 6,
      cumulativeFriendly: 81.66,
      cumulativeHostile: 34.2,
    },
    {
      eventId: "evt-004",
      chapter: 8,
      timestamp: "2024-05-05",
      title: "동맹 결성",
      description: "공동의 목표를 위해 손을 잡다",
      importance: 9,
      emotionalPolarity: 5,
      cumulativeFriendly: 122.58,
      cumulativeHostile: 32.49,
    },
  ];

  // Mock 인사이트
  const insights: RelationshipInsights = {
    decisiveTrigger: {
      eventId: "evt-003",
      title: "화해와 이해",
      summary:
        "서로의 과거를 공유하며 진정한 이해에 도달. 이 순간이 관계의 전환점이 됨.",
      impact: 10,
    },
    keywords: ["신뢰", "갈등", "화해", "동맹"],
  };

  // 경고 감지
  const warnings = detectRelationshipWarnings(sourceToTarget, targetToSource);

  // 첫/마지막 만남
  const firstEncounter = {
    eventId: timeline[0].eventId,
    chapter: `Chapter ${timeline[0].chapter}`,
    title: timeline[0].title,
    timestamp: timeline[0].timestamp || undefined,
  };

  const lastEncounter = {
    eventId: timeline[timeline.length - 1].eventId,
    chapter: `Chapter ${timeline[timeline.length - 1].chapter}`,
    title: timeline[timeline.length - 1].title,
    timestamp: timeline[timeline.length - 1].timestamp || undefined,
  };

  // 공동 등장 씬
  const sharedScenes = timeline.map((t) => ({
    eventId: t.eventId,
    chapter: `Chapter ${t.chapter}`,
    title: t.title,
    description: t.description,
    importance: t.importance,
  }));

  return {
    sourceCharacter: source,
    targetCharacter: target,
    sourceToTargetAttributes: sourceToTarget,
    targetToSourceAttributes: targetToSource,
    timeline,
    insights,
    relationshipType,
    currentStrength: strength,
    since: "Chapter 1",
    // NEW fields
    firstEncounter,
    lastEncounter,
    sharedScenes,
    warnings,
  };
}

/**
 * 관계 경고 감지
 * 레이더 차트 비대칭 및 긴장 수준 분석
 */
export function detectRelationshipWarnings(
  sourceToTarget: RelationshipAttributes,
  targetToSource: RelationshipAttributes,
): import("@/types/relationshipAnalysis").RelationshipWarning[] {
  const warnings: import("@/types/relationshipAnalysis").RelationshipWarning[] =
    [];

  // 1. 감정적 유대 비대칭 감지
  const bondDiff = Math.abs(
    sourceToTarget.emotionalBond - targetToSource.emotionalBond,
  );
  if (bondDiff >= 4) {
    const stronger =
      sourceToTarget.emotionalBond > targetToSource.emotionalBond
        ? "Source"
        : "Target";
    warnings.push({
      type: "asymmetry",
      severity: bondDiff >= 6 ? "high" : "medium",
      message: `일방적 감정: ${stronger}가 상대를 훨씬 더 아낌 (차이: ${bondDiff.toFixed(1)})`,
    });
  }

  // 2. 신뢰 비대칭 감지
  const trustDiff = Math.abs(
    sourceToTarget.functionalTrust - targetToSource.functionalTrust,
  );
  if (trustDiff >= 4) {
    const stronger =
      sourceToTarget.functionalTrust > targetToSource.functionalTrust
        ? "Source"
        : "Target";
    warnings.push({
      type: "asymmetry",
      severity: trustDiff >= 6 ? "high" : "medium",
      message: `신뢰 불균형: ${stronger}만 상대를 신뢰 (차이: ${trustDiff.toFixed(1)})`,
    });
  }

  // 3. 높은 잠재적 긴장
  const avgTension =
    (sourceToTarget.latentTension + targetToSource.latentTension) / 2;
  if (avgTension >= 7) {
    warnings.push({
      type: "tension",
      severity: avgTension >= 8.5 ? "high" : "medium",
      message: `높은 긴장 상태: 갈등 발생 가능성 높음 (긴장도: ${avgTension.toFixed(1)}/10)`,
    });
  }

  // 4. 가치관 충돌
  const valueDiff = Math.abs(
    sourceToTarget.valueAlignment - targetToSource.valueAlignment,
  );
  if (
    valueDiff >= 5 ||
    (sourceToTarget.valueAlignment < 4 && targetToSource.valueAlignment < 4)
  ) {
    warnings.push({
      type: "conflict",
      severity: "medium",
      message: "가치관 불일치: 근본적인 갈등 소지 있음",
    });
  }

  return warnings;
}

/**
 * 두 캐릭터의 공동 등장 씬 추출
 */
export function extractSharedScenes(
  events: Event[],
  sourceId: string,
  targetId: string,
): import("@/types/relationshipAnalysis").SharedScene[] {
  return events
    .filter(
      (e) =>
        e.participants.includes(sourceId) && e.participants.includes(targetId),
    )
    .sort((a, b) => b.importance - a.importance)
    .map((e) => ({
      eventId: e.eventId,
      chapter: `Chapter ${extractChapterNumber(e)}`,
      title: e.narrativeSummary || e.description.slice(0, 50),
      description: e.description.slice(0, 100),
      importance: e.importance,
    }));
}

/**
 * 첫/마지막 만남 정보 추출
 */
export function extractEncounterInfo(
  events: Event[],
  sourceId: string,
  targetId: string,
): {
  first: import("@/types/relationshipAnalysis").EncounterInfo | undefined;
  last: import("@/types/relationshipAnalysis").EncounterInfo | undefined;
} {
  const sharedEvents = events
    .filter(
      (e) =>
        e.participants.includes(sourceId) && e.participants.includes(targetId),
    )
    .sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
      return a.eventId.localeCompare(b.eventId);
    });

  if (sharedEvents.length === 0) {
    return { first: undefined, last: undefined };
  }

  const firstEvent = sharedEvents[0];
  const lastEvent = sharedEvents[sharedEvents.length - 1];

  return {
    first: {
      eventId: firstEvent.eventId,
      chapter: `Chapter ${extractChapterNumber(firstEvent)}`,
      title: firstEvent.narrativeSummary || firstEvent.description.slice(0, 50),
      timestamp: firstEvent.timestamp || undefined,
    },
    last: {
      eventId: lastEvent.eventId,
      chapter: `Chapter ${extractChapterNumber(lastEvent)}`,
      title: lastEvent.narrativeSummary || lastEvent.description.slice(0, 50),
      timestamp: lastEvent.timestamp || undefined,
    },
  };
}
