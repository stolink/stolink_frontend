import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Character } from "@/types";
import type { RelationshipLink } from "@/components/CharacterGraph/types";
import {
  RELATION_LABELS,
  RELATION_COLORS,
  ROLE_LABELS,
} from "@/components/CharacterGraph/constants";

interface NetworkDetailPanelD3Props {
  selectedCharacter: Character | null;
  characters: Character[];
  links: RelationshipLink[];
  onClose: () => void;
  onViewProfile: () => void;
}

export function NetworkDetailPanelD3({
  selectedCharacter,
  characters,
  links,
  onClose,
  onViewProfile,
}: NetworkDetailPanelD3Props) {
  if (!selectedCharacter) return null;

  // 연결된 링크 찾기
  const connectedLinks = links.filter((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    return (
      sourceId === selectedCharacter.id || targetId === selectedCharacter.id
    );
  });

  return (
    <div className="absolute right-4 top-4 bottom-4 w-72 z-10 bg-white rounded-lg border shadow-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl border-2 border-stone-200">
            {selectedCharacter.role === "protagonist"
              ? "🦸"
              : selectedCharacter.role === "antagonist"
                ? "🦹"
                : selectedCharacter.role === "mentor"
                  ? "🧙"
                  : "👤"}
          </div>
          <div>
            <h3 className="font-semibold">{selectedCharacter.name}</h3>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABELS[selectedCharacter.role || "other"]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-stone-800">
              {connectedLinks.length}
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              Connections
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-800">-</div>
            <div className="text-xs text-muted-foreground uppercase">
              Scenes
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Direct Links</h4>
        </div>
        <ul className="space-y-2">
          {connectedLinks.map((link) => {
            const sourceId =
              typeof link.source === "string" ? link.source : link.source.id;
            const targetId =
              typeof link.target === "string" ? link.target : link.target.id;
            const otherId =
              sourceId === selectedCharacter.id ? targetId : sourceId;
            const otherChar = characters.find((c) => c.id === otherId);
            const relType = link.type;

            return (
              <li
                key={link.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50"
              >
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm">
                  {otherChar?.role === "antagonist"
                    ? "🦹"
                    : otherChar?.role === "mentor"
                      ? "🧙"
                      : "👤"}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{otherChar?.name}</div>
                  <div
                    className="text-xs"
                    style={{ color: RELATION_COLORS[relType] }}
                  >
                    • {RELATION_LABELS[relType]}
                    {link.label && ` (${link.label})`}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" onClick={onViewProfile}>
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
