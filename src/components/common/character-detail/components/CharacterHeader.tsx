import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { roleLabels } from "../constants";

interface CharacterHeaderProps {
  character: Character;
  description: string;
  onEdit?: () => void;
}

export function CharacterHeader({
  character,
  description,
  onEdit,
}: CharacterHeaderProps) {
  const roleInfo = roleLabels[character.role || "other"];

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start mb-8 border-b border-stone-200 pb-8">
      {/* Profile Image */}
      <div className="h-32 w-32 rounded-lg shrink-0 border border-stone-200 shadow-sm ring-4 ring-stone-50 overflow-hidden bg-stone-100">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-full object-cover transition-all duration-300 grayscale opacity-90 hover:grayscale-0 hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-stone-100 to-stone-200">
            {character.role === "protagonist"
              ? "🦸"
              : character.role === "antagonist"
                ? "🦹"
                : character.role === "mentor"
                  ? "🧙"
                  : "👤"}
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-bold text-stone-800 tracking-tight">
                {character.name}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                  roleInfo.color
                )}
              >
                {roleInfo.label}
              </span>
            </div>
            <p className="text-sm text-stone-400 font-medium">
              마지막 업데이트:{" "}
              {new Date(character.updatedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
          {onEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              className="gap-2 shadow-sm"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-5 text-stone-600 font-serif leading-relaxed text-lg italic opacity-90">
            "{description}"
          </p>
        )}
      </div>
    </div>
  );
}
