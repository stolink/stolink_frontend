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
import { isEqual } from "lodash-es";
import type { Character } from "@/types";
import { useCharacter } from "@/hooks/useCharacters";
import { useImageGenerationPolling } from "@/hooks/useImageGenerationPolling";
import { imageService, settingService, type ProjectSetting } from "@/services";
import { useToast } from "@/hooks/useToast";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const { toast } = useToast();
  const [selectedSettingId, setSelectedSettingId] = useState<string>("none");
  const [settings, setSettings] = useState<ProjectSetting[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");

  // Load settings
  useEffect(() => {
    if (isOpen && character?.projectId) {
      settingService.getAll(character.projectId).then((res) => {
        if (Array.isArray(res.data)) {
          setSettings(res.data);
        }
      });
    }
  }, [isOpen, character?.projectId]);

  const handleConfirmImageGeneration = useCallback(
    async (
      action: "create" | "edit",
      _promptOverride?: string,
      settingOverride?: Record<string, unknown>,
    ) => {
      if (!character?._id || !character?.projectId) return;

      try {
        // Construct prompt from character attributes
        const parts: string[] = [];
        const sourceChar = displayCharacter || character;

        if (sourceChar?.profile?.name) {
          parts.push(`Character: ${sourceChar.profile.name}`);
        }
        if (sourceChar?.appearance?.physique) {
          parts.push(`Physique: ${sourceChar.appearance.physique}`);
        }
        if (sourceChar?.appearance?.hair_color) {
          parts.push(
            `Hair: ${sourceChar.appearance.hair_color} ${sourceChar.appearance.hair_style}`,
          );
        }
        if (sourceChar?.appearance?.eyes) {
          parts.push(`Eyes: ${sourceChar.appearance.eyes}`);
        }
        if (sourceChar?.personality?.core_traits?.length > 0) {
          parts.push(
            `Traits: ${sourceChar.personality.core_traits.join(", ")}`,
          );
        }

        // Add manual prompt if provided
        const finalManualPrompt =
          _promptOverride !== undefined ? _promptOverride : manualPrompt;
        if (finalManualPrompt) {
          parts.push(`Note: ${finalManualPrompt}`);
        }

        const generatedPrompt =
          parts.length > 0
            ? parts.join(", ")
            : "A high quality character portrait";

        // Determine setting
        const selectedSetting =
          settingOverride ||
          (selectedSettingId !== "none"
            ? settings.find((s) => s.id === selectedSettingId)
            : undefined);

        console.log("[CharacterDetailModal] API 호출 중...", {
          action,
          prompt: generatedPrompt,
          setting: selectedSetting,
        });

        const { jobId } = await imageService.generateCharacterImage(
          character.projectId,
          character._id,
          action,
          generatedPrompt,
          selectedSetting as unknown as Record<string, unknown>,
        );

        setImageJobId(jobId);
        toast({
          title: action === "create" ? "이미지 생성 시작" : "이미지 수정 시작",
          description: "잠시만 기다려 주세요.",
        });
      } catch (err) {
        console.error("[CharacterDetailModal] 이미지 생성 실패:", err);
        toast({
          variant: "destructive",
          title: "실패",
          description: "이미지 생성 요청 중 오류가 발생했습니다.",
        });
      }
    },
    [
      character,
      displayCharacter,
      settings,
      selectedSettingId,
      manualPrompt,
      toast,
    ],
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

  const handleOpenImageGeneration = useCallback(() => {
    handleConfirmImageGeneration("create");
  }, [handleConfirmImageGeneration]);

  const handleSave = useCallback(async () => {
    if (!editedCharacter) return;

    // Compare appearance to detect changes for image update
    const hasAppearanceChanged = !isEqual(
      character?.appearance,
      editedCharacter.appearance,
    );

    if (onSave) {
      onSave(editedCharacter);
    }

    // If appearance changed and there's already an image, trigger auto-edit
    if (hasAppearanceChanged && character?.imageUrl) {
      console.log(
        "[CharacterDetailModal] 외모 정보 변경 감지 - 이미지 자동 수정 요청",
      );
      handleConfirmImageGeneration("edit", "");
    }

    setIsEditMode(false);
  }, [editedCharacter, character, onSave, handleConfirmImageGeneration]);

  const handleFieldChange = useCallback(
    (field: string, value: string | string[]) => {
      setEditedCharacter((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const handleAppearanceChange = useCallback(
    (key: string, value: string | string[]) => {
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
    },
    [],
  );

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
              onGenerateImage={handleOpenImageGeneration}
              isGeneratingImage={isGenerating}
              imageGenerationProgress={progress}
            />

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (3/5) - 외모, 성격, 스토리 진행도 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 이미지 & 배경 설정 섹션 */}
                <div className="p-5 bg-stone-50 border border-stone-100 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-stone-700 font-semibold text-sm">
                    <ImageIcon className="w-4 h-4 text-stone-500" />
                    대표 이미지 & 배경 설정
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-stone-500 ml-1">
                        대표 배경 선택
                      </Label>
                      <Select
                        value={selectedSettingId}
                        onValueChange={setSelectedSettingId}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white border-stone-200">
                          <SelectValue placeholder="배경 선택 (기본)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">배경 없음 (기본)</SelectItem>
                          {settings.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-stone-500 ml-1">
                        추가 묘사 (선택)
                      </Label>
                      <Input
                        placeholder="예: 웃고 있는, 비를 맞는..."
                        className="h-9 text-xs bg-white border-stone-200"
                        value={manualPrompt}
                        onChange={(e) => setManualPrompt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 px-1 text-[10px] text-stone-400">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-amber-500/70" />
                    <span>
                      이미지 생성 시 선택한 배경과 위에서 설정한 외모/특징이
                      자동으로 반영됩니다.
                    </span>
                  </div>
                </div>

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
