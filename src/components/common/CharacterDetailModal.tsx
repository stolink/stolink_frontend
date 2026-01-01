import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import type { Character } from "@/types";
import { useCharacter } from "@/hooks/useCharacters";
import { useImageGenerationPolling } from "@/hooks/useImageGenerationPolling";
import { imageService } from "@/services/imageService";

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
  const [imageJobId, setImageJobId] = useState<string | null>(null);

  // Fetch fresh character data
  // 만약 DB에는 데이터가 있는데 리스트에는 없을 경우를 대비해 상세 조회
  const { data: fetchedCharacter } = useCharacter(character?._id || "", {
    enabled: !!character?._id,
  });

  // 화면에 표시할 최종 캐릭터 데이터 (수정모드 > 페치된 데이터 > props 데이터)
  const displayCharacter = isEditMode
    ? editedCharacter
    : fetchedCharacter || character; // 페치된 데이터 우선 사용

  useEffect(() => {
    console.log(
      "[CharacterDetailModal] isOpen:",
      isOpen,
      "character:",
      character?._id,
      character?.profile?.name,
    );
    if (displayCharacter) {
      console.log(
        "[CharacterDetailModal] 로드된 캐릭터 상세 정보:",
        JSON.stringify(displayCharacter, null, 2),
      );
    }
  }, [displayCharacter, isOpen, character]);

  // Image generation polling
  const { isGenerating, progress } = useImageGenerationPolling(
    imageJobId,
    character?._id || "",
    {
      onComplete: (imageUrl) => {
        console.log("[CharacterDetailModal] 이미지 생성 완료:", imageUrl);
        setImageJobId(null);
      },
      onError: (error) => {
        console.error("[CharacterDetailModal] 이미지 생성 실패:", error);
        setImageJobId(null);
      },
      onTimeout: () => {
        console.warn("[CharacterDetailModal] 이미지 생성 시간초과");
        setImageJobId(null);
      },
    },
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
  }, [isOpen, character]); // fetchedCharacter 변경 시에도 업데이트하려면 의존성 추가 고려 (여기선 생략)

  const { traits, relationships, appearances, arcProgress } = useCharacterData(
    displayCharacter, // displayCharacter 사용
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
    (field: string, value: any) => {
      setEditedCharacter((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const handleGenerateImage = useCallback(async () => {
    console.log("[CharacterDetailModal] handleGenerateImage called");
    console.log("[CharacterDetailModal] character._id:", character?._id);
    console.log(
      "[CharacterDetailModal] character.projectId:",
      character?.projectId,
    );

    if (!character?._id || !character?.projectId) {
      console.warn(
        "[CharacterDetailModal] Missing _id or projectId, aborting image generation",
      );
      return;
    }

    try {
      console.log(
        "[CharacterDetailModal] AI가 캐릭터 이미지를 생성하고 있습니다...",
      );

      // Generate Korean description from character data
      const parts: string[] = [];

      if (displayCharacter?.profile?.name) {
        parts.push(displayCharacter.profile.name);
      }

      if (displayCharacter?.appearance?.physique) {
        parts.push(`${displayCharacter.appearance.physique} 체형`);
      }

      if (displayCharacter?.appearance?.hair_style) {
        parts.push(displayCharacter.appearance.hair_style);
      }

      if (displayCharacter?.appearance?.hair_color) {
        parts.push(`${displayCharacter.appearance.hair_color} 머리`);
      }

      const description = parts.length > 0 ? parts.join(", ") : "캐릭터 초상화";

      console.log("[CharacterDetailModal] 생성 프롬프트:", description);
      console.log(
        "[CharacterDetailModal] API 호출 중... projectId:",
        character.projectId,
        "characterId:",
        character._id,
      );

      const { jobId } = await imageService.generateCharacterImage(
        character.projectId,
        character._id,
        description,
      );

      console.log("[CharacterDetailModal] API 성공! jobId:", jobId);
      setImageJobId(jobId);
    } catch (err) {
      console.error("[CharacterDetailModal] 이미지 생성 실패:", err);
      console.error(
        "[CharacterDetailModal] Error details:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }, [character, displayCharacter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAppearanceChange = useCallback((key: string, value: any) => {
    setEditedCharacter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        appearance: {
          ...prev.appearance,
          [key]: value,
        },
      };
    });
  }, []);

  if (!character) {
    console.warn(
      "[CharacterDetailModal] character is null, modal will not render",
    );
    return null;
  }

  if (!displayCharacter) {
    console.warn(
      "[CharacterDetailModal] displayCharacter is null, modal will not render",
    );
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-xl">
        <DialogTitle className="sr-only">
          {displayCharacter?.profile?.name || "캐릭터 상세 정보"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          캐릭터 상세 정보를 확인하고 수정할 수 있는 모달입니다.
        </DialogDescription>
        <ScrollArea className="flex-1">
          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <CharacterHeader
              character={displayCharacter}
              onEdit={handleEdit}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={isGenerating}
              imageGenerationProgress={progress}
            />

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (3/5) - 외모, 성격, 스토리 진행도 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 외모 섹션 */}
                <CharacterVisual
                  appearance={displayCharacter.appearance}
                  isEditMode={isEditMode}
                  onAppearanceChange={handleAppearanceChange}
                />

                {/* 성격 & 진행도 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <CharacterTraits
                    traits={traits}
                    isEditMode={isEditMode}
                    onTraitsChange={(newTraits) => {
                      setEditedCharacter((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          personality: {
                            ...prev.personality,
                            core_traits: newTraits,
                          },
                        };
                      });
                    }}
                  />
                  <CharacterArc progress={arcProgress} />
                </div>

                <Separator />

                {/* 추가 정보 */}
                <CharacterAdditionalDetails
                  character={displayCharacter}
                  isEditMode={isEditMode}
                  onPersonalityChange={(key, value) => {
                    setEditedCharacter((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        personality: {
                          ...prev.personality,
                          [key]: value,
                        },
                      };
                    });
                  }}
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
