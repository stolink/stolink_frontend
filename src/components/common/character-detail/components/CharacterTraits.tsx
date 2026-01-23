import { useState } from "react";
import { Heart, Plus, X, Sparkles } from "lucide-react";
import { Input } from "@stolink/ui";
import { Button } from "@stolink/ui";

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
    <div className="space-y-4">
      <h3 className="editorial-section-heading">
        <Heart className="h-5 w-5 text-mocha-500" />
        성격 특성
      </h3>

      {traits.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {traits.map((trait, idx) => (
            <span
              key={idx}
              className="editorial-tag group"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Sparkles className="h-3 w-3 text-mocha-500/50" />
              {trait}
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(idx)}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-mocha-400 hover:text-red-500 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="editorial-empty-state py-8">
          <Heart className="editorial-empty-state-icon h-10 w-10" />
          <p className="editorial-empty-state-title text-base">
            성격 특성 없음
          </p>
          <p className="editorial-empty-state-description text-sm">
            캐릭터의 성격을 정의하는 특성을 추가해보세요.
          </p>
        </div>
      )}

      {isEditMode && (
        <div className="flex gap-2 pt-2">
          <Input
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="새 특성 추가 (예: 용감한, 신중한...)"
            className="h-9 text-sm flex-1 bg-white"
          />
          <Button
            type="button"
            intent="outline"
            size="sm"
            onClick={handleAddTrait}
            disabled={!newTrait.trim()}
            className="h-9 px-3 gap-1.5 hover:bg-mocha-50 hover:text-mocha-900 hover:border-mocha-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>
      )}
    </div>
  );
}
