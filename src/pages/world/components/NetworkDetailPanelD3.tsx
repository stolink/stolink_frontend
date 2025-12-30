import { X, Users, BookOpen, User, Heart, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character, RelationshipLink, RelationType } from "@/types";
import {
  RELATION_LABELS,
  ROLE_LABELS,
} from "@/components/CharacterGraph/constants";
import { cn } from "@/lib/utils";

// 관계 타입별 색상 클래스
const RELATION_BADGE_COLORS: Record<RelationType, string> = {
  friendly: "bg-[#7A8C6F] text-white border-[#7A8C6F]",
  hostile: "bg-[#9C4A3F] text-white border-[#9C4A3F]",
  romantic: "bg-[#B38B82] text-white border-[#B38B82]",
};

// 관계 타입별 아이콘
const RELATION_ICONS: Record<RelationType, React.ReactNode> = {
  friendly: <User className="w-3 h-3" />,
  hostile: <Skull className="w-3 h-3" />,
  romantic: <Heart className="w-3 h-3" />,
};

// 역할별 색상
const ROLE_COLORS: Record<string, string> = {
  protagonist: "bg-primary/10 text-primary border-primary/30",
  antagonist: "bg-rose-50 text-rose-600 border-rose-200",
  mentor: "bg-amber-50 text-amber-600 border-amber-200",
  sidekick: "bg-emerald-50 text-emerald-600 border-emerald-200",
  supporting: "bg-stone-100 text-stone-600 border-stone-200",
  other: "bg-stone-100 text-stone-600 border-stone-200",
};

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

  const roleLabel = ROLE_LABELS[selectedCharacter.role || "other"];
  const roleColor = ROLE_COLORS[selectedCharacter.role || "other"];

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 z-10 bg-white rounded-xl border-2 border-stone-300 shadow-2xl overflow-hidden flex flex-col ring-1 ring-stone-200">
      {/* Header */}
      <div className="p-5 bg-gradient-to-br from-stone-100 to-stone-50 border-b-2 border-stone-200">
        <div className="flex items-start justify-between mb-4">
          <Badge variant="outline" className={cn("text-xs", roleColor)}>
            {roleLabel}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-stone-400 hover:text-stone-600 hover:bg-stone-100 -mr-2 -mt-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Profile Image */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center text-2xl border border-stone-200 shadow-sm">
            {selectedCharacter.imageUrl ? (
              <img
                src={selectedCharacter.imageUrl}
                alt={selectedCharacter.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : selectedCharacter.role === "protagonist" ? (
              "🦸"
            ) : selectedCharacter.role === "antagonist" ? (
              "🦹"
            ) : selectedCharacter.role === "mentor" ? (
              "🧙"
            ) : (
              "👤"
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">
              {selectedCharacter.name}
            </h3>
            {selectedCharacter.faction && (
              <p className="text-sm text-stone-500">
                {selectedCharacter.faction}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg border border-stone-100 shadow-sm">
            <div className="text-2xl font-bold text-stone-800">
              {connectedLinks.length}
            </div>
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
              관계 수
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-stone-100 shadow-sm">
            <div className="text-2xl font-bold text-stone-800">-</div>
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
              등장 횟수
            </div>
          </div>
        </div>
      </div>

      {/* Connected Characters */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            연결된 인물
          </h4>

          {connectedLinks.length > 0 ? (
            <ul className="space-y-2">
              {connectedLinks.map((link) => {
                const sourceId =
                  typeof link.source === "string"
                    ? link.source
                    : link.source.id;
                const targetId =
                  typeof link.target === "string"
                    ? link.target
                    : link.target.id;
                const otherId =
                  sourceId === selectedCharacter.id ? targetId : sourceId;
                const otherChar = characters.find((c) => c.id === otherId);
                const relType = link.type;

                return (
                  <li
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-base border border-stone-200 shadow-sm">
                      {otherChar?.imageUrl ? (
                        <img
                          src={otherChar.imageUrl}
                          alt={otherChar.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : otherChar?.role === "antagonist" ? (
                        "🦹"
                      ) : otherChar?.role === "mentor" ? (
                        "🧙"
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-stone-800 truncate">
                        {otherChar?.name}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-1 text-[10px] px-1.5 py-0 h-5 gap-1",
                          RELATION_BADGE_COLORS[relType]
                        )}
                      >
                        {RELATION_ICONS[relType]}
                        {RELATION_LABELS[relType]}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone-400 italic text-center py-4">
              연결된 인물이 없습니다
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4 bg-stone-100 border-t-2 border-stone-200">
        <Button
          variant="default"
          className="w-full bg-[#8B7355] hover:bg-[#6F5B44] text-white font-semibold shadow-md border border-[#6F5B44]"
          onClick={onViewProfile}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          상세 프로필 보기
        </Button>
      </div>
    </div>
  );
}
