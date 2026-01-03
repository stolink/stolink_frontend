import { Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CharacterAppearance } from "@/types/character";

interface CharacterVisualProps {
  appearance: CharacterAppearance | undefined;
  isEditMode?: boolean;
  onAppearanceChange?: (key: string, value: string) => void;
}

const visualFieldConfig: {
  key: keyof CharacterAppearance;
  label: string;
  icon: string;
}[] = [
  { key: "physique", label: "체격", icon: "💪" },
  { key: "skinTone", label: "피부", icon: "✨" },
  { key: "eyes", label: "눈", icon: "👁️" },
  { key: "hairStyle", label: "헤어스타일", icon: "💇" },
  { key: "hairColor", label: "머리색", icon: "🎨" },
  { key: "attire", label: "의상", icon: "👔" },
  { key: "expression", label: "표정", icon: "😊" },
  { key: "scarsTattoos", label: "특징", icon: "⭐" },
];

export function CharacterVisual({
  appearance,
  isEditMode = false,
  onAppearanceChange,
}: CharacterVisualProps) {
  if (!appearance) {
    return (
      <div className="editorial-empty-state">
        <Palette className="editorial-empty-state-icon" />
        <p className="editorial-empty-state-title">외모 정보 없음</p>
        <p className="editorial-empty-state-description">
          캐릭터의 외모 정보가 아직 입력되지 않았습니다.
        </p>
      </div>
    );
  }

  const getFieldValue = (key: keyof CharacterAppearance): string => {
    const value = appearance[key];
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      // Handle styleContext: { artStyle: string }
      if ("artStyle" in value) {
        return value.artStyle || "";
      }
      return JSON.stringify(value);
    }
    return (value as string) || "";
  };

  const visualEntries = visualFieldConfig
    .map(({ key, label, icon }) => ({
      key,
      label,
      icon,
      value: getFieldValue(key),
    }))
    .filter((entry) => entry.value || isEditMode);

  if (visualEntries.length === 0) {
    return (
      <div className="editorial-empty-state">
        <Palette className="editorial-empty-state-icon" />
        <p className="editorial-empty-state-title">외모 정보 없음</p>
        <p className="editorial-empty-state-description">
          캐릭터의 외모 정보가 아직 입력되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <Palette className="h-5 w-5 text-primary/70" />
        외모
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visualEntries.map(({ key, label, icon, value }) => (
          <div key={key} className="editorial-card p-3 hover-lift group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                {icon}
              </span>
              <span className="editorial-label">{label}</span>
            </div>
            {isEditMode ? (
              <Input
                value={value}
                onChange={(e) => onAppearanceChange?.(key, e.target.value)}
                className="h-8 text-sm bg-white"
                placeholder={`${label} 입력`}
              />
            ) : (
              <p className="text-sm font-medium text-stone-800 leading-snug">
                {value || "-"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
