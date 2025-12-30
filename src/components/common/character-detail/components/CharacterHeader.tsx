import { Edit, Users, Shield, MapPin, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { roleLabels } from "../constants";

// 기본 정보 키 (헤더에 표시할 항목)
const BASIC_INFO_KEYS = ["나이", "성별", "출생지", "직업"];

interface CharacterHeaderProps {
  character: Character;
  onEdit?: () => void;
}

export function CharacterHeader({ character, onEdit }: CharacterHeaderProps) {
  const roleInfo = roleLabels[character.role || "other"];
  const extras = character.extras as Record<string, unknown> | undefined;

  // 기본 정보 추출
  const basicInfo = BASIC_INFO_KEYS.map((key) => ({
    key,
    value: extras?.[key] as string | undefined,
  })).filter((item) => item.value);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start mb-8 border-b border-border pb-8">
      {/* Profile Image */}
      <div className="h-28 w-28 rounded-xl shrink-0 border border-input shadow-md ring-4 ring-cloud-50 overflow-hidden bg-muted">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-full object-cover transition-all duration-300 grayscale opacity-90 hover:grayscale-0 hover:opacity-100"
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
      </div>

      {/* Character Info */}
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {character.name}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                  roleInfo.color,
                )}
              >
                {roleInfo.label}
              </span>
            </div>

            {/* 기본 정보 (나이, 성별, 출생지, 직업) */}
            {basicInfo.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                {basicInfo.map(({ key, value }) => (
                  <span key={key} className="flex items-center gap-1">
                    {key === "나이" && <User className="h-3 w-3" />}
                    {key === "출생지" && <MapPin className="h-3 w-3" />}
                    {key === "직업" && <Briefcase className="h-3 w-3" />}
                    <span className="text-foreground font-medium">{value}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              마지막 업데이트:{" "}
              {new Date(character.updatedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
          {onEdit && (
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
        </div>

        {/* Character Quick Info - Faction & Relation Count */}
        <div className="mt-4 flex flex-wrap gap-3">
          {character.faction && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cloud-50 rounded-md border border-input text-sm">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {character.faction}
              </span>
            </div>
          )}
          {typeof character.relationCount === "number" &&
            character.relationCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cloud-50 rounded-md border border-input text-sm">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {character.relationCount}개의 관계
                </span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
