/**
 * Character Importance Calculator
 *
 * 다각도 중요도 산출 알고리즘:
 * - 네트워크 중심성 (40%)
 * - 서사적 노출도 (30%)
 * - 캐릭터 설정 밀도 (20%)
 * - 역할 가중치 (10%)
 */

import type { Character, CharacterRole, RelationshipLink } from "@/types";
import type { UIRelationType } from "@/components/CharacterGraph/constants";

// =====================================================
// 📊 타입 정의
// =====================================================

export interface CharacterImportance {
  id: string;
  name: string;
  score: number; // 0-100 최종 점수
  networkScore: number; // 네트워크 중심성 (0-100)
  narrativeScore: number; // 서사적 노출도 (0-100)
  attributeScore: number; // 캐릭터 설정 밀도 (0-100)
  roleScore: number; // 역할 가중치 (0-100)
}

export interface ImportanceWeights {
  network: number; // 기본 0.4
  narrative: number; // 기본 0.3
  attribute: number; // 기본 0.2
  role: number; // 기본 0.1
}

export interface SceneData {
  id: string;
  characterIds: string[];
  beatType?: "SETUP" | "RISING" | "CRISIS" | "CLIMAX" | "RESOLUTION";
}

// =====================================================
// ⚙️ 기본 설정
// =====================================================

export const DEFAULT_WEIGHTS: ImportanceWeights = {
  network: 0.4,
  narrative: 0.3,
  attribute: 0.2,
  role: 0.1,
};

// 역할별 기본 가중치
const ROLE_WEIGHTS: Record<CharacterRole, number> = {
  protagonist: 1.0,
  antagonist: 0.9,
  mentor: 0.7,
  supporting: 0.5,
  sidekick: 0.4,
  other: 0.2,
};

// 관계 유형별 가중치 (갈등 중심 인물 강조)
const RELATION_TYPE_WEIGHTS: Partial<Record<UIRelationType, number>> = {
  hostile: 1.2, // 갈등의 중심
  romantic: 1.1, // 서사적 중요도
  friendly: 1.0, // 기본
  mentor: 1.1,
  family: 1.0,
  rival: 1.1,
  neutral: 0.8,
  complex: 1.1,
};

// 비트 유형별 가중치
const BEAT_TYPE_WEIGHTS: Record<string, number> = {
  CLIMAX: 2.0,
  CRISIS: 1.8,
  RISING: 1.2,
  RESOLUTION: 1.1,
  SETUP: 1.0,
};

// =====================================================
// 📈 네트워크 중심성 계산
// =====================================================

// Pre-computed link index for O(1) lookup (성능 최적화)
export interface LinkIndex {
  byCharacter: Map<string, { link: RelationshipLink; isSource: boolean }[]>;
  totalLinks: number;
}

/**
 * 링크 인덱스 생성 (일괄 계산 전 호출)
 * O(m) 복잡도로 한 번만 실행
 */
export function buildLinkIndex(links: RelationshipLink[]): LinkIndex {
  const byCharacter = new Map<
    string,
    { link: RelationshipLink; isSource: boolean }[]
  >();

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;

    // Source 캐릭터 등록
    if (!byCharacter.has(sourceId)) {
      byCharacter.set(sourceId, []);
    }
    byCharacter.get(sourceId)!.push({ link, isSource: true });

    // Target 캐릭터 등록
    if (!byCharacter.has(targetId)) {
      byCharacter.set(targetId, []);
    }
    byCharacter.get(targetId)!.push({ link, isSource: false });
  }

  return { byCharacter, totalLinks: links.length };
}

/**
 * 네트워크 기반 중요도 계산 (인덱스 사용 버전 - O(k) where k = 연결 수)
 */
export function calculateNetworkImportanceWithIndex(
  characterId: string,
  linkIndex: LinkIndex
): number {
  const characterLinks = linkIndex.byCharacter.get(characterId);
  if (!characterLinks || characterLinks.length === 0) return 0;

  let totalScore = 0;
  const connectionCount = characterLinks.length;

  for (let i = 0; i < connectionCount; i++) {
    const { link } = characterLinks[i];
    // 강도 가중치 (1-10 → 0.1-1.0)
    const strengthWeight = (link.strength || 5) / 10;
    // 관계 유형 가중치
    const typeWeight =
      RELATION_TYPE_WEIGHTS[link.type as UIRelationType] || 1.0;
    totalScore += strengthWeight * typeWeight;
  }

  // 정규화: 최대 연결 수 기준
  const maxConnections = Math.max(linkIndex.totalLinks / 2, 1);
  const normalizedDegree = Math.min(connectionCount / maxConnections, 1);

  // 평균 가중치 점수
  const avgWeightedScore = totalScore / connectionCount;

  // 최종 네트워크 점수 (연결 수 60% + 가중 점수 40%)
  return (normalizedDegree * 0.6 + avgWeightedScore * 0.4) * 100;
}

/**
 * 네트워크 기반 중요도 계산 (기존 호환성 유지)
 * @deprecated Use calculateNetworkImportanceWithIndex for better performance
 */
export function calculateNetworkImportance(
  characterId: string,
  links: RelationshipLink[]
): number {
  if (links.length === 0) return 0;

  let totalScore = 0;
  let connectionCount = 0;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;

    if (sourceId === characterId || targetId === characterId) {
      connectionCount++;
      const strengthWeight = (link.strength || 5) / 10;
      const typeWeight =
        RELATION_TYPE_WEIGHTS[link.type as UIRelationType] || 1.0;
      totalScore += strengthWeight * typeWeight;
    }
  }

  if (connectionCount === 0) return 0;

  const maxConnections = Math.max(links.length / 2, 1);
  const normalizedDegree = Math.min(connectionCount / maxConnections, 1);
  const avgWeightedScore = totalScore / connectionCount;

  return (normalizedDegree * 0.6 + avgWeightedScore * 0.4) * 100;
}

// =====================================================
// 📚 서사적 노출도 계산
// =====================================================

/**
 * 서사적 노출도 계산
 * - 씬 등장 빈도
 * - 비트 유형 가중치 (CLIMAX, CRISIS 강조)
 */
export function calculateNarrativeExposure(
  characterId: string,
  scenes: SceneData[]
): number {
  if (scenes.length === 0) return 0;

  let totalScore = 0;
  let appearanceCount = 0;

  scenes.forEach((scene) => {
    if (scene.characterIds?.includes(characterId)) {
      appearanceCount++;

      // 비트 유형 가중치
      const beatWeight = scene.beatType
        ? BEAT_TYPE_WEIGHTS[scene.beatType] || 1.0
        : 1.0;

      totalScore += beatWeight;
    }
  });

  if (appearanceCount === 0) return 0;

  // 정규화: 전체 씬의 50%에 등장하면 100점
  const normalizedAppearance = Math.min(
    appearanceCount / (scenes.length * 0.5),
    1
  );

  // 평균 비트 가중치
  const avgBeatWeight = totalScore / appearanceCount;

  // 최종 서사 점수 (등장 빈도 70% + 비트 가중치 30%)
  return (normalizedAppearance * 0.7 + (avgBeatWeight / 2) * 0.3) * 100;
}

// =====================================================
// 🎭 캐릭터 속성 기반 점수
// =====================================================

/**
 * 캐릭터 설정 밀도 계산
 * - extras 필드 개수
 * - 텍스트 필드 길이
 */
export function calculateAttributeScore(character: Character): number {
  let score = 0;

  // 기본 필드 체크 (있으면 점수 부여) - 새 스키마에는 imageUrl 없음
  if (character.profile?.faction?.name) score += 10;

  // personality 필드 밀도
  if (character.personality) {
    const { coreTraits, flaws, values } = character.personality;
    const totalItems =
      (coreTraits?.length || 0) + (flaws?.length || 0) + (values?.length || 0);
    score += Math.min(totalItems * 3, 30); // 최대 30점
  }

  // profile.backstory 길이 기반 점수
  if (character.profile?.backstory && character.profile.backstory.length > 50) {
    score += Math.min(character.profile.backstory.length / 100, 10); // 최대 10점
  }

  // 관계 수 반영 (새 스키마: relations.graph)
  if (character.relations?.graph?.length ?? 0 > 0) {
    score += Math.min((character.relations?.graph?.length ?? 0) * 3, 20); // 최대 20점
  }

  // 0-100으로 정규화
  return Math.min(score, 100);
}

// =====================================================
// 👑 역할 가중치 계산
// =====================================================

/**
 * 캐릭터 역할 기반 가중치
 */
export function calculateRoleWeight(role?: CharacterRole): number {
  const weight = ROLE_WEIGHTS[role || "other"];
  return weight * 100;
}

// =====================================================
// 🎯 최종 중요도 점수 계산
// =====================================================

/**
 * 종합 중요도 점수 계산 (인덱스 사용 - 성능 최적화)
 */
export function calculateImportanceScoreFast(
  character: Character,
  linkIndex: LinkIndex,
  scenes: SceneData[] = [],
  weights: ImportanceWeights = DEFAULT_WEIGHTS
): CharacterImportance {
  const networkScore = calculateNetworkImportanceWithIndex(
    character._id,
    linkIndex
  );
  const narrativeScore = calculateNarrativeExposure(character._id, scenes);
  const attributeScore = calculateAttributeScore(character);
  const roleScore = calculateRoleWeight(character.role);

  const finalScore =
    networkScore * weights.network +
    narrativeScore * weights.narrative +
    attributeScore * weights.attribute +
    roleScore * weights.role;

  return {
    id: character._id,
    name: character.profile?.name || "Unknown",
    score: Math.round(finalScore * 10) / 10,
    networkScore: Math.round(networkScore * 10) / 10,
    narrativeScore: Math.round(narrativeScore * 10) / 10,
    attributeScore: Math.round(attributeScore * 10) / 10,
    roleScore: Math.round(roleScore * 10) / 10,
  };
}

/**
 * 종합 중요도 점수 계산 (기존 호환성 유지)
 */
export function calculateImportanceScore(
  character: Character,
  links: RelationshipLink[],
  scenes: SceneData[] = [],
  weights: ImportanceWeights = DEFAULT_WEIGHTS
): CharacterImportance {
  const networkScore = calculateNetworkImportance(character._id, links);
  const narrativeScore = calculateNarrativeExposure(character._id, scenes);
  const attributeScore = calculateAttributeScore(character);
  const roleScore = calculateRoleWeight(character.role);

  const finalScore =
    networkScore * weights.network +
    narrativeScore * weights.narrative +
    attributeScore * weights.attribute +
    roleScore * weights.role;

  return {
    id: character._id,
    name: character.profile?.name || "Unknown",
    score: Math.round(finalScore * 10) / 10,
    networkScore: Math.round(networkScore * 10) / 10,
    narrativeScore: Math.round(narrativeScore * 10) / 10,
    attributeScore: Math.round(attributeScore * 10) / 10,
    roleScore: Math.round(roleScore * 10) / 10,
  };
}

/**
 * 모든 캐릭터의 중요도 일괄 계산 (최적화 버전)
 * - 링크 인덱스를 한 번만 생성하여 재사용
 * - O(n*m) → O(n+m) 복잡도 개선
 */
export function calculateAllImportanceScoresBatch(
  characters: Character[],
  links: RelationshipLink[],
  scenes: SceneData[] = [],
  weights: ImportanceWeights = DEFAULT_WEIGHTS
): CharacterImportance[] {
  // 링크 인덱스 한 번 생성
  const linkIndex = buildLinkIndex(links);

  const results: CharacterImportance[] = new Array(characters.length);

  for (let i = 0; i < characters.length; i++) {
    results[i] = calculateImportanceScoreFast(
      characters[i],
      linkIndex,
      scenes,
      weights
    );
  }

  // 높은 점수 순 정렬
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * 모든 캐릭터의 중요도 일괄 계산 (기존 호환성)
 * @deprecated Use calculateAllImportanceScoresBatch for better performance
 */
export function calculateAllImportanceScores(
  characters: Character[],
  links: RelationshipLink[],
  scenes: SceneData[] = [],
  weights: ImportanceWeights = DEFAULT_WEIGHTS
): CharacterImportance[] {
  return characters
    .map((char) => calculateImportanceScore(char, links, scenes, weights))
    .sort((a, b) => b.score - a.score); // 높은 점수 순 정렬
}

/**
 * 중요도 점수를 노드 크기로 변환
 * @param score 0-100 중요도 점수
 * @param minSize 최소 노드 크기 (기본 30)
 * @param maxSize 최대 노드 크기 (기본 80)
 */
export function importanceToNodeSize(
  score: number,
  minSize: number = 50,
  maxSize: number = 100
): number {
  // 0-100 점수를 minSize-maxSize 범위로 매핑
  const normalized = Math.max(0, Math.min(score, 100)) / 100;
  return minSize + normalized * (maxSize - minSize);
}
