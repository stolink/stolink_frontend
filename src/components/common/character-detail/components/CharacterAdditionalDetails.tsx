import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Character } from "@/types";

interface CharacterAdditionalDetailsProps {
  character: Character;
  isEditMode?: boolean;
  onPersonalityChange?: (key: string, value: unknown) => void;
}

export function CharacterAdditionalDetails({
  character,
  isEditMode = false,
  onPersonalityChange,
}: CharacterAdditionalDetailsProps) {
  const personality = character.personality;

  if (!personality) return null;

  // 새 스키마: personality.flaws, personality.values 표시
  const entries: { key: string; label: string; value: string[] }[] = [];

  if (personality.flaws?.length > 0) {
    entries.push({ key: "flaws", label: "약점", value: personality.flaws });
  }
  if (personality.values?.length > 0) {
    entries.push({ key: "values", label: "가치관", value: personality.values });
  }

  if (entries.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> 추가 정보
      </h3>
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {entries.map(({ key, label, value }) => (
            <div
              key={key}
              className="p-3 bg-cloud-50 rounded-lg border border-input"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                {label}
              </p>
              {isEditMode ? (
                <Input
                  value={value.join(", ")}
                  onChange={(e) =>
                    onPersonalityChange?.(
                      key,
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  className="h-7 text-sm"
                />
              ) : (
                <p className="text-sm font-medium text-foreground truncate">
                  {value.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
