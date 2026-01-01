import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CharacterAppearance } from "@/types/character";

interface CharacterVisualProps {
  appearance: CharacterAppearance | undefined;
  isEditMode?: boolean;
  onAppearanceChange?: (key: string, value: string) => void;
}

export function CharacterVisual({
  appearance,
  isEditMode = false,
  onAppearanceChange,
}: CharacterVisualProps) {
  if (!appearance) return null;

  // 새 스키마 appearance 필드들 표시
  const visualEntries: { key: string; label: string; value: string }[] = [
    { key: "physique", label: "체격", value: appearance.physique },
    { key: "skin_tone", label: "피부", value: appearance.skin_tone },
    { key: "eyes", label: "눈", value: appearance.eyes },
    { key: "hair_style", label: "헤어스타일", value: appearance.hair_style },
    { key: "hair_color", label: "머리색", value: appearance.hair_color },
    { key: "expression", label: "표정", value: appearance.expression },
  ].filter((entry) => entry.value); // 값이 있는 항목만 표시

  if (visualEntries.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Eye className="h-4 w-4" /> 외모
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {visualEntries.map(({ key, label, value }) => (
          <div
            key={key}
            className="p-2.5 bg-gradient-to-br from-cloud-50 to-white rounded-lg border border-input"
          >
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
              {label}
            </p>
            {isEditMode ? (
              <Input
                value={value}
                onChange={(e) => onAppearanceChange?.(key, e.target.value)}
                className="h-7 text-sm"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
