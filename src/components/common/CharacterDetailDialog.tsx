import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@stolink/ui";
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
  Briefcase, // Profile - occupation
  Flag, // Profile - origin
  MapPin, // Profile - location
  Users2, // Profile - affiliations
} from "lucide-react";

import { isEqual } from "lodash-es";
import type { Character } from "@/types";
import { useCharacter, useUpdateCharacter } from "@/hooks/useCharacters";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { useImageGenerationPolling } from "@/hooks/useImageGenerationPolling";
import { imageService, settingService, type ProjectSetting } from "@/services";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query"; // Added useQueryClient
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@stolink/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks & Components & Constants
import { useCharacterData } from "@/hooks/useCharacterData";
import { useCharacterEvents } from "@/hooks/useEvents";
import { CharacterHeader } from "./character-detail/components/CharacterHeader";
import { CharacterTraits } from "./character-detail/components/CharacterTraits";

import { CharacterRelationships } from "./character-detail/components/CharacterRelationships";
import { CharacterAppearances } from "./character-detail/components/CharacterAppearances";
import { CharacterAdditionalDetails } from "./character-detail/components/CharacterAdditionalDetails";
import { CharacterVisual } from "./character-detail/components/CharacterVisual";
import { CharacterBiography } from "./character-detail/components/CharacterBiography";

interface CharacterDetailDialogProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: Character) => void;
}

export default function CharacterDetailDialog({
  character,
  isOpen,
  onClose,
  onSave,
}: CharacterDetailDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<Character | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("overview"); // Tab state management
  const [imageJobId, setImageJobId] = useState<string | null>(null);
  const setGlobalJobId = useAnalysisBufferStore((state) => state.setJobId);

  // Data Mutation Hook
  const updateCharacter = useUpdateCharacter();

  // Fetch fresh character data
  // 만약 DB에는 데이터가 있는데 리스트에는 없을 경우를 대비해 상세 조회
  const { data: fetchedChar } = useCharacter(character?._id ?? "", {
    enabled: !!character?._id && isOpen,
  });

  // 화면에 표시할 최종 캐릭터 데이터 (수정모드 > 페치된 데이터 > props 데이터)
  const displayCharacter = isEditMode
    ? editedCharacter
    : fetchedChar || character; // 페치된 데이터 우선 사용

  // Image generation polling
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Watch for global image job completion
  const isGlobalAnalyzing = useAnalysisBufferStore(
    (state) => state.isAnalyzing,
  );

  // Image generation polling
  const { isGenerating: isPollingImage, progress: pollingProgress } =
    useImageGenerationPolling(imageJobId, character?._id || "", {
      onComplete: (imageUrl) => {
        // Force refresh by adding a timestamp if not already present or as a safety
        const cacheBusterUrl = imageUrl.includes("?")
          ? `${imageUrl}&t=${Date.now()}`
          : `${imageUrl}?t=${Date.now()}`;
        setTempImageUrl(cacheBusterUrl);
        setImageJobId(null);
        setGlobalJobId(null); // Clear global job tracking
      },
      onError: () => {
        setImageJobId(null);
      },
      onTimeout: () => {
        setImageJobId(null);
      },
    });

  const currentJobType = useAnalysisBufferStore(
    (state) => state.currentJobType,
  );

  // If we have a local imageJobId but global analysis stopped (and it was our job), it means it's done.
  // Add minimum display time to ensure animation is visible even for fast jobs
  useEffect(() => {
    if (imageJobId && !isGlobalAnalyzing && currentJobType !== "image") {
      // Job finished - add delay to ensure animation is visible
      const timer = setTimeout(async () => {
        // Use refetchQueries instead of invalidateQueries for immediate data refresh
        await queryClient.refetchQueries({ queryKey: ["characters"] });
        await queryClient.refetchQueries({
          queryKey: ["character", character?._id],
        });
        setImageJobId(null);
        setTempImageUrl(null); // Clear temp, let real data take over
      }, 800); // Minimum 800ms animation display

      return () => clearTimeout(timer);
    }
  }, [
    imageJobId,
    isGlobalAnalyzing,
    currentJobType,
    queryClient,
    character?._id,
  ]);

  // Use local imageJobId as primary indicator for animation
  // This ensures animation shows even if global state updates faster than React re-renders
  const isGenerating = !!imageJobId || isPollingImage;
  // Use global progress if available, otherwise show indeterminate
  const progress =
    isGlobalAnalyzing && currentJobType === "image"
      ? useAnalysisBufferStore.getState().progress || pollingProgress
      : pollingProgress;

  // Track previous character ID for detecting changes
  const [prevCharacterId, setPrevCharacterId] = useState<string | undefined>(
    character?._id,
  );
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset edit mode and generation state when modal closes or character changes (without useEffect setState)
  // 주의: 이미지 생성은 백그라운드에서 계속 진행되므로 글로벌 분석 상태는 정리하지 않음
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
      // Try to recover background job for this character if it exists in global store
      const globalState = useAnalysisBufferStore.getState();
      if (
        globalState.currentJobType === "image" &&
        globalState.currentJobTargetId === character._id &&
        globalState.currentJobId
      ) {
        setImageJobId(globalState.currentJobId);
      } else {
        setImageJobId(null);
      }
      setTempImageUrl(null);
    }
  }

  // Effect to recover background job if dialog reopens with same character
  useEffect(() => {
    if (isOpen && character?._id && !imageJobId) {
      const globalState = useAnalysisBufferStore.getState();
      if (
        globalState.currentJobType === "image" &&
        globalState.currentJobTargetId === character._id &&
        globalState.currentJobId
      ) {
        setImageJobId(globalState.currentJobId);
      }
    }
  }, [isOpen, character?._id, imageJobId]);

  const { traits, relationships, appearances } = useCharacterData(
    displayCharacter, // displayCharacter 사용
  );

  // 캐릭터의 이벤트(일대기) 조회
  const { data: characterEvents = [] } = useCharacterEvents(
    displayCharacter?._id ?? null,
    {
      enabled: !!displayCharacter?._id && isOpen,
    },
  );

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
            // Deduplicate and filter valid settings to prevent key collisions
            const validSettings = res.data.filter((s) => s && s.id);
            const uniqueSettings = Array.from(
              new Map(validSettings.map((s) => [s.id, s])).values(),
            );
            setSettings(uniqueSettings);
          }
        })
        .catch((_e) => {
          /* Ignored */
        });
    }
  }, [isOpen, character?.projectId, character?._id]);

  /* ------------------------------------------------------------------
   * Payload Processing Helpers
   * ------------------------------------------------------------------ */

  const sanitizeValue = useCallback((obj: unknown): unknown => {
    if (obj === null || obj === undefined) return undefined;
    if (Array.isArray(obj)) {
      const sanitizedArray = obj
        .map((v) => sanitizeValue(v))
        .filter((v) => v !== undefined && v !== null);
      return sanitizedArray.length > 0 ? sanitizedArray : [];
    }
    if (typeof obj === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const sanitizedVal = sanitizeValue(value);
        if (sanitizedVal !== undefined && sanitizedVal !== null) {
          sanitizedObj[key] = sanitizedVal;
        }
      });
      return Object.keys(sanitizedObj).length > 0 ? sanitizedObj : undefined;
    }
    return obj;
  }, []);

  /**
   * 백엔드 전송용 클린 페이로드를 생성합니다.
   * - 읽기 전용 필드 제거
   * - 깊은 산출(undefined 제거)
   * - 하이브리드 키(snake_case) 보강
   * - JSON 문자열 백업 추가
   */
  const getCleanPayload = useCallback(() => {
    if (!editedCharacter) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, projectId, meta, imageUrl, ...basePayload } = editedCharacter;
    const cleanPayload =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sanitizeValue(basePayload) as Record<string, any>) || {};

    if (!cleanPayload.profile) cleanPayload.profile = {};

    if (cleanPayload.appearance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const app = cleanPayload.appearance as any;

      // Add snake_case aliases
      if (app.hairStyle) app.hair_style = app.hairStyle;
      if (app.hairColor) app.hair_color = app.hairColor;
      if (app.skinTone) app.skin_tone = app.skinTone;
      if (app.scarsTattoos) app.scars_tattoos = app.scarsTattoos;
      if (app.styleContext) {
        app.style_context = {
          ...app.styleContext,
          art_style: app.styleContext.artStyle,
        };
      }

      // Cleanup undefined
      Object.keys(app).forEach((key) => {
        if (app[key] === undefined) delete app[key];
      });

      // Redundant JSON backups
      const jsonStr = JSON.stringify(app);
      app.appearanceJson = jsonStr;
      app.appearance_json = jsonStr;
      cleanPayload.appearanceJson = jsonStr;
      cleanPayload.appearance_json = jsonStr;
    }

    return cleanPayload;
  }, [editedCharacter, sanitizeValue]);

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

        // Extract precise prompt fields from setting if available (for backend to use directly)
        const additionalOptions = selectedSetting
          ? {
              visual_background: String(
                selectedSetting.visual_background || "",
              ),
              atmosphere: String(selectedSetting.atmosphere || ""),
              lighting: String(selectedSetting.lighting || ""),
              time_of_day: String(selectedSetting.time_of_day || ""),
              art_style: String(selectedSetting.art_style || ""),
            }
          : undefined;

        // Get character data to sync with backend during generation
        const characterData = getCleanPayload();

        const { jobId } = await imageService.generateCharacterImage(
          character.projectId,
          character._id,
          action,
          generatedPrompt,
          selectedSetting as unknown as Record<string, string>,
          additionalOptions,
          (characterData as Record<string, unknown>) || undefined,
        );

        setImageJobId(jobId);
        setGlobalJobId(jobId, "image", character._id);
        toast({
          title: action === "create" ? "이미지 생성 시작" : "이미지 수정 시작",
          description: "잠시만 기다려 주세요.",
        });
      } catch (_e) {
        /* Ignored */
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
      setGlobalJobId,
      getCleanPayload,
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
    // Validation: Check if character has enough info (Name + at least 2 traits)
    const targetChar = displayCharacter || character;
    if (!targetChar) return;

    let traitCount = 0;
    if (targetChar.appearance?.physique) traitCount++;
    if (targetChar.appearance?.hairColor || targetChar.appearance?.hairStyle)
      traitCount++;
    if (targetChar.appearance?.eyes) traitCount++;
    if (
      targetChar.appearance?.attire &&
      (Array.isArray(targetChar.appearance.attire)
        ? targetChar.appearance.attire.length > 0
        : !!targetChar.appearance.attire)
    )
      traitCount++;
    if (targetChar.appearance?.expression) traitCount++;
    if (targetChar.personality?.coreTraits?.length > 0) traitCount++;

    // Name is basic, so we need 2 more traits
    // displayCharacter.profile.name is usually present
    if (traitCount < 2) {
      toast({
        variant: "destructive", // "warning" is not supported by useToast, using destructive for validation error
        title: "정보 부족",
        description:
          "이미지를 생성하려면 이름 외에 최소 2가지 이상의 특징(외모, 성격 등)을 입력해주세요.",
      });
      return;
    }

    handleConfirmImageGeneration("create");
  }, [handleConfirmImageGeneration, displayCharacter, character, toast]);

  const handleSave = useCallback(async () => {
    if (!editedCharacter || !character?._id) return;

    // 0. Primary Validation
    if (!editedCharacter.profile?.name?.trim()) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "캐릭터 이름은 필수입니다.",
      });
      return;
    }

    try {
      const cleanPayload = getCleanPayload();
      if (!cleanPayload) return;

      // 1. Call Backend API to update character
      // Mutation hook now handles cache update (immediate) and delayed refetch (safe)
      await updateCharacter.mutateAsync({
        id: character._id,
        payload: cleanPayload,
      });

      toast({
        variant: "success",
        title: "저장 성공",
        description: "캐릭터 정보가 저장되었습니다.",
      });

      // 3. Compare appearance to detect changes for image update
      const hasAppearanceChanged = !isEqual(
        character?.appearance,
        editedCharacter.appearance,
      );

      if (onSave) {
        onSave(editedCharacter);
      }

      // 4. If appearance changed and there's already an image, trigger auto-edit (only if not doing manual gen)
      if (hasAppearanceChanged && character?.imageUrl) {
        handleConfirmImageGeneration("edit", "");
      }

      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to save character:", error);
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: "캐릭터 정보를 저장하는 중 오류가 발생했습니다.",
      });
    }
  }, [
    editedCharacter,
    character,
    onSave,
    handleConfirmImageGeneration,
    updateCharacter,
    toast,
    getCleanPayload,
  ]);

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
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>
            {displayCharacter?.profile?.name || "캐릭터"} 상세 정보
          </DialogTitle>
          <DialogDescription>
            캐릭터의 프로필, 외모, 성격, 관계, 전기 정보를 확인하고 편집할 수
            있습니다.
          </DialogDescription>
        </VisuallyHidden>

        {/* Main Container Wrapper - Warm Liquid Glass (Aligned with Tone & Manner) */}
        <div className="relative w-full h-full flex flex-col lg:flex-row bg-gradient-to-br from-paper/95 via-card/90 to-card/85 backdrop-blur-3xl rounded-none sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(60,40,30,0.12)] border border-cloud-200/60 ring-1 ring-espresso-900/5 isolate">
          {/* 🌊 Living Background (Warm Aurora Blobs) */}
          <div className="absolute inset-0 -z-10 bg-paper/40 opacity-50">
            {/* Primary Tone (Mocha/Warm) */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-b from-primary/10 to-orange-100/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow" />
            {/* Neutral Warm Stone */}
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cloud-200/20 to-amber-100/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow delay-700" />
            {/* Soft Cloud Highlight */}
            <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-[#F5F5F0]/30 rounded-full blur-[80px] mix-blend-overlay animate-pulse-slow delay-1000" />
          </div>

          {/* Paper Texture Overlay for "Warm & Soft" Feel */}
          <div className="absolute inset-0 -z-0 opacity-[0.4] pointer-events-none mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-125" />

          {/* Left Sidebar (Character Identity) - Warm Frosted Panel */}
          <div className="w-full lg:w-[380px] xl:w-[420px] bg-gradient-to-b from-paper/80 to-paper/70 backdrop-filter border-b lg:border-b-0 lg:border-r border-cloud-200/50 p-6 lg:p-8 flex flex-col overflow-y-auto shrink-0 scrollbar-hide z-10 shadow-[4px_0_24px_rgba(60,40,30,0.03)]">
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
              <div className="border-b border-cloud-200/40 px-6 py-3 bg-gradient-to-r from-cloud-50/60 to-white/30 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <TabsList className="h-10 w-full justify-start gap-2 bg-muted/50 p-1 rounded-full border border-cloud-200/50 shadow-inner">
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
                        intent="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-mocha-900 hover:text-espresso-900 hover:bg-paper/20"
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        intent="primary"
                        onClick={handleSave}
                        className="rounded-full px-5 shadow-lg shadow-mocha-900/10"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        저장하기
                      </Button>
                    </>
                  ) : (
                    /* View Mode Close Button (Custom Placement for aesthetics) */
                    !isEditMode && (
                      <Button
                        intent="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-mocha-400 hover:text-espresso-900 hover:bg-muted/50 rounded-full w-8 h-8 ml-2 mr-2"
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
                    <div className="relative group overflow-hidden rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] duration-300 border border-white/60 bg-gradient-to-br from-paper/80 to-paper/40 backdrop-blur-md shadow-lg">
                      {/* Glossy Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 text-white ring-4 ring-white/50">
                          <Wand2 className="w-6 h-6 animate-pulse-slow" />
                        </div>
                        <div>
                          <h3 className="editorial-name text-xl text-espresso-900">
                            스튜디오
                          </h3>
                          <p className="magazine-caption text-sm mt-0.5 text-espresso-500">
                            AI와 함께 캐릭터의 모습을 이끌어내세요
                          </p>
                        </div>
                      </div>
                      <Separator className="bg-cloud-100" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="editorial-label">배경 스타일</Label>
                          <Select
                            value={selectedSettingId}
                            onValueChange={setSelectedSettingId}
                          >
                            <SelectTrigger className="bg-paper border-cloud-200 hover:border-primary/40 transition-colors">
                              <SelectValue placeholder="배경 선택 (기본)" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="z-[9999]"
                            >
                              <SelectItem value="none">
                                배경 없음 (캐릭터 중심)
                              </SelectItem>
                              {settings.map((s, i) => (
                                <SelectItem key={`${s.id}-${i}`} value={s.id}>
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
                            className="bg-paper border-cloud-200 hover:border-primary/40 transition-colors"
                            value={manualPrompt}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setManualPrompt(e.target.value)}
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
                            <h3 className="text-sm font-bold text-espresso-500 uppercase tracking-widest">
                              핵심 프로필
                            </h3>
                          </div>

                          <div className="editorial-card p-6 space-y-5 bg-gradient-to-br from-paper/70 to-paper/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all rounded-3xl group">
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
                                  displayCharacter.profile.age
                                    ? `${displayCharacter.profile.age}세`
                                    : undefined
                                }
                                icon={UserRound}
                              />
                              <ProfileItem
                                label="성별"
                                value={displayCharacter.profile.gender}
                                icon={Users2}
                              />
                            </div>
                            {/* Decorative Icon Watermark */}
                            <UserRound className="absolute -bottom-4 -right-4 w-32 h-32 text-espresso-900/[0.03] group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        </div>

                        {/* Personality Traits - Tags */}
                        {(displayCharacter.personality?.coreTraits?.length ||
                          0) > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                              <Heart className="h-4 w-4 text-primary/70" />
                              <h3 className="text-sm font-bold text-espresso-500 uppercase tracking-widest">
                                성격 키워드
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {displayCharacter.personality.coreTraits.map(
                                (trait, i) => (
                                  <span
                                    key={i}
                                    className="px-4 py-1.5 rounded-full bg-paper/60 text-espresso-700 text-sm font-semibold border border-white/60 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default backdrop-blur-sm"
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
                          <h3 className="text-sm font-bold text-espresso-500 uppercase tracking-widest">
                            외모 특징
                          </h3>
                        </div>
                        <div className="editorial-card p-6 space-y-4 h-full bg-gradient-to-br from-paper/70 to-paper/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl relative overflow-hidden group">
                          {/* Decorative Icon Watermark */}
                          <Palette className="absolute -top-6 -right-6 w-32 h-32 text-espresso-900/[0.03] group-hover:rotate-12 transition-transform duration-500" />
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
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleFieldChange(
                                "profile.occupation",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-espresso-800">
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
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleFieldChange(
                                "profile.birthplace",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-espresso-800">
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
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              handleFieldChange(
                                "profile.family",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-espresso-800">
                            {displayCharacter.profile.family || "미정"}
                          </p>
                        )}
                      </div>

                      <div className="editorial-card p-4 hover-lift">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-primary/70" />
                          <span className="editorial-label">소속 세력</span>
                        </div>
                        <p className="text-sm font-semibold text-espresso-800">
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
                      events={characterEvents}
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="group relative h-8 px-5 rounded-full font-medium text-espresso-500 transition-all
      data-[state=active]:text-white data-[state=active]:!bg-espresso-900 data-[state=active]:shadow-lg
      data-[state=active]:ring-2 data-[state=active]:ring-white/50
      hover:text-espresso-900 hover:bg-white/50"
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
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-espresso-400">
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-base font-semibold text-espresso-800 pl-0.5">
        {value || (
          <span className="text-espresso-300 font-normal italic">-</span>
        )}
      </span>
    </div>
  );
}
