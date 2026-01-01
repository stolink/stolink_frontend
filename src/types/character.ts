// =====================================================
// 📦 Character Types - New Backend Schema
// =====================================================

// =====================================================
// 🔗 Relationship Types
// =====================================================

/**
 * 관계 타입 (3종으로 단순화)
 */
export type RelationType = "friendly" | "hostile" | "romantic";

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
 * 캐릭터 프로필 정보
 */
export interface CharacterProfile {
  character_id: string;
  name: string;
  age: number | null;
  gender: string;
  race: string;
  mbti: string | null;
  personality: string[];
  backstory: string;
  faction: {
    name: string;
    social: {
      rank: string;
      influence: number;
      faction_reputation: Record<string, unknown>;
    };
  };
}

/**
 * 캐릭터 외모 정보
 */
export interface CharacterAppearance {
  physique: string;
  skin_tone: string;
  eyes: string;
  nose: string;
  mouth: string;
  hair_style: string;
  hair_color: string;
  attire: string[];
  expression: string;
  scars_tattoos: string[];
  style_context: {
    art_style: string;
  };
}

/**
 * 캐릭터 성격 정보
 */
export interface CharacterPersonality {
  core_traits: string[];
  flaws: string[];
  values: string[];
}

/**
 * 캐릭터 관계 (임베딩된 그래프 노드)
 */
export interface CharacterRelation {
  source: string;
  target: string;
  relation_type: RelationType;
  strength: number;
  description: string;
  bidirectional: boolean;
  public_stance?: string;
  private_feeling?: string;
  evolved_from?: RelationType | null;
}

/**
 * 캐릭터 관계 정보 컨테이너
 */
export interface CharacterRelations {
  graph: CharacterRelation[];
  event_refs: string[];
  location_context: string;
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
  item_id: string | null;
  name: string;
  quantity: number;
  rarity: string;
  estimated_value: number;
  equipped: boolean;
  slot: string;
  description: string;
}

/**
 * 캐릭터 인벤토리
 */
export interface CharacterInventory {
  equipped_items: InventoryItem[];
  bag_items: InventoryItem[];
  quest_items: string[];
}

/**
 * 캐릭터 메타 정보
 */
export interface CharacterMeta {
  created_at: string | null;
  updated_at: string | null;
  data_version: string;
  lock_version: number;
}

// =====================================================
// 👤 Main Character Interface (New Schema)
// =====================================================

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
  current_mood: CharacterMood;
  inventory: CharacterInventory;
  meta: CharacterMeta;
  /** AI 생성 이미지 URL (다른 파이프라인에서 폴링) */
  imageUrl?: string;
  embedding?: number[];
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
 * 상세 관계 정보 (D3 그래프용 확장)
 */
export interface DetailedRelationship extends BackendRelationship {
  source: string;
  target: string;
  relation_type: RelationType;
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
  char: Character,
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
