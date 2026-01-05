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
    <div className="space-y-2">
      {/* 제목 제거됨 (External Container에서 처리) */}
      <div className="flex flex-col gap-2">
        {visualEntries.map(({ key, label, icon, value }) => (
          <div
            key={key}
            className="group flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/40 shadow-sm hover:bg-white/60 hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-default"
          >
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-lg drop-shadow-sm grayscale-[0.3] group-hover:grayscale-0 transition-all">
                {icon}
              </span>
              <span className="text-sm font-medium text-stone-500 group-hover:text-primary/80 transition-colors">
                {label}
              </span>
            </div>

            {isEditMode ? (
              <Input
                value={value}
                onChange={(e) => onAppearanceChange?.(key, e.target.value)}
                className="h-8 text-sm bg-white/50 border-stone-200 text-right w-[140px] focus:bg-white"
                placeholder="입력"
              />
            ) : (
              <p className="text-sm font-bold text-stone-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[50%] text-right group-hover:text-stone-900">
                {value || <span className="text-stone-300 font-normal">-</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
