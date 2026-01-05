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
  location_ref: string;
  prev_event_id: string | null;
  timestamp: string | null;
  importance: number;
  changes_made: unknown | null;
  embedding?: number[];
}

/**
 * 백엔드 이벤트 → 프론트엔드 이벤트 변환
 */
export function transformBackendEvent(backendEvent: BackendEvent): Event {
  return {
    eventId: backendEvent.event_id,
    eventType: backendEvent.event_type as EventType,
    narrativeSummary: backendEvent.narrative_summary,
    description: backendEvent.description,
    participants: backendEvent.participants,
    locationRef: backendEvent.location_ref,
    prevEventId: backendEvent.prev_event_id,
    timestamp: backendEvent.timestamp,
    importance: backendEvent.importance,
    changesMade: backendEvent.changes_made,
    embedding: backendEvent.embedding,
  };
}
