// =====================================================
// 📈 Relationship Analysis Calculations
// 관계 분석 지수 계산 및 데이터 변환 로직
// =====================================================

import type { Event } from "@/types/event";
import type {
  Character,
  CharacterRelation,
  RelationType,
} from "@/types/character";
import type {
  RelationshipAttributes,
  RelationshipTimelinePoint,
  RelationshipInsights,
  RelationshipDeepAnalysisData,
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
  decayFactor: number = 0.99,
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
    // 이전 누적값에 미세한 감쇠 적용 (역사의 기화)
    cumulativeFriendly *= decayFactor;
    cumulativeHostile *= decayFactor;
    cumulativeNet *= decayFactor;

    // 새 이벤트 영향 추가
    let impact = event.importance * event.emotionalPolarity;

    // [Resilience Logic] "Strong Trust Filter"
    // If established trust exists, negative shocks are filtered through the "Goodwill" lens.
    if (impact < 0 && cumulativeFriendly > 10) {
      // Shield grows with trust (max 95% protection at trust score 100)
      const shield = Math.min(cumulativeFriendly / 100, 0.95);
      const filteredImpact = impact * (1 - shield);

      // [Velocity Cap] Even with filtered impact, prevent single-step "Emotional Shock"
      // Unless the event is absolutely catastrophic (Importance > 9), cap the drop to -10.
      const cap = event.importance > 9 ? -20 : -10;
      impact = Math.max(filteredImpact, cap);
    }

    if (event.emotionalPolarity > 0) {
      cumulativeFriendly += impact;
    } else if (event.emotionalPolarity < 0) {
      cumulativeHostile += Math.abs(impact);
    }

    // 통합 지수 합산 (Clamping은 마지막 정규화 단계에서 처리)
    cumulativeNet += impact;

    friendlyScores.push(cumulativeFriendly);
    hostileScores.push(cumulativeHostile);
    netSentimentScores.push(cumulativeNet);
  });

  // [Normalization: Dynamic Scaling]
  const maxAbsNet = Math.max(...netSentimentScores.map(Math.abs), 20);
  const maxAbsComp = Math.max(...friendlyScores, ...hostileScores, 20);

  // Prepend explicit 0 to ensure the graph starts from a neutral base [0, ...]
  const normalizedNet = [
    0,
    ...netSentimentScores.map((s) => (s / maxAbsNet) * 100),
  ];
  const normalizedFriendly = [
    0,
    ...friendlyScores.map((s) => (s / maxAbsComp) * 100),
  ];
  const normalizedHostile = [
    0,
    ...hostileScores.map((s) => (s / maxAbsComp) * 100),
  ];

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
  _config: TimelineCalculationConfig = DEFAULT_TIMELINE_CONFIG,
): RelationshipTimelinePoint[] {
  // Note: _config is reserved for future customization of decay rates and thresholds
  // 두 캐릭터가 모두 참여한 이벤트만 필터링 (ID or Name matching)
  // participants usually contains names if IDs are not mapped, or mixed.
  // [Robust Filtering] Check participants array OR search in content if participants is empty
  const relevantEvents = events.filter((e) => {
    const p = (e.participants || []).map((name) => name.toLowerCase().trim());
    const sourceIdLower = sourceCharacterId.toLowerCase();
    const sourceNameLower = sourceName.toLowerCase();
    const targetIdLower = targetCharacterId.toLowerCase();
    const targetNameLower = targetName.toLowerCase();

    // 1. Check strict participant list
    const hasSourceInParticipants =
      p.includes(sourceIdLower) ||
      p.includes(sourceNameLower) ||
      p.some((n) => sourceNameLower.includes(n) || n.includes(sourceNameLower));

    const hasTargetInParticipants =
      p.includes(targetIdLower) ||
      p.includes(targetNameLower) ||
      p.some((n) => targetNameLower.includes(n) || n.includes(targetNameLower));

    if (p.length > 0) {
      // If participants list exists, trust it
      return hasSourceInParticipants && hasTargetInParticipants;
    }

    // 2. Fallback: Search in content (narrativeSummary + description)
    const content = (
      (e.narrativeSummary || "") +
      " " +
      (e.description || "")
    ).toLowerCase();
    const hasSourceInContent = content.includes(sourceNameLower); // ID usually not in text
    const hasTargetInContent = content.includes(targetNameLower);

    return hasSourceInContent && hasTargetInContent;
  });

  // 챕터 -> 시퀀스/시간 -> ID 순으로 정교하게 정렬
  const sortedEvents = [...relevantEvents].sort((a, b) => {
    const chA = extractChapterNumber(a);
    const chB = extractChapterNumber(b);
    if (chA !== chB) return chA - chB;

    // Use sequenceOrder if available (more precise than timestamp)
    if (a.sequenceOrder !== undefined && b.sequenceOrder !== undefined) {
      return a.sequenceOrder - b.sequenceOrder;
    }

    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return a.eventId.localeCompare(b.eventId);
  });

  // 정서 극성 추정 (NLP/문맥 보정 포함)
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
      0.99, // Force 0.99 decay for better history preservation (Lifetime Bond effect)
    );

  // 타임라인 데이터 생성
  // friendlyScores[0]은 0점(시작점)이므로, 이를 첫 번째 포인트(Neutral Start)로 삽입
  const points: RelationshipTimelinePoint[] = [
    {
      eventId: "start",
      chapter:
        sortedEvents.length > 0 ? extractChapterNumber(sortedEvents[0]) - 1 : 0,
      timestamp: sortedEvents.length > 0 ? sortedEvents[0].timestamp : "",
      title: "서사 시작",
      description: "두 캐릭터의 관계가 시작되는 지점입니다.",
      importance: 0,
      emotionalPolarity: 0,
      cumulativeFriendly:
        Math.abs(friendlyScores[0]) < 0.01 ? 0 : friendlyScores[0],
      cumulativeHostile:
        Math.abs(hostileScores[0]) < 0.01 ? 0 : hostileScores[0],
      sentimentTrajectory:
        Math.abs(netSentimentScores[0]) < 0.01 ? 0 : netSentimentScores[0],
    },
    ...eventsWithPolarity.map((event, index) => {
      const f = friendlyScores[index + 1];
      const h = hostileScores[index + 1];
      const s = netSentimentScores[index + 1];
      return {
        eventId: event.eventId,
        chapter: extractChapterNumber(event),
        timestamp: event.timestamp,
        title: event.narrativeSummary || event.description.slice(0, 50),
        description: event.description,
        importance: event.importance,
        emotionalPolarity: event.emotionalPolarity,
        cumulativeFriendly: Math.abs(f) < 0.01 ? 0 : f,
        cumulativeHostile: Math.abs(h) < 0.01 ? 0 : h,
        sentimentTrajectory: Math.abs(s) < 0.01 ? 0 : s,
      };
    }),
  ];

  return points;
}

/**
 * 이벤트에서 챕터 번호 추출 (placeholder)
 */
function extractChapterNumber(event: Event): number {
  if (event.chapter !== undefined && event.chapter !== null) {
    return event.chapter;
  }
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
  const content = (
    (event.narrativeSummary || "") +
    " " +
    (event.description || "")
  ).toLowerCase();

  // [Deep Think] Generalized Narrative Heuristics
  // Instead of hardcoding specific events, we use semantic clusters to detect "Relationship Impact".

  // 1. Shared Achievement (Positive impact even if type is 'conflict')
  const victoryTerms = ["평정", "승리", "성공", "장악", "완성", "획득"];
  // 2. Proactive Bonding (Social interaction with intent)
  const bondingTerms = ["합류", "등용", "신뢰", "우정", "동맹", "결합", "충성"];
  // 3. Significance of Meeting (First contact / Important dialogue)
  const meetingTerms = ["만남", "방문", "영접", "대화", "설득"];

  const negativeTerms = [
    "실패",
    "패배",
    "사망",
    "붕괴",
    "상실",
    "배신",
    "갈등",
  ];

  const hasVictory = victoryTerms.some((term) => content.includes(term));
  const hasBonding = bondingTerms.some((term) => content.includes(term));
  const hasMeeting = meetingTerms.some((term) => content.includes(term));
  const hasNegative = negativeTerms.some((term) => content.includes(term));

  // Base Polarity by Event Type
  const typePolarity: Record<string, number> = {
    betrayal: -10,
    hostile: -6,
    enemy: -8,
    conflict: -5,
    confrontation: -4,
    revelation: -2,
    discovery: 1,
    transformation: 2,
    action: 1,
    chat: 2,
    dialogue: 3,
    meeting: 4,
    reconciliation: 7,
    alliance: 8,
    support: 6,
    rescue: 10,
    romantic: 10,
    friendly: 5,
    resolution: 4,
    bond: 8,
  };

  let polarity = typePolarity[type] ?? 0;

  // [Contextual Heuristics]
  // Rule A: Victory in Conflict = Shared Success (+score)
  if (
    hasVictory &&
    !hasNegative &&
    (type === "conflict" || type === "confrontation" || type === "action")
  ) {
    polarity = 6;
  }
  // Rule B: Important Meetings & Bonding = High Positive (e.g., Sango-choryeo case)
  if (
    (hasBonding || hasMeeting) &&
    !hasNegative &&
    (type === "meeting" || type === "dialogue" || type === "action")
  ) {
    polarity = Math.max(polarity, 5); // Ensure it's treated as a significant positive start
  }
  // Rule C: Tragedy as shared pain? (Optional: if they are already close, tragedy might not be negative sentiment between them)
  // For now, keep negative terms as negative.

  return polarity;
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
    ally: "동료",
    mentor: "스승",
    rival: "라이벌",
    family: "가족",
    subordinate: "부하",
    coworker: "동료",
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

  // Alias mapping
  let normalizedType = type;
  if (["HOSTILE", "OPPONENT"].includes(type)) normalizedType = "ENEMY";
  if (["COMPETITOR", "ADVERSARY"].includes(type)) normalizedType = "RIVAL";
  if (["SUBORDINATE", "FOLLOWER", "MINION"].includes(type))
    normalizedType = "MASTER_SERVANT";
  if (["PARTNER", "TEAMMATE"].includes(type)) normalizedType = "COWORKER";

  const profile = profiles[normalizedType] || profiles.NEUTRAL;

  // 1. 실제 데이터가 있으면 우선 사용 (Clamped to 0-10)
  if (
    relation.emotionalBond !== undefined ||
    relation.functionalTrust !== undefined
  ) {
    return {
      emotionalBond: Math.min(
        10,
        Math.max(0, relation.emotionalBond ?? profile.emotionalBond),
      ),
      functionalTrust: Math.min(
        10,
        Math.max(0, relation.functionalTrust ?? profile.functionalTrust),
      ),
      valueAlignment: Math.min(
        10,
        Math.max(0, relation.valueAlignment ?? profile.valueAlignment),
      ),
      interdependence: Math.min(
        10,
        Math.max(0, relation.interdependence ?? profile.interdependence),
      ),
      latentTension: Math.min(
        10,
        Math.max(0, relation.latentTension ?? profile.latentTension),
      ),
    };
  }

  // 0-10 범위로 클램핑 (추정값 사용)
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

/**
 * 관계 분석 데이터 생성 (실제 데이터 기반)
 */
export function generateAnalysisData(
  source: Character,
  target: Character,
  initialRelationshipTypes: string[] = ["ALLY"],
  initialStrength: number = 7,
  events: Event[] = [], // Real events from project
  originalDescription?: string, // Added
): RelationshipDeepAnalysisData {
  const sourceId = source._id;
  const targetId = target._id;
  const sourceName = source.profile.name;
  const targetName = target.profile.name;

  // 1. 양방향 관계 데이터 찾기 (Real Data)
  const sourceToTargetRel = source.relations.graph.find(
    (r) => r.target === targetId,
  ) as CharacterRelation | undefined;
  // Target 쪽에서 Source를 향하는 관계 찾기 (없으면 대칭/추정)
  const targetToSourceRel = target.relations.graph.find(
    (r) => r.target === sourceId,
  ) as CharacterRelation | undefined;

  // 관계 타입 결정 (명시적 데이터 우선)
  const types = sourceToTargetRel?.relationTypes?.length
    ? sourceToTargetRel.relationTypes
    : sourceToTargetRel && sourceToTargetRel.type
      ? [sourceToTargetRel.type]
      : initialRelationshipTypes;

  const targetTypes = targetToSourceRel?.relationTypes?.length
    ? targetToSourceRel.relationTypes
    : targetToSourceRel && targetToSourceRel.type
      ? [targetToSourceRel.type]
      : types; // Fallback to symmetric

  // 2. 설명문 결정
  let finalDescription =
    originalDescription || sourceToTargetRel?.description || "";
  const finalStrength = sourceToTargetRel?.strength ?? initialStrength;
  const multiTypeThreshold = 5;

  if (!finalDescription) {
    if (types.length >= multiTypeThreshold) {
      const typeLabel = types
        .map((t) => formatKeyword(t))
        .filter((l, i, arr) => arr.indexOf(l) === i)
        .join(", ");
      finalDescription = `복합적 관계 (${typeLabel})`;
    } else if (types.length > 0) {
      finalDescription = `${formatKeyword(types[0])} 관계`;
    }
  }

  // 3. 가치관 일치도 계산 (Real Personality Data)
  const calculateValueAlignment = (c1: Character, c2: Character): number => {
    const v1 = c1.profile.personality.values || [];
    const v2 = c2.profile.personality.values || [];
    if (v1.length === 0 || v2.length === 0) return 5; // Default neutral

    // 간단한 문자열 포함 여부 체크 (Jaccard Similarity Simplex)
    let overlap = 0;
    v1.forEach((val1) => {
      if (v2.some((val2) => val2.includes(val1) || val1.includes(val2))) {
        overlap++;
      }
    });

    // 합집합 크기
    const union = new Set([...v1, ...v2]).size;
    const ratio = union === 0 ? 0 : overlap / Math.min(v1.length, v2.length); // Use min length for stricter match
    return Math.min(10, Math.floor(ratio * 10) + 2); // Base +2 boost
  };

  const realValueAlignment = calculateValueAlignment(source, target);

  // 4. 속성 추정 (Real Relations 기반)
  const rawSourceToTargetAttrs = estimateAttributesFromRelation(
    sourceToTargetRel ||
      ({
        type: types[0] as RelationType,
        target: targetId,
        strength: finalStrength,
      } as CharacterRelation),
    finalStrength,
  );

  const targetStrength = targetToSourceRel?.strength ?? finalStrength;
  const rawTargetToSourceAttrs = estimateAttributesFromRelation(
    targetToSourceRel ||
      ({
        type: targetTypes[0] as RelationType,
        target: sourceId,
        strength: targetStrength,
        history: null,
        description: "",
      } as CharacterRelation),
    targetStrength,
  );

  // 가치관 일치도 주입 (Priority: Neo4j Data > Calculated Personality > Hardcoded Profile)
  const sourceToTarget: RelationshipAttributes = {
    ...rawSourceToTargetAttrs,
    valueAlignment:
      sourceToTargetRel?.valueAlignment !== undefined
        ? rawSourceToTargetAttrs.valueAlignment
        : realValueAlignment,
  };

  const targetToSource: RelationshipAttributes = {
    ...rawTargetToSourceAttrs,
    valueAlignment:
      targetToSourceRel?.valueAlignment !== undefined
        ? rawTargetToSourceAttrs.valueAlignment
        : realValueAlignment,
  };

  // 5. 비대칭 관계 강도 및 산출 근거 (No Random)
  // 입력받은 relationshipTypes를 기반으로 세부 요인(factors) 생성
  const generateFactors = (
    typesList: string[],
    baseStrength: number,
  ): StrengthFactor[] => {
    if (!typesList || typesList.length === 0) {
      return [{ type: "NEUTRAL", score: 5, weight: 1.0, category: "friendly" }];
    }

    const totalWeight = 1.0;
    return typesList.map((type, index) => {
      // 가중치 배분
      const weight =
        index === typesList.length - 1
          ? parseFloat(
              (
                totalWeight -
                (typesList.length - 1) * (1 / (typesList.length + 1))
              ).toFixed(2),
            )
          : parseFloat((1 / (typesList.length + 1)).toFixed(2));

      // Random 제거: Base Strength +- 1 범위 내 조정
      // 관계 타입이 "Hostile" 계열이면 점수를 반전? (No, strength is intensity usually)
      // But here score implies "Goodness"? Check usage.
      // Usage seems to be just contribution to the total.

      const isFriendly = !["enemy", "hostile", "적대", "경쟁", "대립"].some(
        (t) => type.toLowerCase().includes(t),
      );

      // Score logic: if friendly, close to strength. If hostile, still close to intensity but categorized differently?
      // Assuming 'Strength' in UI means 'Intensity of Bond'.
      const score = Math.min(10, Math.max(1, baseStrength));

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
      total: sourceToTargetRel?.strength ?? finalStrength,
      factors: generateFactors(
        types,
        sourceToTargetRel?.strength ?? finalStrength,
      ),
    },
    targetToSource: {
      total: targetToSourceRel?.strength ?? Math.max(0, finalStrength - 1), // Fallback slighly weaker
      factors: generateFactors(
        targetTypes,
        targetToSourceRel?.strength ?? finalStrength - 1,
      ),
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
      sourceId, // Use real ID
      targetId,
      sourceName,
      targetName,
    );

    // 2. 만남 정보 추출
    const encounters = extractEncounterInfo(
      events,
      sourceId,
      targetId,
      sourceName,
      targetName,
    );
    firstEncounter = encounters.first;
    lastEncounter = encounters.last;

    // 3. 공동 등장 씬 추출
    sharedScenes = extractSharedScenes(
      events,
      sourceId,
      targetId,
      sourceName,
      targetName,
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
      const hasSource = p.includes(sourceId) || p.includes(sourceName);
      const hasTarget = p.includes(targetId) || p.includes(targetName);
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
        sentimentTrajectory: 10, // Net sentiment: friendly - hostile
        projectId: "mock-project",
      },
    ];

    insights = {
      decisiveTrigger: null,
      keywords: types.map((t) => formatKeyword(t)), // 단순히 관계 타입을 키워드로
    };
  }

  // 경고 감지
  const warnings = detectRelationshipWarnings(sourceToTarget, targetToSource);

  return {
    sourceCharacter: {
      id: sourceId,
      name: sourceName,
      imageUrl: source.imageUrl,
    },
    targetCharacter: {
      id: targetId,
      name: targetName,
      imageUrl: target.imageUrl,
    },
    sourceToTargetAttributes: sourceToTarget,
    targetToSourceAttributes: targetToSource,
    asymmetricStrength,
    timeline,
    insights,
    relationshipTypes: types,
    currentStrength: finalStrength,
    since: firstEncounter?.chapter || sourceToTargetRel?.since || "알 수 없음",
    // NEW fields
    description: finalDescription,
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
