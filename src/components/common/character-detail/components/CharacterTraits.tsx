import { Heart } from "lucide-react";

interface CharacterTraitsProps {
  traits: string[];
}

export function CharacterTraits({ traits }: CharacterTraitsProps) {
  return (
    <div>
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Heart className="h-4 w-4" /> Key Traits
      </h3>
      <div className="flex flex-wrap gap-2">
        {traits.length > 0 ? (
          traits.map((trait, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded bg-cloud-50 text-muted-foreground text-xs font-semibold border border-input"
            >
              {trait}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            성격 특성이 없습니다
          </span>
        )}
      </div>
    </div>
  );
}
