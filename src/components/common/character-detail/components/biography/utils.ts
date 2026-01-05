import type { BiographyEvent } from "@/types/biography";

/** prev_event_id 기반 정렬 */
export function sortEventsByPrevId(events: BiographyEvent[]): BiographyEvent[] {
  if (events.length === 0) return [];
  const firstEvent = events.find((e) => e.prev_event_id === null);
  if (!firstEvent) {
    return [...events].sort((a, b) => a.event_id.localeCompare(b.event_id));
  }
  const sorted: BiographyEvent[] = [firstEvent];
  const usedIds = new Set<string>([firstEvent.event_id]);
  let current = firstEvent;
  while (sorted.length < events.length) {
    const next = events.find(
      (e) => e.prev_event_id === current.event_id && !usedIds.has(e.event_id)
    );
    if (!next) break;
    sorted.push(next);
    usedIds.add(next.event_id);
    current = next;
  }
  events.forEach((e) => {
    if (!usedIds.has(e.event_id)) sorted.push(e);
  });
  return sorted;
}
