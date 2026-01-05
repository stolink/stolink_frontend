import type { BiographyEvent } from "@/types/biography";

/** prevEventId 기반 정렬 */
export function sortEventsByPrevId(events: BiographyEvent[]): BiographyEvent[] {
  if (events.length === 0) return [];
  const firstEvent = events.find((e) => e.prevEventId === null);
  if (!firstEvent) {
    return [...events].sort((a, b) => a.eventId.localeCompare(b.eventId));
  }
  const sorted: BiographyEvent[] = [firstEvent];
  const usedIds = new Set<string>([firstEvent.eventId]);
  let current = firstEvent;
  while (sorted.length < events.length) {
    const next = events.find(
      (e) => e.prevEventId === current.eventId && !usedIds.has(e.eventId),
    );
    if (!next) break;
    sorted.push(next);
    usedIds.add(next.eventId);
    current = next;
  }
  events.forEach((e) => {
    if (!usedIds.has(e.eventId)) sorted.push(e);
  });
  return sorted;
}
