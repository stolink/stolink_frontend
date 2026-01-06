import {
  Sparkles,
  Zap,
  Target,
  Shield,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { Input } from "@stolink/ui";
import type { Character } from "@/types";

interface CharacterAdditionalDetailsProps {
  character: Character;
  isEditMode?: boolean;
  onPersonalityChange?: (key: string, value: unknown) => void;
}

const entryConfig = {
  strengths: { label: "강점", icon: Zap, colorClass: "strength" },
  flaws: { label: "약점", icon: AlertTriangle, colorClass: "weakness" },
  values: { label: "가치관", icon: Compass, colorClass: "value" },
};

export function CharacterAdditionalDetails({
  character,
  isEditMode = false,
  onPersonalityChange,
}: CharacterAdditionalDetailsProps) {
  const personality = character.personality;

  if (!personality) return null;

  const entries: {
    key: string;
    label: string;
    value: string[];
    icon: typeof Zap;
    colorClass: string;
  }[] = [];

  if (personality.strengths && personality.strengths.length > 0) {
    entries.push({
      key: "strengths",
      ...entryConfig.strengths,
      value: personality.strengths,
    });
  }

  if (personality.flaws?.length > 0) {
    entries.push({
      key: "flaws",
      ...entryConfig.flaws,
      value: personality.flaws,
    });
  }

  if (personality.values?.length > 0) {
    entries.push({
      key: "values",
      ...entryConfig.values,
      value: personality.values,
    });
  }

  const hasMotivation = character.motivation;
  const hasMood =
    character.currentMood &&
    (character.currentMood.emotion || character.currentMood.trigger);

  if (entries.length === 0 && !hasMotivation && !hasMood) return null;

  return (
    <div className="space-y-6 pt-6 border-t border-stone-100">
      <h3 className="editorial-section-heading">
        <Sparkles className="h-5 w-5 text-primary/70" />
        추가 정보
      </h3>

      {/* Motivation Section - Pull Quote Style */}
      {hasMotivation && (
        <div className="pull-quote">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="editorial-label not-italic">동기</span>
          </div>
          <p className="text-base leading-relaxed">"{character.motivation}"</p>
        </div>
      )}

      {/* Current Mood Section */}
      {hasMood && (
        <div className="editorial-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary/70" />
              <span className="editorial-label">현재 상태</span>
            </div>
            {character.currentMood!.intensity > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                강도 {character.currentMood!.intensity}/5
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {character.currentMood!.emotion && (
              <p className="text-lg font-semibold text-stone-900">
                {character.currentMood!.emotion}
              </p>
            )}
            {character.currentMood!.trigger && (
              <p className="text-sm text-stone-500">
                <span className="text-stone-400">원인:</span>{" "}
                {character.currentMood!.trigger}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Personality Traits Grid - Color Bar Indicators */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.map(({ key, label, value, icon: Icon, colorClass }) => (
            <div
              key={key}
              className={`editorial-card p-4 color-bar-indicator ${colorClass}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-stone-500" />
                <span className="editorial-label">{label}</span>
              </div>
              {isEditMode ? (
                <Input
                  value={value.join(", ")}
                  onChange={(e) =>
                    onPersonalityChange?.(
                      key,
                      e.target.value.split(",").map((s) => s.trim()),
                    )
                  }
                  className="h-8 text-sm bg-white"
                  placeholder={`${label} 입력 (쉼표로 구분)`}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {value.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-sm text-stone-700 after:content-[','] last:after:content-[''] after:text-stone-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
