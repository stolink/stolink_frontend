import { useState } from "react";
import { Heart, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CharacterTraitsProps {
  traits: string[];
  isEditMode?: boolean;
  onTraitsChange?: (traits: string[]) => void;
}

export function CharacterTraits({
  traits,
  isEditMode = false,
  onTraitsChange,
}: CharacterTraitsProps) {
  const [newTrait, setNewTrait] = useState("");

  const handleAddTrait = () => {
    if (newTrait.trim() && onTraitsChange) {
      onTraitsChange([...traits, newTrait.trim()]);
      setNewTrait("");
    }
  };

  const handleRemoveTrait = (index: number) => {
    if (onTraitsChange) {
      onTraitsChange(traits.filter((_, i) => i !== index));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTrait();
    }
  };

  return (
    <div>
      <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Heart className="h-4 w-4" /> 성격 특성
      </h3>
      <div className="flex flex-wrap gap-2">
        {traits.length > 0 ? (
          traits.map((trait, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded bg-cloud-50 text-muted-foreground text-xs font-semibold border border-input flex items-center gap-1"
            >
              {trait}
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(idx)}
                  className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            성격 특성이 없습니다
          </span>
        )}
      </div>
      {isEditMode && (
        <div className="mt-3 flex gap-2">
          <Input
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="새 특성 추가"
            className="h-8 text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTrait}
            disabled={!newTrait.trim()}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
