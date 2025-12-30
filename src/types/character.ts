// Character Types with flexible extras pattern

// 백엔드 RelationshipType 정의 (5종 - 백엔드 스펙)
export type BackendRelationshipType = "friendly" | "hostile" | "romantic";

// 백엔드에서 반환하는 관계 구조 (Neo4j)
export interface BackendRelationship {
  id: number; // Neo4j internal ID
  target: string; // Target character ID
  type: BackendRelationshipType;
  strength: number; // 1-10
  label?: string | null;
  since?: string | null;
}

export interface Character {
  // === 필수 필드 ===
  id: string;
  projectId: string;
  name: string;

  // === 주요 선택 필드 (UI에서 별도 표시) ===
  role?: CharacterRole;
  faction?: string | null; // 소속/세력 (그룹화 기준)
  imageUrl?: string;

  // === 관계 정보 (백엔드에서 항상 포함) ===
  relationships: BackendRelationship[];

  // === 동적 추가 정보 ===
  extras?: Record<string, string | number | boolean | string[]>;

  // === 메타 정보 ===
  createdAt: string;
  updatedAt: string;
}

export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";

// 기존 타입 호환성 유지
export type RelationshipType = BackendRelationshipType;

/**
 * @deprecated Use Character.relationships instead
 * 이 타입은 하위 호환성을 위해 유지되며, 향후 제거될 예정입니다.
 */
export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number; // 1-10, 관계 강도

  // 동적 추가 정보 (관계 설명, 시작 시점 등)
  extras?: Record<string, string | number | boolean>;
}

// =====================================================
// 📍 장소 타입 (새로 추가)
// =====================================================
export interface Place {
  id: string;
  projectId: string;
  name: string;

  // 주요 선택 필드
  type?: PlaceType;
  imageUrl?: string;

  // 동적 추가 정보 (위치, 역사, 특징 등)
  extras?: Record<string, string | number | boolean | string[]>;

  createdAt: string;
  updatedAt: string;
}

export type PlaceType = "region" | "building" | "special" | "other";

// =====================================================
// ⚔️ 아이템 타입 (새로 추가)
// =====================================================
export interface Item {
  id: string;
  projectId: string;
  name: string;

  // 주요 선택 필드
  type?: ItemType;
  currentOwnerId?: string; // 현재 소유자 캐릭터 ID
  imageUrl?: string;

  // 동적 추가 정보 (능력, 역사, 특징 등)
  extras?: Record<string, string | number | boolean | string[]>;

  createdAt: string;
  updatedAt: string;
}

export type ItemType =
  | "weapon"
  | "accessory"
  | "document"
  | "consumable"
  | "other";
