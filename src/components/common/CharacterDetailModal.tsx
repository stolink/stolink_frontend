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
import {
  Save,
  X,
  MapPin,
  Briefcase,
  Users2,
  Flag,
  Compass,
  UserRound,
  Palette,
  Heart,
  Users,
  BookOpen,
  Wand2,
} from "lucide-react";
import { isEqual } from "lodash-es";
import type { Character } from "@/types";
import { useCharacter } from "@/hooks/useCharacters";
import { useImageGenerationPolling } from "@/hooks/useImageGenerationPolling";
import { imageService, settingService, type ProjectSetting } from "@/services";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
    null
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
      character?.profile?.name
    );
    if (displayCharacter) {
      console.log(
        "[CharacterDetailModal] 로드된 캐릭터 상세 정보:",
        JSON.stringify(displayCharacter, null, 2)
      );
    }
  }, [displayCharacter, isOpen, character]);

  // Image generation polling
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // Image generation polling
  const { isGenerating, progress } = useImageGenerationPolling(
    imageJobId,
    character?._id || "",
    {
      onComplete: (imageUrl) => {
        setTempImageUrl(imageUrl); // 🌟 즉시 반영 (Optimistic Update)
        setImageJobId(null);
      },
      onError: (err) => {
        setImageJobId(null);
      },
      onTimeout: () => {
        setImageJobId(null);
      },
    }
  );

  // Track previous character ID for detecting changes
  const [prevCharacterId, setPrevCharacterId] = useState<string | undefined>(
    character?._id
  );
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset edit mode and generation state when modal closes or character changes (without useEffect setState)
  if (prevIsOpen && !isOpen) {
    setIsEditMode(false);
    setImageJobId(null);
    setTempImageUrl(null);
    setPrevIsOpen(isOpen);
  } else if (!prevIsOpen && isOpen) {
    setPrevIsOpen(isOpen);
  }

  if (character?._id !== prevCharacterId) {
    setPrevCharacterId(character?._id);
    if (character) {
      setEditedCharacter(structuredClone(character));
      setImageJobId(null);
      setTempImageUrl(null);
    }
  }

  const { traits, relationships, appearances, arcProgress } = useCharacterData(
    displayCharacter // displayCharacter 사용
  );

  const { toast } = useToast();
  const [selectedSettingId, setSelectedSettingId] = useState<string>("none");
  const [settings, setSettings] = useState<ProjectSetting[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");

  // Load settings
  useEffect(() => {
    console.log("[CharacterDetailModal] Settings load check:", {
      isOpen,
      projectId: character?.projectId,
      characterId: character?._id,
    });
    if (isOpen && character?.projectId) {
      settingService
        .getAll(character.projectId)
        .then((res) => {
          console.log("[CharacterDetailModal] Settings API response:", res);
          if (Array.isArray(res.data)) {
            setSettings(res.data);
            console.log(
              "[CharacterDetailModal] Settings loaded:",
              res.data.length
            );
          } else {
            console.log(
              "[CharacterDetailModal] Settings data is not array:",
              res
            );
          }
        })
        .catch((err) => {
          console.error("[CharacterDetailModal] Settings load error:", err);
        });
    }
  }, [isOpen, character?.projectId, character?._id]);

  const handleConfirmImageGeneration = useCallback(
    async (
      action: "create" | "edit",
      _promptOverride?: string,
      settingOverride?: Record<string, unknown>
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
        if (sourceChar?.appearance?.hairColor) {
          parts.push(
            `Hair: ${sourceChar.appearance.hairColor} ${sourceChar.appearance.hairStyle}`
          );
        }
        if (sourceChar?.appearance?.eyes) {
          parts.push(`Eyes: ${sourceChar.appearance.eyes}`);
        }
        if (sourceChar?.personality?.coreTraits?.length > 0) {
          parts.push(`Traits: ${sourceChar.personality.coreTraits.join(", ")}`);
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

        const { jobId } = await imageService.generateCharacterImage(
          character.projectId,
          character._id,
          action,
          generatedPrompt,
          selectedSetting as unknown as Record<string, unknown>
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
    ]
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
      editedCharacter.appearance
    );

    if (onSave) {
      onSave(editedCharacter);
    }

    // If appearance changed and there's already an image, trigger auto-edit
    if (hasAppearanceChanged && character?.imageUrl) {
      console.log(
        "[CharacterDetailModal] 외모 정보 변경 감지 - 이미지 자동 수정 요청"
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
    []
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
    []
  );

  if (!character) {
    console.warn(
      "[CharacterDetailModal] character is null, modal will not render"
    );
    return null;
  }

  if (!displayCharacter) {
    console.warn(
      "[CharacterDetailModal] displayCharacter is null, modal will not render"
    );
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-xl">
        {/* Custom Close Button (since default might be hidden/obscured) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full p-2 bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-white transition-all shadow-sm"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogTitle className="sr-only">
          {displayCharacter?.profile?.name || "캐릭터 상세 정보"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          캐릭터 상세 정보를 확인하고 수정할 수 있는 모달입니다.
        </DialogDescription>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Left Sidebar (Fixed) */}
          <div className="w-full lg:w-[400px] bg-stone-50 border-b lg:border-b-0 lg:border-r border-stone-200 p-8 flex flex-col overflow-y-auto shrink-0 scrollbar-none">
            <CharacterHeader
              character={displayCharacter}
              optimisticImageUrl={tempImageUrl}
              onEdit={handleEdit}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange}
              onGenerateImage={handleOpenImageGeneration}
              isGeneratingImage={isGenerating}
              imageGenerationProgress={progress}
            />
          </div>

          {/* Right Content (Tabs) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <Tabs
              defaultValue="overview"
              className="flex-1 flex flex-col rounded-none h-full"
            >
              <div className="border-b border-stone-200 px-6 bg-gradient-to-b from-white to-stone-50/50 sticky top-0 z-10">
                <TabsList className="h-14 w-full justify-start gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="overview"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <Compass className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    개요
                  </TabsTrigger>
                  <span className="text-stone-300 self-center">·</span>
                  <TabsTrigger
                    value="profile"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <UserRound className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    프로필
                  </TabsTrigger>
                  <span className="text-stone-300 self-center">·</span>
                  <TabsTrigger
                    value="appearance"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <Palette className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    외모
                  </TabsTrigger>
                  <span className="text-stone-300 self-center">·</span>
                  <TabsTrigger
                    value="personality"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <Heart className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    성격
                  </TabsTrigger>
                  <span className="text-stone-300 self-center">·</span>
                  <TabsTrigger
                    value="relationships"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <Users className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    관계
                  </TabsTrigger>
                  <span className="text-stone-300 self-center">·</span>
                  <TabsTrigger
                    value="story"
                    className="group h-full rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold bg-transparent shadow-none hover:text-foreground"
                  >
                    <BookOpen className="h-4 w-4 mr-2 opacity-60 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all" />
                    스토리
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <ScrollArea className="flex-1 bg-stone-50/30">
                <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
                  {/* OVERVIEW TAB */}
                  <TabsContent
                    value="overview"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    {/* Image Gen Settings Block */}
                    <div className="editorial-card p-6 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Wand2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="editorial-name text-lg">
                            AI 이미지 생성
                          </h3>
                          <p className="magazine-caption text-xs mt-0.5">
                            캐릭터 시각화 설정
                          </p>
                        </div>
                      </div>
                      <Separator className="bg-stone-100" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="editorial-label">배경 스타일</Label>
                          <Select
                            value={selectedSettingId}
                            onValueChange={setSelectedSettingId}
                          >
                            <SelectTrigger className="bg-white border-stone-200 hover:border-primary/40 transition-colors">
                              <SelectValue placeholder="배경 선택 (기본)" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="z-[9999]"
                            >
                              <SelectItem value="none">
                                배경 없음 (캐릭터 중심)
                              </SelectItem>
                              {settings.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="editorial-label">추가 묘사</Label>
                          <Input
                            placeholder="예: 비를 맞고 있는, 활짝 웃는..."
                            className="bg-white border-stone-200 hover:border-primary/40 transition-colors"
                            value={manualPrompt}
                            onChange={(e) => setManualPrompt(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Visuals */}
                    <div className="space-y-4">
                      <h3 className="editorial-section-heading">
                        <Palette className="h-5 w-5 text-primary/70" />
                        외모 요약
                      </h3>
                      <CharacterVisual
                        appearance={displayCharacter.appearance}
                        isEditMode={false}
                      />
                    </div>

                    {/* Quick Story Progress */}
                    <CharacterArc progress={arcProgress} />
                  </TabsContent>

                  {/* PROFILE TAB (New Detailed Fields) */}
                  <TabsContent
                    value="profile"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    {/* Backstory - Pull Quote Style */}
                    <div className="space-y-4">
                      <h3 className="editorial-section-heading">
                        <BookOpen className="h-5 w-5 text-primary/70" />
                        배경 스토리
                      </h3>
                      {isEditMode ? (
                        <Textarea
                          value={displayCharacter.profile.backstory}
                          onChange={(e) =>
                            handleFieldChange(
                              "profile.backstory",
                              e.target.value
                            )
                          }
                          className="min-h-[160px] leading-relaxed font-serif"
                          placeholder="캐릭터의 과거와 배경을 입력하세요."
                        />
                      ) : (
                        <div className="pull-quote">
                          {displayCharacter.profile.backstory ||
                            "아직 입력된 배경 스토리가 없습니다. 캐릭터의 과거, 성장 배경, 중요한 사건들을 기록해보세요."}
                        </div>
                      )}
                    </div>

                    {/* Detailed Info Cards - Editorial Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="editorial-card p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-primary/70" />
                          <span className="editorial-label">직업</span>
                        </div>
                        {isEditMode ? (
                          <Input
                            value={displayCharacter.profile.occupation || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "profile.occupation",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-stone-800">
                            {displayCharacter.profile.occupation || "미정"}
                          </p>
                        )}
                      </div>

                      <div className="editorial-card p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-primary/70" />
                          <span className="editorial-label">출신지</span>
                        </div>
                        {isEditMode ? (
                          <Input
                            value={displayCharacter.profile.birthplace || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "profile.birthplace",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-stone-800">
                            {displayCharacter.profile.birthplace || "미정"}
                          </p>
                        )}
                      </div>

                      <div className="editorial-card p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <Users2 className="w-4 h-4 text-primary/70" />
                          <span className="editorial-label">가족 관계</span>
                        </div>
                        {isEditMode ? (
                          <Input
                            value={displayCharacter.profile.family || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "profile.family",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-stone-800">
                            {displayCharacter.profile.family || "미정"}
                          </p>
                        )}
                      </div>

                      <div className="editorial-card p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-primary/70" />
                          <span className="editorial-label">소속 세력</span>
                        </div>
                        <p className="text-sm font-semibold text-stone-800">
                          {displayCharacter.profile.faction?.name || "무소속"}
                        </p>
                      </div>

                      {/* Aliases - Full Width */}
                      {(displayCharacter.aliases?.length || 0) > 0 && (
                        <div className="editorial-card p-4 md:col-span-2">
                          <span className="editorial-label block mb-3">
                            별칭
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {displayCharacter.aliases?.map((alias, i) => (
                              <span key={i} className="editorial-tag">
                                {alias}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* APPEARANCE TAB */}
                  <TabsContent
                    value="appearance"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    <CharacterVisual
                      appearance={displayCharacter.appearance}
                      isEditMode={isEditMode}
                      onAppearanceChange={handleAppearanceChange}
                    />
                  </TabsContent>

                  {/* PERSONALITY TAB */}
                  <TabsContent
                    value="personality"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
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
                              coreTraits: newTraits,
                            },
                          };
                        });
                      }}
                    />
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
                  </TabsContent>

                  {/* RELATIONSHIPS TAB */}
                  <TabsContent
                    value="relationships"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    <CharacterRelationships relationships={relationships} />
                  </TabsContent>

                  {/* STORY TAB */}
                  <TabsContent
                    value="story"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    <CharacterAppearances appearances={appearances} />
                    <Separator className="bg-stone-200" />
                    <CharacterArc progress={arcProgress} />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

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
