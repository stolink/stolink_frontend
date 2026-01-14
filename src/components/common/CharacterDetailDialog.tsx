import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  useCharacter,
  useUpdateCharacter,
  useCharacters,
} from "@/hooks/useCharacters";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { useImageGenerationPolling } from "@/hooks/useImageGenerationPolling";
import { imageService, settingService, type ProjectSetting } from "@/services";
import { useToast } from "@/hooks/useToast";
// Removed useQueryClient to satisfy lint
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
  /** Fallback project ID if character.projectId is missing */
  projectId?: string;
}

export default function CharacterDetailDialog({
  character,
  isOpen,
  onClose,
  onSave,
  projectId: propProjectId,
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

  // 화면에 표시할 최종 캐릭터 데이터 (수정모드 > 페치가 완료된 데이터 > props 데이터)
  // [Fix] fetchedChar가 있으면 우선 사용 (imageUrl 유무와 관계없이 전체 데이터 활용)
  const displayCharacter = isEditMode
    ? editedCharacter
    : (fetchedChar ?? character);

  // Image generation polling
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const { toast } = useToast();
  // const queryClient = useQueryClient(); // Unused, removing to satisfy lint

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
      onError: (err) => {
        console.error("[ImageGeneration] Polling failed:", err);
        toast({
          variant: "destructive",
          title: "이미지 생성 실패",
          description: err || "알 수 없는 오류가 발생했습니다.",
        });
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
  // Replaced by useImageGenerationPolling hook's internal cache update
  // The hook now handles SetQueryData for both detail and list caches immediately.

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

  // [Fix] Sync editedCharacter with fresh fetched data when not editing
  // This ensures that after a save (or external update), the next edit starts with fresh data
  useEffect(() => {
    if (!isEditMode && fetchedChar) {
      setEditedCharacter(structuredClone(fetchedChar));
    }
  }, [fetchedChar, isEditMode]);

  // [Fix] 이미지가 새로 생성되었을 때 수정 모드인 경우에도 이미지 URL 동기화
  useEffect(() => {
    const newImage = fetchedChar?.imageUrl || character?.imageUrl;
    if (
      isEditMode &&
      editedCharacter &&
      newImage &&
      editedCharacter.imageUrl !== newImage
    ) {
      // If the incoming image is different (e.g. newly generated), update editedCharacter
      setEditedCharacter((prev) =>
        prev ? { ...prev, imageUrl: newImage } : prev,
      );
    }
  }, [
    fetchedChar?.imageUrl,
    character?.imageUrl,
    isEditMode,
    editedCharacter, // Corrected dependency
  ]);

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

  const { traits, relationships } = useCharacterData(
    displayCharacter, // displayCharacter 사용
  );

  // 캐릭터의 이벤트(일대기) 조회
  const { data: characterEvents = [] } = useCharacterEvents(
    displayCharacter?._id ?? null,
    {
      enabled: !!displayCharacter?._id && isOpen,
    },
  );

  // 프론트엔드 필터링: 백엔드가 모든 이벤트를 반환하는 경우 대비
  const realAppearances = useMemo(() => {
    if (!characterEvents || characterEvents.length === 0) return [];
    const charName = displayCharacter?.profile?.name;
    if (!charName) return [];

    return characterEvents
      .filter((e) => e.participants.includes(charName))
      .map((e) => e.narrativeSummary)
      .filter(Boolean);
  }, [characterEvents, displayCharacter?.profile?.name]);

  // 모든 캐릭터 정보 조회 (참여자 ID를 이름으로 변환하기 위함)
  const { data: allCharacters = [] } = useCharacters(
    displayCharacter?.projectId ?? "",
    {
      enabled: !!displayCharacter?.projectId && isOpen,
    },
  );

  // ID -> Name 매핑 생성
  const characterNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allCharacters.forEach((c) => {
      if (c._id) map[c._id] = c.profile.name;
    });
    return map;
  }, [allCharacters]);

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

    const {
      _id,
      projectId: charProjectId,
      meta: _meta,
      ...basePayload
    } = editedCharacter;
    const cleanPayload =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sanitizeValue(basePayload) as Record<string, any>) || {};

    // Standardize to user rule: all camelCase, except project_id
    const effectiveProjectId = charProjectId || propProjectId;
    if (effectiveProjectId) {
      cleanPayload.project_id = effectiveProjectId;
    }

    // Ensure imageUrl is included if present
    if (editedCharacter.imageUrl) {
      cleanPayload.imageUrl = editedCharacter.imageUrl;
    }

    if (!cleanPayload.profile) cleanPayload.profile = {};

    // [New] Profile Personality Mapping (snake_case inside nested objects)
    if (cleanPayload.profile.personality) {
      const p = cleanPayload.profile.personality;
      if (p.coreTraits) {
        p.core_traits = p.coreTraits;
        delete p.coreTraits;
      }
      // personality top-level also needs mapping if exists independently
      if (cleanPayload.personality) {
        cleanPayload.personality.core_traits =
          cleanPayload.personality.coreTraits;
        delete cleanPayload.personality.coreTraits;
      }
    }

    if (cleanPayload.appearance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const app = cleanPayload.appearance as any;

      // Map to snake_case for backend compatibility within nested object
      if (app.hairStyle) app.hair_style = app.hairStyle;
      if (app.hairColor) app.hair_color = app.hairColor;
      if (app.skinTone) app.skin_tone = app.skinTone;
      if (app.scarsTattoos) app.scars_tattoos = app.scarsTattoos;
      if (app.styleContext) {
        app.style_context = {
          art_style: app.styleContext.artStyle || app.styleContext.art_style,
        };
        delete app.styleContext;
      }

      // Cleanup camelCase after mapping
      delete app.hairStyle;
      delete app.hairColor;
      delete app.skinTone;
      delete app.scarsTattoos;

      // Cleanup undefined
      Object.keys(app).forEach((key) => {
        if (app[key] === undefined) delete app[key];
      });

      // Redundant JSON backups (using the processed snake_case version)
      const jsonStr = JSON.stringify(app);
      app.appearanceJson = jsonStr;
      cleanPayload.appearanceJson = jsonStr;
    }

    return cleanPayload;
  }, [editedCharacter, sanitizeValue, propProjectId]);

  const handleConfirmImageGeneration = useCallback(
    async (
      action: "create" | "edit",
      projectIdOverride?: string,
      _promptOverride?: string,
      settingOverride?: Record<string, unknown>,
    ) => {
      // Use displayCharacter which has the latest data from API
      const targetChar = displayCharacter || character;
      // Use projectIdOverride as fallback if character.projectId is missing
      const effectiveProjectId =
        targetChar?.projectId || projectIdOverride || propProjectId;

      if (!targetChar?._id || !effectiveProjectId) {
        toast({
          variant: "destructive",
          title: "오류",
          description: "캐릭터 정보가 올바르지 않습니다.",
        });
        return;
      }

      try {
        // Construct prompt from character attributes
        const parts: string[] = [];

        if (targetChar?.profile?.name) {
          parts.push(`Character: ${targetChar.profile.name}`);
        }
        if (targetChar?.appearance?.physique) {
          parts.push(`Physique: ${targetChar.appearance.physique}`);
        }
        if (targetChar?.appearance?.hairColor) {
          parts.push(
            `Hair: ${targetChar.appearance.hairColor} ${targetChar.appearance.hairStyle}`,
          );
        }
        if (targetChar?.appearance?.eyes) {
          parts.push(`Eyes: ${targetChar.appearance.eyes}`);
        }
        if (targetChar?.appearance?.attire) {
          const attire = Array.isArray(targetChar.appearance.attire)
            ? targetChar.appearance.attire.join(", ")
            : targetChar.appearance.attire;
          if (attire) parts.push(`Attire: ${attire}`);
        }
        if (targetChar?.appearance?.expression) {
          parts.push(`Expression: ${targetChar.appearance.expression}`);
        }
        if (targetChar?.personality?.coreTraits?.length > 0) {
          parts.push(`Traits: ${targetChar.personality.coreTraits.join(", ")}`);
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
        // Extract precise prompt fields from setting if available (for backend to use directly)
        const cleanSetting = selectedSetting
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
          effectiveProjectId,
          targetChar._id,
          action,
          generatedPrompt,
          cleanSetting, // Pass clean setting as 5th arg (replaces raw object)
          cleanSetting, // Pass same clean object as 6th arg (for root-level backward compat)
          (characterData as Record<string, unknown>) || undefined,
        );

        setImageJobId(jobId);
        setGlobalJobId(jobId, "image", targetChar._id);
        toast({
          title: action === "create" ? "이미지 생성 시작" : "이미지 수정 시작",
          description: "잠시만 기다려 주세요.",
        });
      } catch (err) {
        console.error("[ImageGeneration] API call failed:", err);
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
      propProjectId,
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

  const validateImageGeneration = useCallback(() => {
    const targetChar = displayCharacter || character;
    if (!targetChar) return false;

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
    const traits = targetChar.personality?.coreTraits;
    if (traits && traits.length > 0) traitCount++;

    return traitCount >= 2;
  }, [displayCharacter, character]);

  const handleOpenImageGeneration = useCallback(() => {
    const targetChar = displayCharacter || character;

    // Validation: Check if character has enough info (Name + at least 2 traits)
    if (!validateImageGeneration()) {
      toast({
        variant: "destructive",
        title: "정보 부족",
        description:
          "이미지를 생성하려면 이름 외에 최소 2가지 이상의 특징(외모, 성격 등)을 입력해주세요.",
      });
      return;
    }

    const mode = targetChar?.imageUrl ? "edit" : "create";
    handleConfirmImageGeneration(mode, propProjectId);
  }, [
    handleConfirmImageGeneration,
    validateImageGeneration,
    displayCharacter,
    character,
    propProjectId,
    toast,
  ]);

  const handleSave = useCallback(async () => {
    if (!editedCharacter || !character?._id) {
      return;
    }

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

      if (!cleanPayload) {
        return;
      }

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

      // 3. Compare data to detect changes for image update
      const hasImageRelevantChanges =
        !isEqual(character?.appearance, editedCharacter.appearance) ||
        !isEqual(
          character?.personality?.coreTraits,
          editedCharacter.personality?.coreTraits,
        ) ||
        character?.profile?.name !== editedCharacter.profile?.name;

      if (onSave) {
        onSave(editedCharacter);
      }

      // 4. Trigger image generation if relevant data changed
      if (hasImageRelevantChanges) {
        if (character?.imageUrl) {
          // Existing image -> update
          handleConfirmImageGeneration("edit", "");
        } else if (validateImageGeneration()) {
          // No image yet -> create (only if sufficient info)
          handleConfirmImageGeneration("create", "");
        }
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
    validateImageGeneration,
    updateCharacter,
    toast,
    getCleanPayload,
  ]);

  const handleFieldChange = useCallback(
    (field: string, value: string | string[]) => {
      setEditedCharacter((prev) => {
        if (!prev) return prev;

        // Handle nested paths like "profile.name", "profile.occupation"
        const keys = field.split(".");
        if (keys.length === 1) {
          return { ...prev, [field]: value };
        }

        // Deep clone and set nested value
        const result = structuredClone(prev);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = result;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        return result;
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
                    <CharacterAppearances
                      appearances={realAppearances}
                      biography={displayCharacter.profile.backstory}
                    />
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
                      characterNameMap={characterNameMap}
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
