import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character } from "@/types";

// Hooks & Components & Constants
import { useCharacterData } from "./character-detail/hooks/useCharacterData";
import { CharacterHeader } from "./character-detail/components/CharacterHeader";
import { CharacterTraits } from "./character-detail/components/CharacterTraits";
import { CharacterArc } from "./character-detail/components/CharacterArc";
import { CharacterRelationships } from "./character-detail/components/CharacterRelationships";
import { CharacterAppearances } from "./character-detail/components/CharacterAppearances";
import { CharacterAdditionalDetails } from "./character-detail/components/CharacterAdditionalDetails";

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSave?: (updated: Character) => void; // Added to match previous usage
}

export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onEdit,
}: CharacterDetailModalProps) {
  const { traits, relationships, appearances, description, arcProgress } =
    useCharacterData(character);

  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl">
        <ScrollArea className="flex-1">
          <div className="p-8 sm:p-10">
            {/* Header Section */}
            <CharacterHeader
              character={character}
              description={description}
              onEdit={onEdit}
            />

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1: Key Traits & Character Arc */}
              <div className="space-y-8">
                <CharacterTraits traits={traits} />
                <CharacterArc progress={arcProgress} />
              </div>

              {/* Column 2: Relationships */}
              <CharacterRelationships relationships={relationships} />

              {/* Column 3: Appearances */}
              <CharacterAppearances appearances={appearances} />
            </div>

            {/* Additional Details */}
            <CharacterAdditionalDetails character={character} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
