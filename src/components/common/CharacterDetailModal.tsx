import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  onEdit?: () => void;
  onSave?: (updated: Character) => void;
}

export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onEdit,
}: CharacterDetailModalProps) {
  const { traits, relationships, appearances, arcProgress } =
    useCharacterData(character);

  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-xl">
        <ScrollArea className="flex-1">
          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <CharacterHeader character={character} onEdit={onEdit} />

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (3/5) - 외모, 성격, 스토리 진행도 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 외모 섹션 */}
                <CharacterVisual
                  extras={character.extras as Record<string, unknown>}
                />

                {/* 성격 & 진행도 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <CharacterTraits traits={traits} />
                  <CharacterArc progress={arcProgress} />
                </div>

                <Separator />

                {/* 추가 정보 */}
                <CharacterAdditionalDetails character={character} />
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
      </DialogContent>
    </Dialog>
  );
}
