// =====================================================
// 📦 Character Types - New Backend Schema
// =====================================================

// =====================================================
// 🔗 Relationship Types
// =====================================================

/**
 * 관계 타입 (callback_result.json 기반 확장)
 * Backend uses uppercase, frontend accepts both for compatibility
 */
export type RelationType =
  | "ALLY"
  | "RIVAL"
  | "NEUTRAL"
  | "ROMANTIC"
  | "ENEMY"
  | "MENTOR"
  | "FAMILY"
  // Legacy lowercase values for backward compatibility
  | "friendly"
  | "hostile"
  | "romantic";

// Legacy aliases for compatibility
export type BackendRelationshipType = RelationType;
export type RelationshipType = RelationType;

/**
 * 캐릭터 역할
 */
export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";

// =====================================================
// 📊 Character Sub-Types (New Schema)
// =====================================================

/**
 * 프로필 내 성격 정보 (callback_result.json schema)
 * Backend fields: core_traits, flaws, values
 */
export interface ProfilePersonality {
  coreTraits: string[]; // core_traits from backend
  flaws: string[];
  values: string[];
}

/**
 * 캐릭터 프로필 정보
 */
export interface CharacterProfile {
  characterId: string;
  name: string;
  age: number | null;
  gender: string;
  race: string;
  mbti: string | null;
  /** personality는 이제 객체입니다 (callback_result.json 기준) */
  personality: ProfilePersonality;
  backstory: string;
  occupation?: string;
  birthplace?: string;
  family?: string;
  faction: {
    name: string | null;
    social: {
      rank: string;
      influence: number;
      factionReputation: Record<string, unknown>;
    };
  };
}

/**
 * 캐릭터 외모 정보
 */
export interface CharacterAppearance {
  physique: string;
  skinTone: string;
  eyes: string;
  nose: string;
  mouth: string;
  hairStyle: string;
  hairColor: string;
  attire: string[];
  expression: string;
  scarsTattoos: string[];
  styleContext: {
    artStyle: string;
  };
}

/**
 * 캐릭터 성격 정보
 */
export interface CharacterPersonality {
  coreTraits: string[];
  strengths?: string[]; // Added
  flaws: string[]; // Weaknesses
  values: string[];
}

// ... (Rest of interfaces)

/**
 * 캐릭터 관계 (임베딩된 그래프 노드)
 * callback_result.json schema: relations.graph[]
 */
export interface CharacterRelation {
  target: string;
  type: RelationType | string; // String for flexibility with new types
  history: string | null;
  strength: number;
  description: string;
  /** public_stance from backend */
  publicStance?: string;
  /** private_feeling from backend */
  privateFeeling?: string;
  /** revealed_in_chapter for 4D Timeline */
  revealedInChapter?: number;
}

/**
 * 캐릭터 관계 정보 컨테이너
 */
export interface CharacterRelations {
  graph: CharacterRelation[];
  eventRefs: string[];
  locationContext: string;
}

/**
 * 캐릭터 현재 감정 상태
 */
export interface CharacterMood {
  emotion: string;
  intensity: number;
  trigger: string | null;
}

/**
 * 인벤토리 아이템
 */
export interface InventoryItem {
  itemId: string;
  name: string;
  description: string;
}

/**
 * 캐릭터 메타 정보
 */
export interface CharacterMeta {
  createdAt: string | null;
  updatedAt: string | null;
  dataVersion: string;
  lockVersion: number;
}

/**
 * 캐릭터 (새 백엔드 스키마)
 */
export interface Character {
  _id: string;
  projectId: string;
  role: CharacterRole;
  profile: CharacterProfile;
  aliases: string[];
  status: string;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  relations: CharacterRelations;
  currentMood: CharacterMood;
  inventory: InventoryItem[];
  meta: CharacterMeta;
  imageUrl?: string;
  embedding?: number[];
  motivation?: string; // Added,
  firstAppearance?: string; // Added,
  graphPosition?: { x: number; y: number }; // Added for D3 graph persistence
}

// =====================================================
// 🔄 Legacy Compatibility Layer
// =====================================================

/**
 * @deprecated Use Character.relations.graph instead
 * 하위 호환성을 위한 레거시 관계 인터페이스
 */
export interface BackendRelationship {
  id?: string | number;
  target: string;
  type: RelationType;
  strength: number;
  label?: string | null;
  since?: string | null;
  description?: string;
  bidirectional?: boolean;
  evolved_from?: RelationType;
  history?: RelationshipEvent[] | string;
}

/**
 * 관계 변화 이벤트
 */
export interface RelationshipEvent {
  eventId: string;
  title: string;
  chapter?: string;
  type: RelationType;
  reason?: string;
  date?: string;
}

/**
 * 독립 relationships 컬렉션용 스키마 (source 포함)
 */
export interface Relationship {
  source: string;
  target: string;
  type: string;
  strength: number;
  description?: string;
  history?: string | RelationshipEvent[];
}

/**
 * 상세 관계 정보 (D3 그래프용 확장)
 */
export interface DetailedRelationship extends Relationship {
  id?: string;
  relationType?: RelationType;
  label?: string | null;
  since?: string | null;
  bidirectional?: boolean;
  evolvedFrom?: RelationType | null;
}

/**
 * @deprecated Use Character.relations.graph instead
 */
export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  strength: number;
  extras?: Record<string, string | number | boolean>;
}

// =====================================================
// 🛠️ Helper Functions
// =====================================================

/**
 * Character._id를 id로 접근할 수 있게 하는 헬퍼
 * @deprecated 새 코드에서는 _id를 직접 사용
 */
export function getCharacterId(char: Character): string {
  return char._id;
}

/**
 * Character.profile.name을 간편하게 접근
 */
export function getCharacterName(char: Character): string {
  return char.profile.name;
}

/**
 * Character.profile.faction.name을 간편하게 접근
 */
export function getCharacterFaction(char: Character): string {
  return char.profile.faction?.name || "무소속";
}

/**
 * 관계 배열을 가져오는 헬퍼 (레거시 호환)
 */
export function getCharacterRelationships(
  char: Character
): CharacterRelation[] {
  return char.relations?.graph || [];
}

// =====================================================
// 📍 Place Types (Unchanged)
// =====================================================

export interface Place {
  id: string;
  projectId: string;
  name: string;
  type?: PlaceType;
  imageUrl?: string;
  extras?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
}

export type PlaceType = "region" | "building" | "special" | "other";

// =====================================================
// ⚔️ Item Types (Unchanged)
// =====================================================

export interface Item {
  id: string;
  projectId: string;
  name: string;
  type?: ItemType;
  currentOwnerId?: string;
  imageUrl?: string;
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

// =====================================================
// 🧪 Simple Character Interface (Integration Test)
// =====================================================

export interface SimpleCharacter {
  name: string;
  role: string;
  relationships: {
    targetCharacterName: string;
    type: string;
  }[];
}
