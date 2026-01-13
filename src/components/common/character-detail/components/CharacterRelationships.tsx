import { useMemo } from "react";
import { Users, User, Heart, Swords, Handshake, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationshipUI {
  name: string;
  relation: string;
  type: string;
}

interface CharacterRelationshipsProps {
  relationships: RelationshipUI[];
}

// Section Config
const SECTIONS = [
  {
    id: "romantic",
    title: "연인 & 사랑",
    icon: Heart,
    color: "text-relation-romance",
    bg: "bg-relation-romance/10",
    border: "border-relation-romance/30",
    matcher: (type: string) => type === "romantic" || type.includes("love"),
  },
  {
    id: "friendly",
    title: "동료 & 우호",
    icon: Handshake,
    color: "text-relation-friendly",
    bg: "bg-relation-friendly/10",
    border: "border-relation-friendly/30",
    matcher: (type: string) =>
      type === "friendly" ||
      type.includes("ally") ||
      type.includes("friend") ||
      type === "trust",
  },
  {
    id: "hostile",
    title: "적대 & 경쟁",
    icon: Swords,
    color: "text-relation-hostile",
    bg: "bg-relation-hostile/10",
    border: "border-relation-hostile/30",
    matcher: (type: string) =>
      type === "hostile" || type.includes("enemy") || type.includes("rival"),
  },
  {
    id: "others",
    title: "기타 관계",
    icon: Users,
    color: "text-relation-neutral",
    bg: "bg-relation-neutral/10",
    border: "border-relation-neutral/30",
    matcher: () => true, // Fallback
  },
];

export function CharacterRelationships({
  relationships,
}: CharacterRelationshipsProps) {
  // Group relationships by logic
  const grouped = useMemo(() => {
    const groups: Record<string, RelationshipUI[]> = {
      romantic: [],
      friendly: [],
      hostile: [],
      others: [],
    };

    relationships.forEach((rel) => {
      const type = rel.type.toLowerCase();
      if (SECTIONS[0].matcher(type)) groups.romantic.push(rel);
      else if (SECTIONS[1].matcher(type)) groups.friendly.push(rel);
      else if (SECTIONS[2].matcher(type)) groups.hostile.push(rel);
      else groups.others.push(rel);
    });

    return groups;
  }, [relationships]);

  const isEmpty = relationships.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-cloud-100 flex items-center justify-center animate-pulse-slow">
          <Users className="w-8 h-8 text-cloud-300" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-espresso-900">
            관계 정보 없음
          </h3>
          <p className="text-sm text-mocha-500">
            아직 기록된 인물 관계가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Introduction Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-cloud-50 via-[#FAF9F6] to-white border border-cloud-100 shadow-sm">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm ring-1 ring-espresso-900/5">
            <Gem className="w-6 h-6 text-mocha-500" />
          </div>
          <div>
            <h2 className="text-xl  font-bold text-espresso-900">
              인물 관계도
            </h2>
            <p className="text-sm text-mocha-500 mt-1">
              이 캐릭터를 둘러싼 주요 인물들과의 관계입니다.
            </p>
          </div>
        </div>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-mocha-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {SECTIONS.map((section) => {
        const items = grouped[section.id as keyof typeof grouped];
        if (items.length === 0) return null;

        const SectionIcon = section.icon;

        return (
          <div
            key={section.id}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {/* Section Header */}
            <div className="flex items-center gap-2 px-1">
              <span
                className={cn(
                  "p-1.5 rounded-lg bg-cloud-100",
                  section.color.replace("text-", "bg-").replace("600", "100"), // simple quick hack for bg color, but let's use section.bg if defined better
                )}
              >
                <SectionIcon className={cn("w-4 h-4", section.color)} />
              </span>
              <h3 className="text-sm font-bold text-espresso-900/70 uppercase tracking-widest">
                {section.title}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cloud-100 text-mocha-500">
                {items.length}
              </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((rel, idx) => (
                <div
                  key={`${rel.name}-${idx}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
                    "bg-white/60 hover:bg-white/90 backdrop-blur-md",
                    "border border-white/60 hover:border-primary/20",
                    "shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
                    "hover:-translate-y-1 active:scale-[0.99]",
                  )}
                >
                  {/* Hover Gradient Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                      "bg-gradient-to-br from-transparent to-white/50",
                    )}
                  />

                  <div className="relative z-10 flex items-start gap-4">
                    {/* Avatar Placeholder */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                        section.bg,
                        section.color,
                      )}
                    >
                      <User className="w-6 h-6 opacity-80" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-bold text-espresso-800 truncate group-hover:text-primary transition-colors">
                          {rel.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Relation Badge */}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                            section.bg,
                            section.color.replace("700", "600"),
                            section.border,
                          )}
                        >
                          {rel.relation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
