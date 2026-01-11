import { useMemo } from "react";
import type { Character } from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";
import type { Event } from "@/types/event";
import { extractRelationshipLinks } from "@/utils/relationshipMapper";
import type { UIRelationType } from "@/components/CharacterGraph/utils";

// Helper: Map biography event type to UI relation type
function mapEventTypeToRelationType(
  eventType: string | undefined | null,
  defaultType: UIRelationType,
): UIRelationType {
  if (!eventType) return defaultType;
  const et = eventType.toLowerCase();
  if (["conflict", "betrayal", "attack", "argument"].includes(et))
    return "hostile";
  if (["confession", "romance", "kiss", "date"].includes(et)) return "romantic";
  if (
    [
      "resolution",
      "reconciliation",
      "alliance",
      "cooperation",
      "help",
    ].includes(et)
  )
    return "friendly";
  return defaultType;
}

// Helper: Character-based Jaccard Similarity for Korean text
function getCharJaccardSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const s1 = new Set(str1.split(""));
  const s2 = new Set(str2.split(""));
  const intersection = new Set([...s1].filter((x) => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Extracts relationship links from a list of characters.
 * Optionally enriches links with event history by matching participants.
 *
 * @param characters - List of characters with relationship data
 * @param events - Optional: Project events to map to relationship history
 * @returns Array of RelationshipLink for use in graph visualization
 */
export function useRelationshipLinks(
  characters: Character[],
  events?: Event[],
): RelationshipLink[] {
  return useMemo(() => {
    const links = extractRelationshipLinks(characters);

    // 이벤트가 없으면 기본 링크 반환
    if (!events || events.length === 0) {
      return links;
    }

    // 캐릭터 ID → 이름 매핑 생성
    const idToName = new Map<string, string>();
    characters.forEach((char) => {
      const id = char._id || (char as { id?: string }).id;
      const name = char.profile?.name || (char as { name?: string }).name;
      if (id && name) {
        idToName.set(id, name);
      }
    });

    // 각 링크에 매칭되는 이벤트를 history로 추가
    return links.map((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      const sourceName = idToName.get(sourceId);
      const targetName = idToName.get(targetId);

      if (!sourceName || !targetName) {
        return link;
      }

      // 두 캐릭터가 모두 참여한 이벤트 필터링 (ID 또는 이름으로 매칭)
      const matchingEvents = events.filter((e) => {
        const hasSource =
          e.participants?.includes(sourceId) ||
          (sourceName && e.participants?.includes(sourceName));
        const hasTarget =
          e.participants?.includes(targetId) ||
          (targetName && e.participants?.includes(targetName));
        return hasSource && hasTarget;
      });

      // Deduplication: Filter out similar events (same time + similar content)
      // Reverse match to keep the latest ones or first ones?
      // Typically we iterate and keep if not similar to existing.
      const uniqueEvents: typeof matchingEvents = [];

      // Sort by timestamp (descending) if possible to prioritize latest info?
      // But timestamp is string. Let's just process in order.
      for (const event of matchingEvents) {
        const isDuplicate = uniqueEvents.some((existing) => {
          // 1. Check time: If timestamps exist and differ, they are distinct events.
          // If both null, we assume they might be duplicates based on text.
          if (existing.timestamp !== event.timestamp) return false;

          // 2. Check Text Similarity
          const similarity = getCharJaccardSimilarity(
            existing.narrativeSummary,
            event.narrativeSummary,
          );
          return similarity > 0.6; // Threshold (60% character match)
        });

        if (!isDuplicate) {
          uniqueEvents.push(event);
        }
      }

      if (uniqueEvents.length === 0) {
        return link;
      }

      // RelationshipEvent 형태로 변환
      const historyEvents = uniqueEvents.map((e) => ({
        eventId: e.eventId,
        title: e.narrativeSummary,
        chapter: e.timestamp || undefined,
        type: mapEventTypeToRelationType(
          e.eventType as string,
          link.type as UIRelationType,
        ) as RelationshipLink["type"],
        reason: e.description,
      }));

      // 링크 자체 설명이 없다면, 가장 최근 이벤트(배열의 마지막)를 요약으로 사용
      let description = link.description;
      if (!description && uniqueEvents.length > 0) {
        // timestamp 기준 정렬이 되어있다고 가정하거나 마지막 요소 사용
        const lastEvent = uniqueEvents[uniqueEvents.length - 1];
        if (lastEvent.narrativeSummary) {
          description = `Last update: ${lastEvent.narrativeSummary}`;
        }
      }

      return {
        ...link,
        description, // Updated description
        history: historyEvents,
      };
    });
  }, [characters, events]);
}
