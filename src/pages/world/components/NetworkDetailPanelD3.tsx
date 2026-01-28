import { motion } from "framer-motion";
import {
  X,
  Users,
  BookOpen,
  User,
  Heart,
  Skull,
  Network,
  TrendingUp,
  Brain,
  Activity,
  Sparkles,
  Shield,
  Swords,
  Eye,
  HeartCrack,
  Lightbulb,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { Badge } from "@stolink/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character, RelationshipLink } from "@/types";
import {
  RELATION_LABELS,
  ROLE_LABELS,
  RELATION_BADGE_COLORS,
  type UIRelationType,
} from "@/components/CharacterGraph/constants";
import { cn } from "@/lib/utils";
import { useCharacter } from "@/hooks/useCharacters";

// 관계 타입별 아이콘
const RELATION_ICONS: Record<string, React.ReactNode> = {
  ally: <User className="w-3 h-3" />,
  enemy: <Skull className="w-3 h-3" />,
  rival: <Swords className="w-3 h-3" />,
  family: <Users className="w-3 h-3" />,
  betrayed: <HeartCrack className="w-3 h-3" />,
  knows: <Eye className="w-3 h-3" />,
  protects: <Shield className="w-3 h-3" />,
  mentor: <Lightbulb className="w-3 h-3" />,
  romantic: <Heart className="w-3 h-3" />,
  neutral: <Network className="w-3 h-3" />,
  complex: <Sparkles className="w-3 h-3" />,
};

// 역할별 색상
const ROLE_COLORS: Record<string, string> = {
  protagonist: "bg-primary/10 text-primary border-primary/30",
  antagonist: "bg-rose-50 text-rose-600 border-rose-200",
  mentor: "bg-amber-50 text-amber-600 border-amber-200",
  sidekick: "bg-emerald-50 text-emerald-600 border-emerald-200",
  supporting: "bg-cloud-100 text-espresso-600 border-cloud-200",
  other: "bg-cloud-100 text-espresso-600 border-cloud-200",
};

interface NetworkDetailPanelD3Props {
  selectedCharacter: Character | null;
  characters: Character[];
  links: RelationshipLink[];
  onClose: () => void;
  onViewProfile: () => void;
  onRelationshipClick?: (link: RelationshipLink) => void;
}

export function NetworkDetailPanelD3({
  selectedCharacter,
  characters,
  links,
  onClose,
  onViewProfile,
  onRelationshipClick,
}: NetworkDetailPanelD3Props) {
  // Fetch detailed character data to ensure all personality traits/values are available
  // (List API might return summarized data)
  const { data: detailCharacter } = useCharacter(selectedCharacter?._id || "", {
    enabled: !!selectedCharacter?._id,
  });

  const displayCharacter = detailCharacter || selectedCharacter;

  if (!displayCharacter) return null;

  // 연결된 링크 찾기
  const connectedLinks = links.filter((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    return (
      sourceId === displayCharacter._id || targetId === displayCharacter._id
    );
  });

  const roleLabel = ROLE_LABELS[displayCharacter.role || "other"];
  const roleColor = ROLE_COLORS[displayCharacter.role || "other"];

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
            className="h-8 w-8 text-espresso-400 hover:text-espresso-600 hover:bg-cloud-50 -mr-2 -mt-2 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Profile Image - Larger */}
          <div className="w-20 h-20 rounded-2xl bg-cloud-50 border border-cloud-200 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
            {displayCharacter.imageUrl ? (
              <img
                src={displayCharacter.imageUrl}
                alt={displayCharacter.profile?.name || ""}
                className="w-full h-full object-cover"
              />
            ) : displayCharacter.role === "protagonist" ? (
              "🦸"
            ) : displayCharacter.role === "antagonist" ? (
              "🦹"
            ) : displayCharacter.role === "mentor" ? (
              "🧙"
            ) : (
              "👤"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-espresso-900 truncate tracking-tight">
              {displayCharacter.profile?.name || "이름 없음"}
            </h3>
            {displayCharacter.profile?.faction?.name && (
              <p className="magazine-caption text-xs not-italic text-espresso-400 mt-1">
                {displayCharacter.profile.faction.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connected Characters */}
      <ScrollArea className="flex-1">
        {/* Stats with Icons & Gradient */}
        <div className="px-5 py-4 border-b border-cloud-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-cloud-50 border border-cloud-100 rounded-xl group hover:border-mocha-200 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-mocha-500" />
                <span className="text-[10px] font-bold text-espresso-400 uppercase tracking-widest">
                  관계 인물
                </span>
              </div>
              <div className="text-2xl font-bold text-espresso-900">
                {connectedLinks.length}
              </div>
            </div>
            <div className="p-4 bg-cloud-50 border border-cloud-100 rounded-xl group hover:border-mocha-200 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-mocha-500" />
                <span className="text-[10px] font-bold text-espresso-400 uppercase tracking-widest">
                  등장 횟수
                </span>
              </div>
              <div className="text-2xl font-bold text-espresso-900">-</div>
            </div>
          </div>
        </div>

        {/* Soul Inspector Section (Premium) */}
        <div className="px-5 py-5 border-b border-cloud-50 space-y-5 bg-gradient-to-b from-cloud-50/30 to-white">
          {(() => {
            const personality =
              displayCharacter.profile?.personality ||
              displayCharacter.personality;
            const traits = [
              ...(Array.isArray(personality?.coreTraits)
                ? personality.coreTraits
                : []),
              ...(Array.isArray(personality?.values) ? personality.values : []),
            ];
            const mood = displayCharacter.currentMood;
            const archetypeSelection =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (displayCharacter as any).archetype || "Unknown";

            return (
              <>
                {/* Mental State & Emotion Glow */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold text-espresso-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-mocha-400" />
                      심리 상태 (Soul State)
                    </h4>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold px-2 py-0 h-5 bg-white border-cloud-200"
                    >
                      {archetypeSelection}
                    </Badge>
                  </div>

                  <div className="relative p-3 rounded-xl border border-cloud-100 bg-white shadow-sm overflow-hidden">
                    {/* Background Mood Color Glow */}
                    <div
                      className={cn(
                        "absolute top-0 right-0 w-16 h-16 blur-2xl opacity-20 transition-all duration-1000",
                        {
                          "bg-emerald-400":
                            !mood?.emotion ||
                            mood.emotion === "Happy" ||
                            mood.emotion === "Calm",
                          "bg-rose-400":
                            mood?.emotion === "Angry" ||
                            mood?.emotion === "Hostile",
                          "bg-blue-400": mood?.emotion === "Sad",
                          "bg-amber-400":
                            mood?.emotion === "Anxious" ||
                            mood?.emotion === "Fear",
                        },
                      )}
                    />

                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-sm font-semibold text-espresso-700">
                        {mood?.emotion || "평온함"}
                      </span>
                      <span className="text-[10px] text-espresso-400 font-medium">
                        강도: {mood?.intensity || 5}/10
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-cloud-50 rounded-full overflow-hidden relative z-10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(mood?.intensity || 5) * 10}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          {
                            "bg-emerald-500":
                              !mood?.emotion ||
                              mood.emotion === "Happy" ||
                              mood.emotion === "Calm",
                            "bg-rose-500":
                              mood?.emotion === "Angry" ||
                              mood?.emotion === "Hostile",
                            "bg-blue-500": mood?.emotion === "Sad",
                            "bg-amber-500":
                              mood?.emotion === "Anxious" ||
                              mood?.emotion === "Fear",
                          },
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Core Traits & Values */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-espresso-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-mocha-400" />
                    핵심 기질 & 가치관
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {traits.length > 0 ? (
                      traits.slice(0, 6).map((trait: string, i: number) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-2.5 py-1 bg-white border border-cloud-200 rounded-lg text-[11px] text-espresso-600 font-medium shadow-sm active:shadow-none transition-shadow"
                        >
                          {trait}
                        </motion.span>
                      ))
                    ) : (
                      <div className="w-full py-4 text-center border border-dashed border-cloud-300 rounded-xl">
                        <p className="text-[10px] text-espresso-400">
                          학습된 성격 데이터가 없습니다
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Character Motive / Secret (if available) */}
                {displayCharacter.motivation && (
                  <div className="p-3 bg-mocha-50/30 border border-mocha-100 rounded-xl relative overflow-hidden group">
                    <h4 className="text-[9px] font-bold text-mocha-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      행동 동기
                    </h4>
                    <p className="text-xs text-mocha-700 leading-relaxed italic line-clamp-2">
                      "{displayCharacter.motivation}"
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
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
                  sourceId === displayCharacter._id ? targetId : sourceId;
                const otherChar = characters.find((c) => c._id === otherId);
                const relType = link.type;

                return (
                  <li
                    key={link.id}
                    className="editorial-card flex items-center gap-3 p-3 hover-lift cursor-pointer group editorial-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => onRelationshipClick?.(link)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-white flex items-center justify-center text-lg border border-cloud-100 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
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
                      <div className="font-semibold text-sm text-espresso-800 truncate group-hover:text-primary transition-colors">
                        {otherChar?.profile?.name || "이름 없음"}
                      </div>
                      <Badge
                        intent="outline"
                        className={cn(
                          "mt-1.5 text-[10px] px-2 py-0.5 h-5 gap-1 rounded-full",
                          RELATION_BADGE_COLORS[relType as UIRelationType] ||
                            "bg-cloud-200 text-espresso-600",
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
