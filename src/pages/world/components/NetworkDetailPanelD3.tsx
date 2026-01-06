import {
  X,
  Users,
  BookOpen,
  User,
  Heart,
  Skull,
  Network,
  TrendingUp,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { Badge } from "@stolink/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character, RelationshipLink } from "@/types";
import {
  RELATION_LABELS,
  ROLE_LABELS,
  type UIRelationType,
} from "@/components/CharacterGraph/constants";
import { cn } from "@/lib/utils";

// 관계 타입별 색상 클래스
const RELATION_BADGE_COLORS: Record<UIRelationType, string> = {
  friendly: "bg-emerald-500 text-white border-emerald-500",
  hostile: "bg-rose-500 text-white border-rose-500",
  romantic: "bg-pink-400 text-white border-pink-400",
};

// 관계 타입별 아이콘
const RELATION_ICONS: Record<UIRelationType, React.ReactNode> = {
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
      sourceId === selectedCharacter._id || targetId === selectedCharacter._id
    );
  });

  const roleLabel = ROLE_LABELS[selectedCharacter.role || "other"];
  const roleColor = ROLE_COLORS[selectedCharacter.role || "other"];

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 z-20 bg-white border border-cloud-200 rounded-2xl overflow-hidden flex flex-col editorial-fade-in shadow-paper-floating">
      {/* Editorial Header */}
      <div className="p-6 bg-white border-b border-cloud-100">
        <div className="flex items-start justify-between mb-5">
          <Badge
            intent="outline"
            className={cn("text-xs font-medium", roleColor)}
          >
            {roleLabel}
          </Badge>
          <Button
            intent="ghost"
            size="icon"
            className="h-8 w-8 text-stone-400 hover:text-stone-600 hover:bg-stone-50 -mr-2 -mt-2 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Profile Image - Larger */}
          <div className="w-20 h-20 rounded-2xl bg-cloud-50 border border-cloud-200 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
            {selectedCharacter.imageUrl ? (
              <img
                src={selectedCharacter.imageUrl}
                alt={selectedCharacter.profile?.name || ""}
                className="w-full h-full object-cover"
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
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-stone-900 truncate tracking-tight">
              {selectedCharacter.profile?.name || "이름 없음"}
            </h3>
            {selectedCharacter.profile?.faction?.name && (
              <p className="magazine-caption text-xs not-italic text-stone-400 mt-1">
                {selectedCharacter.profile.faction.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats with Icons & Gradient */}
      <div className="px-5 py-4 border-b border-cloud-50">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-cloud-50 border border-cloud-100 rounded-xl group hover:border-mocha-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-mocha-500" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                관계 인물
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {connectedLinks.length}
            </div>
          </div>
          <div className="p-4 bg-cloud-50 border border-cloud-100 rounded-xl group hover:border-mocha-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-mocha-500" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                등장 횟수
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900">-</div>
          </div>
        </div>
      </div>

      {/* Connected Characters */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          <h4 className="editorial-section-heading text-xs mb-4">
            <Users className="h-4 w-4 text-primary/70" />
            연결된 인물
          </h4>

          {connectedLinks.length > 0 ? (
            <ul className="space-y-2">
              {connectedLinks.map((link, idx) => {
                const sourceId =
                  typeof link.source === "string"
                    ? link.source
                    : link.source.id;
                const targetId =
                  typeof link.target === "string"
                    ? link.target
                    : link.target.id;
                const otherId =
                  sourceId === selectedCharacter._id ? targetId : sourceId;
                const otherChar = characters.find((c) => c._id === otherId);
                const relType = link.type;

                return (
                  <li
                    key={link.id}
                    className="editorial-card flex items-center gap-3 p-3 hover-lift cursor-pointer group editorial-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-white flex items-center justify-center text-lg border border-stone-100 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                      {otherChar?.imageUrl ? (
                        <img
                          src={otherChar.imageUrl}
                          alt={otherChar.profile?.name || ""}
                          className="w-full h-full object-cover"
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
                      <div className="font-semibold text-sm text-stone-800 truncate group-hover:text-primary transition-colors">
                        {otherChar?.profile?.name || "이름 없음"}
                      </div>
                      <Badge
                        intent="outline"
                        className={cn(
                          "mt-1.5 text-[10px] px-2 py-0.5 h-5 gap-1 rounded-full",
                          RELATION_BADGE_COLORS[relType as UIRelationType] ||
                            "bg-stone-200 text-stone-600",
                        )}
                      >
                        {RELATION_ICONS[relType as UIRelationType]}
                        {RELATION_LABELS[relType as UIRelationType] || relType}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="editorial-empty-state py-8">
              <Users className="editorial-empty-state-icon h-8 w-8" />
              <p className="editorial-empty-state-title text-sm">
                연결된 인물 없음
              </p>
              <p className="editorial-empty-state-description text-xs">
                이 캐릭터와 연결된 관계가 없습니다.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-cloud-100">
        <Button
          intent="primary"
          className="w-full h-11 rounded-xl shadow-paper hover:shadow-paper-floating transition-all font-bold"
          onClick={onViewProfile}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          상세 프로필 보기
        </Button>
      </div>
    </div>
  );
}
