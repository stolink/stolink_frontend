import {
  Edit,
  Sparkles,
  Feather,
  MapPin,
  Briefcase,
  Users2,
  BookMarked,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { roleLabels } from "../constants";

interface CharacterHeaderProps {
  character: Character;
  optimisticImageUrl?: string | null;
  onEdit?: () => void;
  isEditMode?: boolean;
  onGenerateImage?: () => void;
  isGeneratingImage?: boolean;
  imageGenerationProgress?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFieldChange?: (field: string, value: any) => void;
}

export function CharacterHeader({
  character,
  optimisticImageUrl,
  onEdit,
  isEditMode = false,
  onGenerateImage,
  isGeneratingImage = false,
  imageGenerationProgress = 0,
  onFieldChange,
}: CharacterHeaderProps) {
  const roleInfo = roleLabels[character.role || "other"];

  const profile = character.profile;
  const name = profile?.name || "이름 없음";
  const age = profile?.age;
  const gender = profile?.gender;
  const faction = profile?.faction?.name;

  const fallbackTimestamp = character.meta?.updatedAt || "0";
  const displayImageUrl =
    optimisticImageUrl ||
    (character.imageUrl
      ? `${character.imageUrl}${character.imageUrl.includes("?") ? "&" : "?"}cb=${fallbackTimestamp}`
      : null);

  // Role emoji mapping
  const roleEmoji =
    character.role === "protagonist"
      ? "🦸"
      : character.role === "antagonist"
        ? "🦹"
        : character.role === "mentor"
          ? "🧙"
          : "👤";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Magazine-style Image Container */}
      <div className="magazine-image-container group shadow-xl">
        {displayImageUrl ? (
          <>
            <img
              src={displayImageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="magazine-image-overlay" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-white">
            <span
              className="text-8xl filter drop-shadow-lg select-none opacity-60"
              role="img"
              aria-label={character.role}
            >
              {roleEmoji}
            </span>
          </div>
        )}

        {/* Floating Role Badge */}
        <div className={cn("floating-badge", roleInfo.color)}>
          {roleInfo.label}
        </div>

        {/* Image generation overlay */}
        {isGeneratingImage && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all duration-300">
            <div className="relative">
              <Feather className="h-14 w-14 text-white ink-splash-loading filter drop-shadow-xl" />
            </div>
            <p className="mt-4 text-white/90 text-sm font-medium">
              이미지 생성 중...
            </p>
            {imageGenerationProgress > 0 && (
              <div className="mt-2 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${imageGenerationProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button for Generation */}
        {onGenerateImage && !isEditMode && !isGeneratingImage && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onGenerateImage()}
            disabled={isGeneratingImage}
            className="absolute bottom-4 right-4 h-11 w-11 rounded-full shadow-xl border-2 border-white/80 hover:scale-110 transition-all duration-200 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            title="AI 이미지 생성"
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
        )}
      </div>

      {/* Main Identity Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditMode ? (
              <Input
                value={name}
                onChange={(e) =>
                  onFieldChange?.("profile.name", e.target.value)
                }
                className="text-2xl font-bold h-12 border-stone-300 focus:ring-primary"
                placeholder="캐릭터 이름"
              />
            ) : (
              <h1 className="editorial-name text-3xl font-normal text-stone-900 break-keep">
                {name}
              </h1>
            )}
            <p className="magazine-caption mt-1.5">
              {gender || "미정"} · {age ? `${age}세` : "나이 미상"}
            </p>
          </div>

          {onEdit && !isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-9 w-9 shrink-0 rounded-full border border-stone-200 hover:bg-white hover:shadow-md hover:border-primary/30 transition-all"
            >
              <Edit className="h-4 w-4 text-stone-500" />
            </Button>
          )}
        </div>

        {/* Profile Attributes - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
          {profile?.occupation && (
            <div className="editorial-card p-3 hover-lift">
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                <span className="editorial-label">직업</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {profile.occupation}
              </p>
            </div>
          )}

          {profile?.birthplace && (
            <div className="editorial-card p-3 hover-lift">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                <span className="editorial-label">출신</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {profile.birthplace}
              </p>
            </div>
          )}

          {profile?.family && (
            <div className="editorial-card p-3 hover-lift">
              <div className="flex items-center gap-2 mb-1.5">
                <Users2 className="h-3.5 w-3.5 text-primary/70" />
                <span className="editorial-label">가족</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {profile.family}
              </p>
            </div>
          )}

          {character.firstAppearance && (
            <div className="editorial-card p-3 hover-lift">
              <div className="flex items-center gap-2 mb-1.5">
                <BookMarked className="h-3.5 w-3.5 text-primary/70" />
                <span className="editorial-label">첫 등장</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {character.firstAppearance}
              </p>
            </div>
          )}

          {faction && (
            <div className="editorial-card p-3 hover-lift col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="h-3.5 w-3.5 text-primary/70" />
                <span className="editorial-label">소속 세력</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {faction}
              </p>
            </div>
          )}
        </div>

        {/* Aliases as Editorial Tags */}
        {character.aliases && character.aliases.length > 0 && (
          <div className="pt-3">
            <span className="editorial-label block mb-2">별칭</span>
            <div className="flex flex-wrap gap-1.5">
              {character.aliases.map((alias, idx) => (
                <span key={idx} className="editorial-tag">
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="mt-auto pt-6 border-t border-stone-100">
        <p className="magazine-caption text-xs">
          마지막 수정:{" "}
          {character.meta?.updatedAt
            ? new Date(character.meta.updatedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "알 수 없음"}
        </p>
      </div>
    </div>
  );
}
