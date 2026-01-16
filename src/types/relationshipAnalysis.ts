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
  /** 통합 유대 지수 (Net Sentiment, -100 ~ +100) */
  sentimentTrajectory: number;
  /** 프로젝트 ID */
  projectId?: string;
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
 * 두 캐릭터 간 관계 정의 (동상이몽 표현용)
 */
export interface RelationshipDefinition {
  /** Source가 Target을 어떻게 정의하는지 */
  sourceDefinesTarget: string | null;
  /** Target이 Source를 어떻게 정의하는지 */
  targetDefinesSource: string | null;
  /** 정의가 불일치하는지 (동상이몽) */
  isConflicting: boolean;
}

/**
 * 미해결 이슈 타입
 */
export type ActiveIssueType =
  | "promise"
  | "conflict"
  | "secret"
  | "foreshadowing";

/**
 * 미해결 이슈 (진행 중인 복선/갈등)
 */
export interface ActiveIssue {
  id: string;
  type: ActiveIssueType;
  title: string;
  description?: string;
  chapter?: string;
  daysRemaining?: number;
  relatedCharacterIds: string[];
}

/**
 * 관계 강도 구성 요소 (계산 근거)
 */
export interface StrengthFactor {
  /** 관계 유형 (멘토, 친구 등) */
  type: string;
  /** 해당 유형의 점수 (0-10) */
  score: number;
  /** 가중치 (0.0 - 1.0) */
  weight: number;
  /** 분류 (friendly | hostile) */
  category: "friendly" | "hostile";
}

/**
 * 비대칭 관계 강도 정보
 */
export interface AsymmetricStrength {
  /** Source → Target 관계 강도 및 산출 근거 */
  sourceToTarget: {
    total: number;
    factors: StrengthFactor[];
  };
  /** Target → Source 관계 강도 및 산출 근거 */
  targetToSource: {
    total: number;
    factors: StrengthFactor[];
  };
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
  /** 관계 고유 ID */
  relationshipId: string;
  /** 프로젝트 ID */
  projectId: string;
  // 캐릭터 정보
  sourceCharacter: AnalysisCharacterInfo;
  targetCharacter: AnalysisCharacterInfo;

  // 양방향 관계 속성 (비대칭 가능)
  /** Source → Target 관점에서의 관계 속성 */
  sourceToTargetAttributes: RelationshipAttributes;
  /** Target → Source 관점에서의 관계 속성 */
  targetToSourceAttributes: RelationshipAttributes;

  // 비대칭 관계 강도 및 계산 근거 (NEW)
  asymmetricStrength: AsymmetricStrength;

  // 타임라인 데이터
  timeline: RelationshipTimelinePoint[];

  // 인사이트
  insights: RelationshipInsights;

  // 기본 관계 정보 (LEGACY - 호환성 위해 유지)
  relationshipTypes: string[];
  currentStrength: number;
  bidirectional?: boolean; // Added
  description?: string; // Added for composite description
  since?: string;

  // === NEW: 추가 분석 정보 ===
  /** 관계 정의 (동상이몽) */
  relationshipDefinition?: RelationshipDefinition;
  /** 진행 중인 이슈 */
  activeIssues?: ActiveIssue[];
  /** 첫 만남 정보 */
  firstEncounter?: EncounterInfo;
  /** 마지막 만남 정보 */
  lastEncounter?: EncounterInfo;
  /** 공동 등장 씬 목록 */
  sharedScenes?: SharedScene[];
  /** 관계 경고 (비대칭, 긴장 등) */
  warnings?: RelationshipWarning[];
}

/**
 * 만남 정보
 */
export interface EncounterInfo {
  eventId: string;
  chapter: string;
  title: string;
  timestamp?: string;
}

/**
 * 공동 등장 씬
 */
export interface SharedScene {
  eventId: string;
  chapter: string;
  title: string;
  description?: string;
  importance: number;
}

/**
 * 관계 경고
 */
export interface RelationshipWarning {
  type: "asymmetry" | "tension" | "conflict";
  severity: "low" | "medium" | "high";
  message: string;
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
