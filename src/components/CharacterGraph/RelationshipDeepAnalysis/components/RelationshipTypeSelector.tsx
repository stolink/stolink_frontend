import { cn } from "@/lib/utils";
import {
  type UIRelationType,
  RELATION_LABELS,
  RELATION_COLORS_HEX,
} from "../../constants";
import { Check } from "lucide-react";

interface RelationshipTypeSelectorProps {
  selectedTypes: UIRelationType[];
  onChange: (types: UIRelationType[]) => void;
  disabled?: boolean;
}

export function RelationshipTypeSelector({
  selectedTypes,
  onChange,
  disabled = false,
}: RelationshipTypeSelectorProps) {
  const allTypes: UIRelationType[] = [
    "ally",
    "enemy",
    "rival",
    "family",
    "betrayed",
    "knows",
    "protects",
    "mentor",
    "romantic",
    "neutral",
    "complex",
  ];

  const toggleType = (type: UIRelationType) => {
    if (disabled) return;
    if (selectedTypes.includes(type)) {
      // Don't allow empty selection if possible, but the form handles validation
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-espresso-700">관계 유형</label>
        <span className="text-xs text-espresso-400">
          복수 선택 가능 ({selectedTypes.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {allTypes.map((type) => {
          const isSelected = selectedTypes.includes(type);
          const color = RELATION_COLORS_HEX[type];

          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => toggleType(type)}
              className={cn(
                "group relative px-4 py-2.5 rounded-2xl transition-all duration-200",
                "border flex items-center gap-2",
                isSelected
                  ? "bg-white shadow-md scale-[1.02]"
                  : "bg-cloud-50/50 border-cloud-200 hover:border-mocha-200 hover:bg-white",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              style={{
                borderColor: isSelected ? color : undefined,
                boxShadow: isSelected ? `0 4px 12px ${color}20` : undefined,
              }}
            >
              {/* Selection Indicator Dot */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-transform",
                  isSelected ? "scale-100" : "scale-50 opacity-40",
                )}
                style={{ backgroundColor: color }}
              />

              <span
                className={cn(
                  "text-sm font-bold transition-colors",
                  isSelected
                    ? "text-espresso-900"
                    : "text-espresso-400 group-hover:text-espresso-600",
                )}
              >
                {RELATION_LABELS[type]}
              </span>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border-2 rounded-full flex items-center justify-center shadow-sm"
                  style={{ borderColor: color }}
                >
                  <Check
                    className="w-3 h-3"
                    style={{ color }}
                    strokeWidth={4}
                  />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Framer motion is needed for the checkmark animation
import { motion } from "framer-motion";
