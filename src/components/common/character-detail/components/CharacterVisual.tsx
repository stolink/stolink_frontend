import { Eye } from "lucide-react";

// 외모 관련 키
const APPEARANCE_KEYS = [
  "신장",
  "체격",
  "머리카락",
  "눈",
  "특징",
  "피부",
  "외모",
];

interface CharacterVisualProps {
  extras: Record<string, unknown> | undefined;
}

export function CharacterVisual({ extras }: CharacterVisualProps) {
  if (!extras) return null;

  const visualEntries = Object.entries(extras).filter(([key]) =>
    APPEARANCE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
  );

  if (visualEntries.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Eye className="h-4 w-4" /> 외모
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {visualEntries.map(([key, value]) => (
          <div
            key={key}
            className="p-2.5 bg-gradient-to-br from-cloud-50 to-white rounded-lg border border-input"
          >
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
              {key}
            </p>
            <p className="text-sm font-medium text-foreground">
              {Array.isArray(value) ? value.join(", ") : String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
