import { roleLabels } from "@/pages/world/constants";
import type { Character } from "@/types";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  character: Character;
  onClick?: (character: Character) => void;
  index?: number;
}

export function CharacterCard({
  character,
  onClick,
  index = 0,
}: CharacterCardProps) {
  const name =
    character.profile?.name ||
    (character as { name?: string }).name ||
    "이름 없음";
  const backstory =
    character.profile?.backstory ||
    (character as { backstory?: string }).backstory;
  const role = character.role || "other";

  return (
    <div
      className={cn(
        "editorial-card group cursor-pointer overflow-hidden aspect-[3/4] flex flex-col hover-lift editorial-fade-in",
        "bg-white border border-cloud-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onClick?.(character)}
    >
      {/* Image Section - 70% height */}
      <div className="relative flex-[7] overflow-hidden bg-muted">
        {character.imageUrl ? (
          <>
            <img
              src={character.imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-cloud-50 text-mocha-300">
            <span className="text-5xl opacity-50 group-hover:opacity-70 transition-opacity transform group-hover:scale-110 duration-300">
              {role === "protagonist"
                ? "🦸"
                : role === "antagonist"
                  ? "🦹"
                  : role === "mentor"
                    ? "🧙"
                    : "👤"}
            </span>
          </div>
        )}
        {/* Role Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-espresso-900 border border-black/5 shadow-sm uppercase tracking-wider">
          {roleLabels[role]}
        </div>
      </div>

      {/* Info Section - 30% height */}
      <div className="flex-[3] p-4 bg-white flex flex-col justify-center border-t border-cloud-100 relative group-hover:bg-cloud-50/30 transition-colors">
        <h3 className="text-base font-bold text-espresso-900 line-clamp-1 group-hover:text-mocha-600 transition-colors font-serif tracking-tight">
          {name}
        </h3>
        {backstory && (
          <p className="text-xs text-mocha-400 line-clamp-2 mt-1 leading-relaxed font-sans">
            {backstory}
          </p>
        )}
      </div>
    </div>
  );
}
