// =====================================================
// 📊 Relationship Deep Analysis Types
// 캐릭터 관계 심층 분석 모달용 타입 정의
// =====================================================

/**
 * 5축 관계 속성 (레이더 차트용)
 * 각 속성은 0-10 범위의 값을 가짐
 */
export interface RelationshipAttributes {
  /** 정서적 유대 - 사적인 친밀감 */
  emotionalBond: number;
  /** 기능적 신뢰 - 능력 및 역할 수행에 대한 믿음 */
  functionalTrust: number;
  /** 가치관 일치 - 도덕적 지향점의 유사성 */
  valueAlignment: number;
  /** 상호 의존성 - 서사 진행상 서로가 필요한 정도 */
  interdependence: number;
  /** 잠재적 긴장 - 갈등 요소나 경쟁심 */
  latentTension: number;
}

/**
 * 레이더 차트 축 정보
 */
export interface RadarAxisConfig {
  key: keyof RelationshipAttributes;
  label: string;
  icon?: string;
}

/**
 * 기본 레이더 축 설정
 */
export const RADAR_AXES: RadarAxisConfig[] = [
  { key: "emotionalBond", label: "정서적 유대" },
  { key: "functionalTrust", label: "기능적 신뢰" },
  { key: "valueAlignment", label: "가치관 일치" },
  { key: "interdependence", label: "상호 의존성" },
  { key: "latentTension", label: "잠재적 긴장" },
];

/**
 * 시계열 데이터 포인트 (타임라인 그래프용)
 */
export interface RelationshipTimelinePoint {
  /** 이벤트 ID */
  eventId: string;
  /** 챕터 번호 */
  chapter: number;
  /** 타임스탬프 (ISO 문자열) */
  timestamp: string | null;
  /** 이벤트 제목 */
  title: string;
  /** 이벤트 상세 설명 */
  description: string;
  /** 중요도 (1-10, 8 이상만 그래프에 표시) */
  importance: number;
  /**
   * 정서 극성 (-10 ~ +10)
   * 음수 = 적대적 영향, 양수 = 우호적 영향
   */
  emotionalPolarity: number;
  /** 누적 우호 지수 (시간 감쇠 적용) */
  cumulativeFriendly: number;
  /** 누적 적대 지수 (시간 감쇠 적용) */
  cumulativeHostile: number;
}

/**
 * 관계 인사이트 (중단 섹션용)
 */
export interface RelationshipInsights {
  /** 결정적 트리거 - 현재 관계에 가장 큰 영향을 준 이벤트 */
  decisiveTrigger: {
    eventId: string;
    title: string;
    summary: string;
    impact: number;
  } | null;
  /** 빈번한 감정/토픽 키워드 (3-5개) */
  keywords: string[];
}

/**
 * 캐릭터 기본 정보 (모달 표시용)
 */
export interface AnalysisCharacterInfo {
  id: string;
  name: string;
  imageUrl?: string;
}

/**
 * 심층 분석 모달 전체 데이터
 */
export interface RelationshipDeepAnalysisData {
  // 캐릭터 정보
  sourceCharacter: AnalysisCharacterInfo;
  targetCharacter: AnalysisCharacterInfo;

  // 양방향 관계 속성 (비대칭 가능)
  /** Source → Target 관점에서의 관계 속성 */
  sourceToTargetAttributes: RelationshipAttributes;
  /** Target → Source 관점에서의 관계 속성 */
  targetToSourceAttributes: RelationshipAttributes;

  // 타임라인 데이터
  timeline: RelationshipTimelinePoint[];

  // 인사이트
  insights: RelationshipInsights;

  // 기본 관계 정보
  relationshipType: string;
  currentStrength: number;
  since?: string;
}

/**
 * 타임라인 계산 설정
 */
export interface TimelineCalculationConfig {
  /** 시간 감쇠 계수 (기본 0.95) */
  decayFactor: number;
  /** 표시할 최소 중요도 (기본 8) */
  minImportance: number;
}

/**
 * 기본 타임라인 계산 설정
 */
export const DEFAULT_TIMELINE_CONFIG: TimelineCalculationConfig = {
  decayFactor: 0.95,
  minImportance: 8,
};
