import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import type { Character } from "@/types";

// Hooks & Components & Constants
import { useCharacterData } from "./character-detail/hooks/useCharacterData";
import { CharacterHeader } from "./character-detail/components/CharacterHeader";
import { CharacterTraits } from "./character-detail/components/CharacterTraits";
import { CharacterArc } from "./character-detail/components/CharacterArc";
import { CharacterRelationships } from "./character-detail/components/CharacterRelationships";
import { CharacterAppearances } from "./character-detail/components/CharacterAppearances";
import { CharacterAdditionalDetails } from "./character-detail/components/CharacterAdditionalDetails";
import { CharacterVisual } from "./character-detail/components/CharacterVisual";

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: Character) => void;
}

export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onSave,
}: CharacterDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<Character | null>(
    null,
  );

  // Reset edit mode when modal closes or character changes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditMode(false);
    }
    if (character) {
      setEditedCharacter(structuredClone(character));
    }
  }, [isOpen, character]);

  const { traits, relationships, appearances, arcProgress } = useCharacterData(
    isEditMode ? editedCharacter : character,
  );

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditMode(false);
    if (character) {
      setEditedCharacter(structuredClone(character));
    }
  }, [character]);

  const handleSave = useCallback(() => {
    if (editedCharacter && onSave) {
      onSave(editedCharacter);
    }
    setIsEditMode(false);
  }, [editedCharacter, onSave]);

  const handleFieldChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (field: keyof Character, value: any) => {
      setEditedCharacter((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleExtrasChange = useCallback((key: string, value: any) => {
    setEditedCharacter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        extras: {
          ...prev.extras,
          [key]: value,
        },
      };
    });
  }, []);

  if (!character) return null;

  const displayCharacter = isEditMode ? editedCharacter : character;
  if (!displayCharacter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-xl">
        <ScrollArea className="flex-1">
          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <CharacterHeader
              character={displayCharacter}
              onEdit={handleEdit}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange}
            />

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (3/5) - 외모, 성격, 스토리 진행도 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 외모 섹션 */}
                <CharacterVisual
                  extras={displayCharacter.extras as Record<string, unknown>}
                  isEditMode={isEditMode}
                  onExtrasChange={handleExtrasChange}
                />

                {/* 성격 & 진행도 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <CharacterTraits
                    traits={traits}
                    isEditMode={isEditMode}
                    onTraitsChange={(newTraits) =>
                      handleExtrasChange("성격", newTraits)
                    }
                  />
                  <CharacterArc progress={arcProgress} />
                </div>

                <Separator />

                {/* 추가 정보 */}
                <CharacterAdditionalDetails
                  character={displayCharacter}
                  isEditMode={isEditMode}
                  onExtrasChange={handleExtrasChange}
                />
              </div>

              {/* Right Column (2/5) - 관계, 등장 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 관계 */}
                <CharacterRelationships relationships={relationships} />

                <Separator />

                {/* 등장 */}
                <CharacterAppearances appearances={appearances} />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Edit Mode Action Bar */}
        {isEditMode && (
          <div className="border-t border-stone-200 bg-stone-50 px-6 py-4 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              취소
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 bg-stone-900 hover:bg-stone-800 text-white"
            >
              <Save className="h-4 w-4" />
              저장
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
