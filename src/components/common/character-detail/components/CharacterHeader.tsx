import { Edit, Users, Shield, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { roleLabels } from "../constants";

interface CharacterHeaderProps {
  character: Character;
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
  onEdit,
  isEditMode = false,
  onGenerateImage,
  isGeneratingImage = false,
  imageGenerationProgress = 0,
  onFieldChange,
}: CharacterHeaderProps) {
  const roleInfo = roleLabels[character.role || "other"];

  // 새 스키마: profile에서 정보 추출
  const profile = character.profile;
  const name = profile?.name || "이름 없음";
  const age = profile?.age;
  const gender = profile?.gender;
  const faction = profile?.faction?.name;
  const relationCount = character.relations?.graph?.length || 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start mb-8 border-b border-border pb-8">
      {/* Profile Image */}
      <div className="h-28 w-28 rounded-xl shrink-0 border border-input shadow-md ring-4 ring-cloud-50 overflow-hidden bg-muted relative">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-cloud-50 to-muted">
            {character.role === "protagonist"
              ? "🦸"
              : character.role === "antagonist"
                ? "🦹"
                : character.role === "mentor"
                  ? "🧙"
                  : "👤"}
          </div>
        )}
        {/* Image generation overlay */}
        {isGeneratingImage && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <Sparkles className="h-6 w-6 animate-pulse text-purple-300 mb-1" />
            <span className="text-xs font-mono text-white font-bold">
              {imageGenerationProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isEditMode ? (
                <Input
                  value={name}
                  onChange={(e) =>
                    onFieldChange?.("profile.name", e.target.value)
                  }
                  className="text-2xl font-bold h-10 w-64"
                  placeholder="캐릭터 이름"
                />
              ) : (
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {name}
                </h1>
              )}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                  roleInfo.color,
                )}
              >
                {roleInfo.label}
              </span>
            </div>

            {/* 기본 정보 (나이, 성별) */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
              {age && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="text-foreground font-medium">{age}세</span>
                </span>
              )}
              {gender && (
                <span className="flex items-center gap-1">
                  <span className="text-foreground font-medium">{gender}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              마지막 업데이트:{" "}
              {character.meta?.updated_at
                ? new Date(character.meta.updated_at).toLocaleDateString(
                    "ko-KR",
                  )
                : "알 수 없음"}
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && !isEditMode && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="gap-2 shadow-sm"
                size="sm"
              >
                <Edit className="h-3.5 w-3.5" />
                수정
              </Button>
            )}
            {onGenerateImage && !isEditMode && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log(
                    "[CharacterHeader] Generate Image button clicked",
                  );
                  console.log(
                    "[CharacterHeader] isGeneratingImage:",
                    isGeneratingImage,
                  );
                  console.log(
                    "[CharacterHeader] onGenerateImage exists:",
                    !!onGenerateImage,
                  );
                  onGenerateImage();
                }}
                disabled={isGeneratingImage}
                className="gap-2 shadow-sm"
                size="sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isGeneratingImage ? "생성 중..." : "이미지 생성"}
              </Button>
            )}
          </div>
        </div>

        {/* Character Quick Info - Faction & Relation Count */}
        <div className="mt-4 flex flex-wrap gap-3">
          {faction && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cloud-50 rounded-md border border-input text-sm">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{faction}</span>
            </div>
          )}
          {relationCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cloud-50 rounded-md border border-input text-sm">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {relationCount}개의 관계
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
