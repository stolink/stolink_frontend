import { Sparkles } from "lucide-react";
import type { Character } from "@/types";
import { MAX_FILTERED_ITEMS, EXCLUDED_KEYS } from "../constants";

interface CharacterAdditionalDetailsProps {
  character: Character;
}

export function CharacterAdditionalDetails({
  character,
}: CharacterAdditionalDetailsProps) {
  if (!character.extras || Object.keys(character.extras).length === 0) {
    return null;
  }

  const filteredExtras = Object.entries(character.extras)
    .filter(
      ([key]) =>
        !EXCLUDED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
    )
    .slice(0, MAX_FILTERED_ITEMS);

  if (filteredExtras.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-stone-200">
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Additional Details
      </h3>
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredExtras.map(([key, value]) => (
            <div
              key={key}
              className="p-3 bg-stone-50 rounded-lg border border-stone-100"
            >
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">
                {key}
              </p>
              <p className="text-sm font-medium text-stone-700 truncate">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
