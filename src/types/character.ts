// Character Types with flexible extras pattern

export interface Character {
  // === 필수 필드 ===
  id: string;
  projectId: string;
  name: string;

  // === 주요 선택 필드 (UI에서 별도 표시) ===
  role?: CharacterRole;
  imageUrl?: string;

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

export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number; // 1-10, 관계 강도

  // 동적 추가 정보 (관계 설명, 시작 시점 등)
  extras?: Record<string, string | number | boolean>;
}

export type RelationshipType = "friendly" | "hostile" | "neutral";

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
