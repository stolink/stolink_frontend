import { useState, useEffect, useCallback, ElementType } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Save,
  X,
  Compass, // Overview
  UserRound, // Profile
  Palette, // Appearance
  Heart, // Personality
  Users, // Relationships
  BookOpen, // Biography
  Wand2, // Image generation loading
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

// Hooks & Components & Constants
import { useCharacterData } from "@/hooks/useCharacterData";
import { CharacterHeader } from "./character-detail/components/CharacterHeader";
import { CharacterTraits } from "./character-detail/components/CharacterTraits";

import { CharacterRelationships } from "./character-detail/components/CharacterRelationships";
import { CharacterAppearances } from "./character-detail/components/CharacterAppearances";
import { CharacterAdditionalDetails } from "./character-detail/components/CharacterAdditionalDetails";
import { CharacterVisual } from "./character-detail/components/CharacterVisual";
import { CharacterBiography } from "./character-detail/components/CharacterBiography";

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
  const [activeTab, setActiveTab] = useState("overview"); // Tab state management
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
    if (displayCharacter) {
      // Basic logging for development check can remain if needed, but removing per user request
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
        // Force refresh by adding a timestamp if not already present or as a safety
        const cacheBusterUrl = imageUrl.includes("?")
          ? `${imageUrl}&t=${Date.now()}`
          : `${imageUrl}?t=${Date.now()}`;
        setTempImageUrl(cacheBusterUrl);
        setImageJobId(null);
      },
      onError: () => {
        setImageJobId(null);
      },
      onTimeout: () => {
        setImageJobId(null);
      },
    },
  );

  // Track previous character ID for detecting changes
  const [prevCharacterId, setPrevCharacterId] = useState<string | undefined>(
    character?._id,
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

  const { traits, relationships, appearances } = useCharacterData(
    displayCharacter, // displayCharacter 사용
  );

  const { toast } = useToast();
  const [selectedSettingId, setSelectedSettingId] = useState<string>("none");
  const [settings, setSettings] = useState<ProjectSetting[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");

  // Load settings
  useEffect(() => {
    if (isOpen && character?.projectId) {
      settingService
        .getAll(character.projectId)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setSettings(res.data);
          }
        })
        .catch(() => {
          // Error handling
        });
    }
  }, [isOpen, character?.projectId, character?._id]);

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
        if (sourceChar?.appearance?.hairColor) {
          parts.push(
            `Hair: ${sourceChar.appearance.hairColor} ${sourceChar.appearance.hairStyle}`,
          );
        }
        if (sourceChar?.appearance?.eyes) {
          parts.push(`Eyes: ${sourceChar.appearance.eyes}`);
        }
        if (sourceChar?.appearance?.attire) {
          const attire = Array.isArray(sourceChar.appearance.attire)
            ? sourceChar.appearance.attire.join(", ")
            : sourceChar.appearance.attire;
          if (attire) parts.push(`Attire: ${attire}`);
        }
        if (sourceChar?.appearance?.expression) {
          parts.push(`Expression: ${sourceChar.appearance.expression}`);
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

        // Determine setting
        const selectedSetting =
          settingOverride ||
          (selectedSettingId !== "none"
            ? settings.find((s) => s.id === selectedSettingId)
            : undefined);

        // Add background description if available
        if (selectedSetting?.description) {
          parts.push(`Background Style: ${selectedSetting.description}`);
        }

        const generatedPrompt =
          parts.length > 0
            ? parts.join(", ")
            : "A high quality character portrait";

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
      } catch {
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
    return null;
  }

  if (!displayCharacter) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Custom Dialog Content with Modern Glassmorphism */}
      <DialogContent className="max-w-[90vw] md:max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden bg-transparent border-none shadow-none ring-0 sm:rounded-3xl duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 [&>button]:hidden">
        {/* Main Container Wrapper - Warm Liquid Glass (Aligned with Tone & Manner) */}
        <div className="relative w-full h-full flex flex-col lg:flex-row bg-gradient-to-br from-[#FDFCFB]/95 via-[#F7F5F3]/90 to-[#F2EFE9]/85 backdrop-blur-3xl rounded-none sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(60,40,30,0.12)] border border-stone-200/60 ring-1 ring-stone-900/5 isolate">
          {/* 🌊 Living Background (Warm Aurora Blobs) */}
          <div className="absolute inset-0 -z-10 bg-stone-50/40 opacity-50">
            {/* Primary Tone (Mocha/Warm) */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-b from-primary/10 to-orange-100/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow" />
            {/* Neutral Warm Stone */}
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-stone-200/20 to-amber-100/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow delay-700" />
            {/* Soft Cloud Highlight */}
            <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-[#F5F5F0]/30 rounded-full blur-[80px] mix-blend-overlay animate-pulse-slow delay-1000" />
          </div>

          {/* Paper Texture Overlay for "Warm & Soft" Feel */}
          <div className="absolute inset-0 -z-0 opacity-[0.4] pointer-events-none mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-125" />

          {/* Left Sidebar (Character Identity) - Warm Frosted Panel */}
          <div className="w-full lg:w-[380px] xl:w-[420px] bg-gradient-to-b from-white/80 to-[#FAF9F6]/70 backdrop-filter border-b lg:border-b-0 lg:border-r border-stone-200/50 p-6 lg:p-8 flex flex-col overflow-y-auto shrink-0 scrollbar-hide z-10 shadow-[4px_0_24px_rgba(60,40,30,0.03)]">
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

          {/* Right Content (Tabs & Details) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative z-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="overview"
              className="flex-1 flex flex-col rounded-none h-full"
            >
              {/* ✨ Warm Stone Floating Tab Bar */}
              <div className="border-b border-stone-200/40 px-6 py-3 bg-gradient-to-r from-[#FAF9F6]/60 to-white/30 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <TabsList className="h-10 w-full justify-start gap-2 bg-[#F5F5F0]/50 p-1 rounded-full border border-stone-200/50 shadow-inner">
                  <TabItem value="overview" icon={Compass} label="개요" />
                  <TabItem value="profile" icon={UserRound} label="프로필" />
                  <TabItem value="appearance" icon={Palette} label="외모" />
                  <TabItem value="personality" icon={Heart} label="성격" />
                  <TabItem value="relationships" icon={Users} label="관계" />
                  <TabItem value="biography" icon={BookOpen} label="기록" />
                </TabsList>

                {/* Right Side Actions (Save/Cancel) - Hide in Biography Tab (It has own buttons) */}
                <div className="ml-auto flex items-center gap-2">
                  {isEditMode && activeTab !== "biography" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-stone-500 hover:text-stone-800 hover:bg-white/20"
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-5 shadow-lg shadow-stone-900/10"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        저장하기
                      </Button>
                    </>
                  ) : (
                    /* View Mode Close Button (Custom Placement for aesthetics) */
                    !isEditMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-800 hover:bg-stone-100/50 rounded-full w-8 h-8 ml-2 mr-2"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )
                  )}
                </div>

                {/* Close Button (Mobile Only, Desktop uses Dialog default X but we can customize) */}
                <div className="block lg:hidden ml-2">
                  {/* Mobile close button logic provided by Dialog primitive usually, but explicit can handle custom layout */}
                </div>
              </div>

              {/* Tab Contents Area */}
              <ScrollArea className="flex-1 bg-transparent">
                <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10 pb-20">
                  {/* OVERVIEW TAB */}
                  <TabsContent
                    value="overview"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    {/* Image Gen Settings Block */}
                    {/* Image Gen Settings Block - Glass Card */}
                    <div className="relative group overflow-hidden rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] duration-300 border border-white/60 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-md shadow-lg">
                      {/* Glossy Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 text-white ring-4 ring-white/50">
                          <Wand2 className="w-6 h-6 animate-pulse-slow" />
                        </div>
                        <div>
                          <h3 className="editorial-name text-xl text-stone-900">
                            스튜디오
                          </h3>
                          <p className="magazine-caption text-sm mt-0.5 text-stone-500">
                            AI와 함께 캐릭터의 모습을 이끌어내세요
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

                    {/* Character Essentials Summary - Enhanced Visuals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Core Profile & Personality */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-1">
                            <UserRound className="h-4 w-4 text-primary/70" />
                            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                              핵심 프로필
                            </h3>
                          </div>

                          <div className="editorial-card p-6 space-y-5 bg-gradient-to-br from-white/70 to-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all rounded-3xl group">
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm relative z-10">
                              <ProfileItem
                                label="직업"
                                value={displayCharacter.profile.occupation}
                                icon={Briefcase}
                              />
                              <ProfileItem
                                label="소속"
                                value={displayCharacter.profile.faction?.name}
                                icon={Flag}
                              />
                              <ProfileItem
                                label="나이"
                                value={
                                  displayCharacter.age
                                    ? `${displayCharacter.age}세`
                                    : undefined
                                }
                                icon={UserRound}
                              />
                              <ProfileItem
                                label="성별"
                                value={displayCharacter.gender}
                                icon={Users2}
                              />
                            </div>
                            {/* Decorative Icon Watermark */}
                            <UserRound className="absolute -bottom-4 -right-4 w-32 h-32 text-stone-900/[0.03] group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        </div>

                        {/* Personality Traits - Tags */}
                        {(displayCharacter.personality?.coreTraits?.length ||
                          0) > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                              <Heart className="h-4 w-4 text-primary/70" />
                              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                                성격 키워드
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {displayCharacter.personality.coreTraits.map(
                                (trait, i) => (
                                  <span
                                    key={i}
                                    className="px-4 py-1.5 rounded-full bg-white/60 text-stone-700 text-sm font-semibold border border-white/60 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default backdrop-blur-sm"
                                  >
                                    #{trait}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Visual Summary - Glass Card */}
                      <div className="space-y-4 h-full">
                        <div className="flex items-center gap-2 px-1">
                          <Palette className="h-4 w-4 text-primary/70" />
                          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                            외모 특징
                          </h3>
                        </div>
                        <div className="editorial-card p-6 space-y-4 h-full bg-gradient-to-br from-white/70 to-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl relative overflow-hidden group">
                          {/* Decorative Icon Watermark */}
                          <Palette className="absolute -top-6 -right-6 w-32 h-32 text-stone-900/[0.03] group-hover:rotate-12 transition-transform duration-500" />
                          <div className="relative z-10">
                            <CharacterVisual
                              appearance={displayCharacter.appearance}
                              isEditMode={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Quick Story Appearances */}
                    <CharacterAppearances appearances={appearances} />
                  </TabsContent>

                  {/* PROFILE TAB (New Detailed Fields) */}
                  <TabsContent
                    value="profile"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
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
                                e.target.value,
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
                                e.target.value,
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
                                e.target.value,
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

                  {/* BIOGRAPHY TAB */}
                  <TabsContent
                    value="biography"
                    className="space-y-8 m-0 outline-none editorial-fade-in"
                  >
                    <CharacterBiography
                      backstory={displayCharacter.profile.backstory}
                      isEditMode={isEditMode}
                      onBackstoryChange={(value: string) =>
                        handleFieldChange("profile.backstory", value)
                      }
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Helper Component for Tabs
function TabItem({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="group relative h-8 px-5 rounded-full font-medium text-stone-500 transition-all
      data-[state=active]:text-primary-foreground data-[state=active]:bg-stone-800 data-[state=active]:shadow-lg
      data-[state=active]:ring-2 data-[state=active]:ring-white/50
      hover:text-stone-900 hover:bg-white/50"
    >
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
        <span className="text-sm tracking-tight">{label}</span>
      </span>
    </TabsTrigger>
  );
}

// Helper for Profile Items
function ProfileItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon: ElementType;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-stone-400">
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-base font-semibold text-stone-800 pl-0.5">
        {value || <span className="text-stone-300 font-normal italic">-</span>}
      </span>
    </div>
  );
}
