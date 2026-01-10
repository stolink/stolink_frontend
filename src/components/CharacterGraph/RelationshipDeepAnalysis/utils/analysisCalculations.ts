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
  StrengthFactor,
  AsymmetricStrength,
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
): {
  friendlyScores: number[];
  hostileScores: number[];
  netSentimentScores: number[];
} {
  const friendlyScores: number[] = [];
  const hostileScores: number[] = [];
  const netSentimentScores: number[] = [];

  let cumulativeFriendly = 0;
  let cumulativeHostile = 0;
  let cumulativeNet = 0;

  events.forEach((event) => {
    // 이전 누적값에 감쇠 적용
    cumulativeFriendly *= decayFactor;
    cumulativeHostile *= decayFactor;
    cumulativeNet *= decayFactor;

    // 새 이벤트 영향 추가 (선격 가치 적용)
    const impact = event.importance * event.emotionalPolarity;

    if (event.emotionalPolarity > 0) {
      cumulativeFriendly += impact;
    } else if (event.emotionalPolarity < 0) {
      cumulativeHostile += Math.abs(impact);
    }

    // 통합 지수: 누적 정서 합산
    cumulativeNet += impact;

    friendlyScores.push(cumulativeFriendly);
    hostileScores.push(cumulativeHostile);
    netSentimentScores.push(cumulativeNet);
  });

  // 정규화 (100 기준 스케일링)
  const maxAbsNet = Math.max(...netSentimentScores.map(Math.abs), 10);
  const maxAbsComp = Math.max(...friendlyScores, ...hostileScores, 10);

  const normalizedNet = netSentimentScores.map((s) => (s / maxAbsNet) * 100);
  const normalizedFriendly = friendlyScores.map((s) => (s / maxAbsComp) * 100);
  const normalizedHostile = hostileScores.map((s) => (s / maxAbsComp) * 100);

  return {
    friendlyScores: normalizedFriendly,
    hostileScores: normalizedHostile,
    netSentimentScores: normalizedNet,
  };
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
  sourceName: string,
  targetName: string,
  config: TimelineCalculationConfig = DEFAULT_TIMELINE_CONFIG,
): RelationshipTimelinePoint[] {
  // 두 캐릭터가 모두 참여한 이벤트만 필터링 (ID or Name matching)
  // participants usually contains names if IDs are not mapped, or mixed.
  // We check if (sourceId OR sourceName) AND (targetId OR targetName) are in participants.
  const relevantEvents = events.filter((e) => {
    const p = e.participants;
    const hasSource = p.includes(sourceCharacterId) || p.includes(sourceName);
    const hasTarget = p.includes(targetCharacterId) || p.includes(targetName);
    return hasSource && hasTarget;
  });

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
  const { friendlyScores, hostileScores, netSentimentScores } =
    calculateCumulativeScores(
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
    sentimentTrajectory: netSentimentScores[index],
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

  // 이벤트 타입에 따른 기본 극성 (-10 ~ 10)
  const typePolarity: Record<string, number> = {
    // Negative
    betrayal: -9,
    hostile: -6,
    conflict: -5,
    confrontation: -4,
    revelation: -1, // 폭로는 맥락에 따라 다르지만 기본적으로는 약간의 긴장 조성

    // Neutral / Contextual
    discovery: 2,
    transformation: 3,
    action: 1,
    chat: 2,

    // Positive
    dialogue: 3, // 대화는 상호작용의 기본이므로 긍정적 점수 부여
    meeting: 4,
    reconciliation: 7,
    alliance: 8,
    support: 6,
    rescue: 9,
    romantic: 9,
    friendly: 5,
    resolution: 4,
  };

  // 기본 극성값 (정의되지 않은 타입은 0)
  const basePolarity = typePolarity[type] ?? 0;

  // 중요도는 calculateCumulativeScores에서 선형적으로 곱해지므로
  // 여기서는 타입별 기본 정서값만 반환
  return basePolarity;
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
/**
 * 관계 분석 데이터 생성 (실제 데이터 + Mock 속성)
 */
export function generateAnalysisData(
  source: AnalysisCharacterInfo,
  target: AnalysisCharacterInfo,
  relationshipTypes: string[] = ["ALLY"],
  strength: number = 7,
  events: Event[] = [], // Real events from project
): RelationshipDeepAnalysisData {
  // 비대칭 관계 속성 (레이더 차트용)
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

  // 비대칭 관계 강도 및 산출 근거 시뮬레이션
  // 관계 유형을 반대 입장에서 변환 (예: 멘토 -> 멘티)
  const invertRelationType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes("mentor")) return "PUPIL";
    if (t.includes("pupil") || t.includes("student")) return "MENTOR";
    if (t.includes("leader")) return "FOLLOWER";
    if (t.includes("follower")) return "LEADER";
    if (t.includes("parent")) return "CHILD";
    if (t.includes("child")) return "PARENT";
    if (t.includes("master")) return "SERVANT";
    if (t.includes("servant")) return "MASTER";
    if (t.includes("protector")) return "PROTECTED";
    if (t.includes("protected")) return "PROTECTOR";
    return type; // 친구, 동료 등 대칭 관계는 유지
  };

  // 입력받은 relationshipTypes를 기반으로 세부 요인(factors) 생성
  const generateFactorsFromTypes = (
    types: string[],
    isInverted: boolean = false,
  ): StrengthFactor[] => {
    if (!types || types.length === 0) {
      return [{ type: "NEUTRAL", score: 5, weight: 1.0, category: "friendly" }];
    }

    const processedTypes = isInverted ? types.map(invertRelationType) : types;

    // 각 타입별로 가중치를 균등하게 배분하거나 약간의 랜덤성을 줌
    const totalWeight = 1.0;
    return processedTypes.map((type, index) => {
      // 마지막 요소가 남은 가중치를 모두 가져감
      const weight =
        index === processedTypes.length - 1
          ? parseFloat(
              (
                totalWeight -
                (processedTypes.length - 1) * (1 / (processedTypes.length + 1))
              ).toFixed(2),
            )
          : parseFloat((1 / (processedTypes.length + 1)).toFixed(2));

      const score = Math.floor(Math.random() * 4) + 6; // 6~9점 사이 랜덤
      const isFriendly = !["enemy", "hostile", "적대", "경쟁", "대립"].some(
        (t) => type.toLowerCase().includes(t),
      );

      return {
        type,
        score,
        weight,
        category: isFriendly ? "friendly" : "hostile",
      };
    });
  };

  const asymmetricStrength: AsymmetricStrength = {
    sourceToTarget: {
      total: strength, // Use the 'strength' parameter for total
      factors: generateFactorsFromTypes(relationshipTypes),
    },
    targetToSource: {
      total: Math.max(0, strength + (Math.random() * 2 - 1)), // 약간의 비대칭성 부여
      // 타겟 입장에서는 관계 유형을 반전시켜서 계산
      factors: generateFactorsFromTypes(relationshipTypes, true),
    },
  };

  // --- Real Data Processing ---
  let timeline: RelationshipTimelinePoint[] = [];
  let insights: RelationshipInsights = { decisiveTrigger: null, keywords: [] };
  let firstEncounter:
    | import("@/types/relationshipAnalysis").EncounterInfo
    | undefined;
  let lastEncounter:
    | import("@/types/relationshipAnalysis").EncounterInfo
    | undefined;
  let sharedScenes: import("@/types/relationshipAnalysis").SharedScene[] = [];

  if (events && events.length > 0) {
    // 1. 타임라인 생성
    timeline = transformEventsToTimeline(
      events,
      source.id,
      target.id,
      source.name,
      target.name,
    );

    // 2. 만남 정보 추출
    const encounters = extractEncounterInfo(
      events,
      source.id,
      target.id,
      source.name,
      target.name,
    );
    firstEncounter = encounters.first;
    lastEncounter = encounters.last;

    // 3. 공동 등장 씬 추출
    sharedScenes = extractSharedScenes(
      events,
      source.id,
      target.id,
      source.name,
      target.name,
    );

    // 4. 인사이트 생성 (결정적 트리거 & 키워드)
    // 결정적 트리거: 중요도(importance) * 감정(emotionalPolarity) 절대값이 가장 큰 이벤트
    let maxImpact = 0;
    let decisiveEvent: RelationshipTimelinePoint | null = null;

    timeline.forEach((point) => {
      const impact =
        point.importance * Math.abs(point.emotionalPolarity || 0.1);
      if (impact > maxImpact) {
        maxImpact = impact;
        decisiveEvent = point;
      }
    });

    // 키워드 추출 (Shared Events 기반)
    // 두 캐릭터가 공유하는 이벤트들만 대상으로 키워드 추출
    const relevantEvents = events.filter((e) => {
      const p = e.participants;
      const hasSource = p.includes(source.id) || p.includes(source.name);
      const hasTarget = p.includes(target.id) || p.includes(target.name);
      return hasSource && hasTarget;
    });
    const keywords = extractKeywords(relevantEvents);

    insights = {
      decisiveTrigger: decisiveEvent
        ? {
            eventId: (decisiveEvent as RelationshipTimelinePoint).eventId,
            title: (decisiveEvent as RelationshipTimelinePoint).title,
            summary: (decisiveEvent as RelationshipTimelinePoint).description,
            impact: (decisiveEvent as RelationshipTimelinePoint).importance,
          }
        : null,
      keywords,
    };
  } else {
    // Fallback Mock Data (Only if no real events are available)
    // Mock 타임라인
    timeline = [
      {
        eventId: "mock-001",
        chapter: 1,
        timestamp: "2024-01-15",
        title: "첫 만남 (기록 없음)",
        description: "데이터가 충분하지 않아 시뮬레이션된 기록입니다.",
        importance: 5,
        emotionalPolarity: 0,
        cumulativeFriendly: 10,
        cumulativeHostile: 0,
      },
    ];

    insights = {
      decisiveTrigger: null,
      keywords: relationshipTypes.map((t) => formatKeyword(t)), // 단순히 관계 타입을 키워드로
    };
  }

  // 경고 감지
  const warnings = detectRelationshipWarnings(sourceToTarget, targetToSource);

  return {
    sourceCharacter: source,
    targetCharacter: target,
    sourceToTargetAttributes: sourceToTarget,
    targetToSourceAttributes: targetToSource,
    asymmetricStrength,
    timeline,
    insights,
    relationshipTypes,
    currentStrength: strength,
    since: firstEncounter?.chapter || "알 수 없음",
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
  sourceName: string,
  targetName: string,
): import("@/types/relationshipAnalysis").SharedScene[] {
  return events
    .filter((e) => {
      const p = e.participants;
      const hasSource = p.includes(sourceId) || p.includes(sourceName);
      const hasTarget = p.includes(targetId) || p.includes(targetName);
      return hasSource && hasTarget;
    })
    .sort((a, b) => b.importance - a.importance)
    .map((e) => ({
      eventId: e.eventId,
      chapter: `Chapter ${extractChapterNumber(e)}`,
      title: e.narrativeSummary || e.description,
      description: e.description,
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
  sourceName: string,
  targetName: string,
): {
  first: import("@/types/relationshipAnalysis").EncounterInfo | undefined;
  last: import("@/types/relationshipAnalysis").EncounterInfo | undefined;
} {
  const sharedEvents = events
    .filter((e) => {
      const p = e.participants;
      const hasSource = p.includes(sourceId) || p.includes(sourceName);
      const hasTarget = p.includes(targetId) || p.includes(targetName);
      return hasSource && hasTarget;
    })
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
      title: firstEvent.narrativeSummary || firstEvent.description,
      timestamp: firstEvent.timestamp || undefined,
    },
    last: {
      eventId: lastEvent.eventId,
      chapter: `Chapter ${extractChapterNumber(lastEvent)}`,
      title: lastEvent.narrativeSummary || lastEvent.description,
      timestamp: lastEvent.timestamp || undefined,
    },
  };
}
