/**
 * 인물 일대기 시각화 관련 타입 정의
 */

import type { BackendEvent } from "./event";

/** 사건 유형 (API 응답 기반) */
export type BiographyEventType =
  | "action" // 행동
  | "dialogue" // 대화
  | "discovery" // 발견
  | "conflict" // 갈등
  | "resolution" // 해결
  | "transition" // 전환
  | "revelation" // 폭로/깨달음
  | "decision" // 결정
  | "encounter" // 조우
  | "departure" // 출발/이별
  | "arrival" // 도착
  | "transformation" // 변화
  | "birth" // 탄생
  | "death" // 사망
  | "confession" // 고백
  | "narrative" // 서술
  | "other"; // 기타

/** 인물 일대기 사건 데이터 (프론트엔드 타입 - camelCase) */
export interface BiographyEvent {
  eventId: string;
  eventType: BiographyEventType | string;
  narrativeSummary: string; // 제목 역할
  description: string;
  participants: string[]; // 참여 캐릭터들
  locationRef: string | null; // 장소 참조
  prevEventId: string | null; // 이전 이벤트 ID (연결)
  visualScene: string | null; // 시각적 장면 설명
  timestamp: string | null; // 시간 (null 가능)
  importance: number; // 1-10 숫자
  changesMade: unknown | null; // 변화 기록
}

/** 중요도 수준 판별 헬퍼 */
export function getImportanceLevel(importance: number): "major" | "minor" {
  return importance >= 7 ? "major" : "minor";
}

/**
 * BackendEvent → BiographyEvent 변환
 * 백엔드 snake_case를 프론트엔드 camelCase로 변환
 */
export function transformEventToBiography(event: BackendEvent): BiographyEvent {
  return {
    eventId: event.event_id,
    eventType: event.event_type as BiographyEventType,
    narrativeSummary: event.narrative_summary,
    description: event.description,
    participants: event.participants || [],
    locationRef: event.location_ref || null,
    prevEventId: event.prev_event_id || null,
    visualScene: null, // Not available from backend
    timestamp: event.timestamp || null,
    importance: event.importance || 5,
    changesMade: event.changes_made || null,
  };
}

/** 나무 가지 노드 */
export interface BranchNode {
  id: string;
  event: BiographyEvent;
  x: number;
  y: number;
  angle: number; // 가지 각도 (degree)
  depth: number; // 깊이 (0=메인, 1=서브)
}

/** 나무 가지 */
export interface Branch {
  id: string;
  path: string; // SVG path d 속성
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  node: BranchNode;
}

/** 나무 전체 구조 */
export interface TreeStructure {
  trunk: {
    path: string;
    startX: number;
    startY: number;
    endX: number;
  };
  branches: Branch[];
}

/** 나무 설정 */
export interface TreeConfig {
  containerWidth: number;
  containerHeight: number;
  trunkStartX: number; // 좌측 마진
  branchMinLength: number;
  branchMaxLength: number;
  nodeRadius: number;
  nodeSpacing: number;
}

/** 사건 유형별 설정 */
export interface EventTypeConfig {
  label: string;
  color: string;
  accentColor: string;
}

/** 사건 체인 (prev_event_id로 연결된 사건들의 그룹) */
export type EventChain = BiographyEvent[];

/** 체인 기반 가지 구조 */
export interface ChainBranch {
  id: string;
  chainIndex: number;
  isAbove: boolean; // 줄기 위/아래
  events: BiographyEvent[];
  nodes: BranchNode[];
  path: string; // 메인 가지 path
  thickness: number;
}

/** 개선된 나무 구조 */
export interface ImprovedTreeStructure {
  trunk: {
    path: string;
    startX: number;
    startY: number;
    endX: number;
    topEdge: number[]; // 트렁크 상단 Y 좌표들
    bottomEdge: number[]; // 트렁크 하단 Y 좌표들
  };
  chainBranches: ChainBranch[];
}
