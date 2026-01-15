import { motion } from "framer-motion";
import {
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/utils/imageUtils";
import type { Character } from "@/types/character";
import type { Event } from "@/types/event";
import type { Conflict } from "@/types/analysisResult";
import {
  toUIRelationType,
  RELATION_LABELS,
  RELATION_BADGE_COLORS,
} from "@/components/CharacterGraph/constants";

export type TagType = "conflict" | "character" | "event";

interface TagPreviewCardProps {
  type: TagType;
  data: Character | Event | Conflict;
  className?: string;
  allCharacters?: Character[]; // Added from refactor plan
}

export function TagPreviewCard({
  type,
  data,
  className,
  allCharacters,
}: TagPreviewCardProps) {
  if (type === "conflict") {
    return <ConflictCard conflict={data as Conflict} className={className} />;
  }
  if (type === "character") {
    return (
      <CharacterCard
        character={data as Character}
        className={className}
        allCharacters={allCharacters} // Pass down
      />
    );
  }
  if (type === "event") {
    return <EventCard event={data as Event} className={className} />;
  }
  return null;
}

// --- Specific Cards with "DeepAnalysisHero" Aesthetics ---

function ConflictCard({
  conflict,
  className,
}: {
  conflict: Conflict;
  className?: string;
}) {
  const isCritical = conflict.severity === "critical";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "w-[340px] bg-white/90 backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden font-sans",
        isCritical
          ? "border-rose-100 shadow-rose-900/5"
          : "border-amber-100 shadow-amber-900/5",
        className,
      )}
    >
      <div
        className={cn(
          "px-5 py-4 flex items-center justify-between border-b relative overflow-hidden",
          isCritical
            ? "bg-rose-50/70 border-rose-100"
            : "bg-amber-50/70 border-amber-100",
        )}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
        <div className="flex items-center gap-2.5 relative z-10">
          <div
            className={cn(
              "p-2 rounded-xl shadow-sm",
              isCritical
                ? "bg-rose-100 text-rose-600 ring-1 ring-rose-200"
                : "bg-amber-100 text-amber-600 ring-1 ring-amber-200",
            )}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span
            className={cn(
              "text-[12px] font-black uppercase tracking-[0.2em]",
              isCritical ? "text-rose-800" : "text-amber-800",
            )}
          >
            {isCritical ? "Critical Issue" : "Consistency Warning"}
          </span>
        </div>
        <span className="text-[13px] items-center px-2.5 py-1 rounded-lg bg-white/80 border border-mocha-100 text-mocha-400 font-mono shadow-sm relative z-10">
          #{conflict.id.slice(0, 4)}
        </span>
      </div>

      <div className="p-5 relative bg-white/95">
        <div className="mb-4">
          <h4 className="text-[20px] font-black text-[#2A231F] mb-2 flex items-center gap-2 uppercase tracking-tighter">
            <Target className="w-5 h-5 text-[#7D5A4B]" />
            {conflict.category.replace(/_/g, " ")}
          </h4>
          <p className="text-[16px] font-bold text-[#3D302A] leading-relaxed font-serif">
            {conflict.description}
          </p>
        </div>

        {conflict.suggestion && (
          <div className="relative bg-gradient-to-br from-mocha-50 to-white rounded-xl p-4 border border-mocha-100/60 shadow-sm group cursor-default hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-mocha-500" />
              <span className="text-xs font-bold text-mocha-600">
                AI Suggestion
              </span>
            </div>
            <p className="text-[15px] font-medium text-[#5C4D44] leading-relaxed italic font-serif mb-3">
              "{conflict.suggestion}"
            </p>
            {/* Functional-looking 'Apply' button (Visual only) */}
            <div className="flex justify-end mt-4">
              <button className="text-[14px] font-black text-white bg-[#A47764] px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(164,119,100,0.3)] hover:bg-[#7D5A4B] active:scale-95 transition-all uppercase tracking-widest">
                Apply Fix
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CharacterCard({
  character,
  className,
  allCharacters = [],
}: {
  character: Character;
  className?: string;
  allCharacters?: Character[];
}) {
  // Helper to resolve name
  const resolveName = (idOrName: string) => {
    const found = allCharacters.find(
      (c) => c._id === idOrName || c.profile?.name === idOrName,
    );
    return found ? found.profile.name : idOrName;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={cn(
        "w-full h-full min-h-[300px] bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-none overflow-y-auto font-sans",
        className,
      )}
    >
      {/* Header Ambient Background */}
      <div className="h-[90px] bg-gradient-to-br from-[#A47764]/20 via-[#F1F0EC] to-white relative overflow-hidden shrink-0 border-b border-mocha-100/30">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#A47764]/10 to-transparent rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
        <div className="absolute top-5 right-5 flex gap-1 z-10">
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-black px-3 py-1.5 rounded-lg bg-white/90 border border-mocha-200 text-[#3D302A] uppercase tracking-[0.2em] backdrop-blur-md shadow-sm"
          >
            {character.role}
          </motion.span>
        </div>
      </div>

      <div className="px-5 pb-5 -mt-10 relative z-10 flex flex-col gap-4">
        {/* Avatar & Name */}
        <div className="flex items-end gap-4 shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-white p-1.5 shadow-2xl shadow-[#A47764]/20 ring-1 ring-mocha-100 transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
            {(() => {
              const url = character.imageUrl;
              if (url) {
                return (
                  <img
                    src={resolveImageUrl(url)}
                    alt={character.profile.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                );
              }
              return (
                <div className="w-full h-full bg-[#F1F0EC] rounded-xl flex items-center justify-center text-3xl font-serif text-[#7D5A4B]">
                  {character.profile.name[0]}
                </div>
              );
            })()}
          </div>
          <div className="pb-2">
            <h3 className="text-[28px] font-black font-serif text-[#2A231F] leading-none mb-2 tracking-tight">
              {character.profile.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {character.profile.occupation && (
                <p className="text-[14px] text-[#7D5A4B] font-black tracking-widest uppercase">
                  {character.profile.occupation}
                </p>
              )}
              {!character.profile.occupation &&
                character.profile.personality.coreTraits.length > 0 && (
                  <p className="text-[14px] text-[#A47764] font-black tracking-wide italic">
                    {character.profile.personality.coreTraits
                      .slice(0, 2)
                      .join(" • ")}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Traits Chips (Enlarged and Polished) */}
        <div className="flex flex-wrap gap-2.5 shrink-0 px-1">
          {character.profile.personality.coreTraits
            .slice(0, 3)
            .map((trait, i) => (
              <span
                key={i}
                className="text-[14px] font-black text-[#7D5A4B] px-4 py-1.5 rounded-xl bg-white border border-[#A47764]/20 shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                #{trait}
              </span>
            ))}
        </div>

        {/* Key Relationships */}
        {character.relations.graph.length > 0 && (
          <div className="bg-white/95 rounded-2xl p-4 border-2 border-[#A47764]/40 shadow-sm shrink-0 mt-2">
            <div className="flex items-center gap-1.5 mb-3.5 px-2 py-1.5 bg-[#F1F0EC] rounded-lg border border-[#A47764]/20">
              <Users className="w-4 h-4 text-[#7D5A4B]" />
              <h4 className="text-[13px] font-black text-[#2A231F] uppercase tracking-widest">
                Key Relations
              </h4>
            </div>
            <div className="space-y-3">
              {character.relations.graph.slice(0, 3).map((rel, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between group px-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#A47764]/40 group-hover:bg-[#7D5A4B] transition-colors" />
                    <span className="text-[14px] font-bold text-[#3D302A]">
                      {resolveName(rel.target)}
                    </span>
                  </div>
                  {/* Standardized Type Badge */}
                  {(() => {
                    const rawType =
                      (Array.isArray(rel.relationTypes) &&
                        rel.relationTypes[0]) ||
                      (typeof rel.type === "string" ? rel.type : "neutral");

                    const uiType = toUIRelationType(rawType);

                    return (
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-lg border-2 font-black shadow-sm",
                          RELATION_BADGE_COLORS[uiType],
                        )}
                      >
                        {RELATION_LABELS[uiType]}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EventCard({ event, className }: { event: Event; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -5 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-full h-full bg-white/90 backdrop-blur-md rounded-2xl border border-mocha-100 shadow-xl overflow-hidden font-sans flex flex-col",
        className,
      )}
    >
      <div className="px-6 py-5 bg-gradient-to-br from-mocha-50/60 via-white to-white border-b border-mocha-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-mocha-100 rounded-lg">
              <Calendar className="w-4 h-4 text-mocha-600" />
            </div>
            <span className="text-[12px] font-black text-mocha-700 uppercase tracking-[0.2em]">
              {typeof event.eventType === "string" ? event.eventType : "Event"}
            </span>
          </div>
          {event.importance > 0 && (
            <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-full border border-mocha-100/50">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i < Math.min(3, Math.ceil(event.importance / 3))
                      ? "bg-amber-400"
                      : "bg-mocha-100",
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <h3 className="text-[20px] font-black font-serif text-[#2A231F] leading-tight relative z-10">
          {event.narrativeSummary}
        </h3>
      </div>

      <div className="p-6 space-y-5 flex-1 overflow-y-auto min-h-0">
        <p className="text-[16px] font-medium text-[#5C4D44] leading-relaxed line-clamp-4 font-serif italic">
          {event.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {event.locationRef && (
            <div className="flex items-center gap-1.5 bg-sage-50/50 px-2 py-1 rounded-lg border border-sage-200/60">
              <MapPin className="w-3 h-3 text-sage-600" />
              <span className="text-[11px] font-bold text-[#2C4236]">
                {event.locationRef}
              </span>
            </div>
          )}
          {event.participants.slice(0, 3).map((person, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-mocha-50 px-4 py-2 rounded-xl border-2 border-mocha-100"
            >
              <User className="w-4 h-4 text-mocha-400" />
              <span className="text-[16px] font-bold text-[#3D302A]">
                {person}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
