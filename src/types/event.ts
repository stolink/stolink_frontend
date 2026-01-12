// =====================================================
// 📅 Event Types - Matched with callback_result.json
// =====================================================

/**
 * 이벤트 타입 (AI 분석 결과)
 */
export type EventType =
  | "confrontation"
  | "dialogue"
  | "action"
  | "discovery"
  | "revelation"
  | "transformation"
  | "conflict"
  | "resolution"
  | "other";

/**
 * 이벤트 엔티티 (AI 분석 결과)
 * Backend field: snake_case → Frontend field: camelCase
 */
export interface Event {
  /** event_id → eventId */
  eventId: string;

  /** event_type → eventType */
  eventType: EventType | string;

  /** narrative_summary → narrativeSummary */
  narrativeSummary: string;

  /** 이벤트 상세 설명 */
  description: string;

  /** 참여 캐릭터 이름 목록 */
  participants: string[];

  /** location_ref → locationRef */
  locationRef: string;

  /** prev_event_id → prevEventId */
  prevEventId: string | null;

  /** 이벤트 발생 시간 */
  timestamp: string | null;

  /** 중요도 (1-10) */
  importance: number;

  /** changes_made → changesMade */
  changesMade: unknown | null;

  /** 임베딩 벡터 (선택적) */
  embedding?: number[];
  /** 챕터 번호 (Neo4j: chapter) */
  chapter?: number;

  /** 순서 (Neo4j: sequenceOrder) */
  sequenceOrder?: number;

  /** 원본 문서 ID 목록 (Neo4j: source_documents) */
  sourceDocuments?: string[];
}

/**
 * 백엔드 이벤트 응답 타입 (snake_case)
 */
export interface BackendEvent {
  event_id: string;
  event_type: string;
  narrative_summary: string;
  description: string;
  participants: string[];
  location_ref?: string; // Standard field
  location?: string; // Detailed string from Neo4j
  prev_event_id: string | null;
  timestamp: string | null;
  importance?: number; // Standard field
  importance_score?: number; // Neo4j field
  changes_made: unknown | null;
  embedding?: number[];
  // New fields from Neo4j schema
  chapter?: number;
  sequenceOrder?: number;
  sequence_order?: number;
  source_documents?: string[];
}

/**
 * 백엔드 이벤트 → 프론트엔드 이벤트 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformBackendEvent(backendEvent: BackendEvent | any): Event {
  return {
    eventId: backendEvent.event_id || backendEvent.eventId || "",
    eventType: (
      (backendEvent.event_type || backendEvent.eventType) as string
    ).toLowerCase() as EventType,
    narrativeSummary:
      backendEvent.narrative_summary || backendEvent.narrativeSummary || "",
    description: backendEvent.description || "",
    participants: backendEvent.participants || [],
    locationRef:
      backendEvent.location_ref ||
      backendEvent.locationRef ||
      backendEvent.location ||
      "",
    prevEventId: backendEvent.prev_event_id || backendEvent.prevEventId || null,
    timestamp: backendEvent.timestamp || null,
    importance: backendEvent.importance || backendEvent.importance_score || 5, // importance matches both
    changesMade: backendEvent.changes_made || backendEvent.changesMade || null,
    embedding: backendEvent.embedding,
    chapter: backendEvent.chapter,
    sequenceOrder: backendEvent.sequenceOrder ?? backendEvent.sequence_order,
    sourceDocuments:
      backendEvent.sourceDocuments ?? backendEvent.source_documents,
  };
}
