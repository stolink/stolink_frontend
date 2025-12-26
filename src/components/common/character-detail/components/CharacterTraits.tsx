import { Heart } from "lucide-react";

interface CharacterTraitsProps {
  traits: string[];
}

export function CharacterTraits({ traits }: CharacterTraitsProps) {
  return (
    <div>
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
        <Heart className="h-4 w-4" /> Key Traits
      </h3>
      <div className="flex flex-wrap gap-2">
        {traits.length > 0 ? (
          traits.map((trait, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
            >
              {trait}
            </span>
          ))
        ) : (
          <span className="text-sm text-stone-400">성격 특성이 없습니다</span>
        )}
      </div>
    </div>
  );
}
