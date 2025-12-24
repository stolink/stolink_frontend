import { useMemo } from "react";
import {
  User,
  Heart,
  Sparkles,
  Users,
  BookOpen,
  ChevronRight,
  Edit,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character, CharacterRole } from "@/types";
import { cn } from "@/lib/utils";

// 추가 상세 정보 섹션에서 표시할 최대 항목 수 (UX 최적화)
const MAX_FILTERED_ITEMS = 20;

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const roleLabels: Record<CharacterRole, { label: string; color: string }> = {
  protagonist: {
    label: "Protagonist",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  antagonist: {
    label: "Antagonist",
    color: "bg-rose-50 text-rose-600 border-rose-200",
  },
  supporting: {
    label: "Supporting",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  mentor: {
    label: "Mentor",
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  sidekick: {
    label: "Sidekick",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  other: {
    label: "Other",
    color: "bg-stone-100 text-stone-600 border-stone-200",
  },
};

// 성격 특성 추출
function extractTraits(extras: Record<string, unknown> = {}): string[] {
  const traitKeys = ["성격", "특성", "성향", "traits", "personality"];
  for (const key of Object.keys(extras)) {
    for (const traitKey of traitKeys) {
      if (key.toLowerCase().includes(traitKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === "string")
          return value.split(",").map((s) => s.trim());
      }
    }
  }
  return [];
}

// 관계 추출 - '이름 (관계)' 형식의 문자열 배열을 파싱
function extractRelationships(
  extras: Record<string, unknown> = {},
): Array<{ name: string; relation: string }> {
  const relationKeys = ["관계", "relationships", "인물관계"];
  for (const key of Object.keys(extras)) {
    for (const relationKey of relationKeys) {
      if (key.toLowerCase().includes(relationKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) {
          return value.map((v) => {
            const str = String(v);
            // '이름 (관계)' 형식 파싱
            const match = str.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
              return { name: match[1].trim(), relation: match[2].trim() };
            }
            return { name: str, relation: "" };
          });
        }
      }
    }
  }
  return [];
}

// 등장 챕터 추출
function extractAppearances(extras: Record<string, unknown> = {}): string[] {
  const appearanceKeys = ["등장", "챕터", "chapters", "appearances"];
  for (const key of Object.keys(extras)) {
    for (const appKey of appearanceKeys) {
      if (key.toLowerCase().includes(appKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === "string")
          return value.split(",").map((s) => s.trim());
      }
    }
  }
  return [];
}

export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onEdit,
}: CharacterDetailModalProps) {
  // 추출된 데이터
  const traits = useMemo(
    () => extractTraits(character?.extras as Record<string, unknown>),
    [character?.extras],
  );
  const relationships = useMemo(
    () => extractRelationships(character?.extras as Record<string, unknown>),
    [character?.extras],
  );
  const appearances = useMemo(
    () => extractAppearances(character?.extras as Record<string, unknown>),
    [character?.extras],
  );

  // 캐릭터 설명 추출
  const description = useMemo(() => {
    const extras = character?.extras as Record<string, unknown> | undefined;
    if (!extras) return "";
    const descKeys = ["설명", "소개", "description", "bio", "한줄소개"];
    for (const key of Object.keys(extras)) {
      for (const descKey of descKeys) {
        if (key.toLowerCase().includes(descKey.toLowerCase())) {
          return String(extras[key]);
        }
      }
    }
    return "";
  }, [character?.extras]);

  // 캐릭터 아크 진행률 (임시)
  const arcProgress = useMemo(() => {
    const extras = character?.extras as Record<string, unknown> | undefined;
    if (!extras) return 20;
    const progressValue = extras["진행률"] || extras["progress"];
    if (progressValue && typeof progressValue === "number")
      return progressValue;
    return 20;
  }, [character?.extras]);

  if (!character) return null;

  const roleInfo = roleLabels[character.role || "other"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl">
        <ScrollArea className="flex-1">
          <div className="p-8 sm:p-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8 border-b border-stone-200 pb-8">
              {/* Profile Image */}
              <div className="h-32 w-32 rounded-lg shrink-0 border border-stone-200 shadow-sm ring-4 ring-stone-50 overflow-hidden bg-stone-100">
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover transition-all duration-300 grayscale opacity-90 hover:grayscale-0 hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-stone-100 to-stone-200">
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
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-4xl font-bold text-stone-800 tracking-tight">
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
                    <p className="text-sm text-stone-400 font-medium">
                      마지막 업데이트:{" "}
                      {new Date(character.updatedAt).toLocaleDateString(
                        "ko-KR",
                      )}
                    </p>
                  </div>
                  {onEdit && (
                    <Button
                      variant="outline"
                      onClick={onEdit}
                      className="gap-2 shadow-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <p className="mt-5 text-stone-600 font-serif leading-relaxed text-lg italic opacity-90">
                    "{description}"
                  </p>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1: Key Traits & Character Arc */}
              <div className="space-y-8">
                {/* Key Traits */}
                <div>
                  <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
                    <Heart className="h-4 w-4" /> Key Traits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {traits.length > 0 ? (
                      traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                        >
                          {trait}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-stone-400">
                        성격 특성이 없습니다
                      </span>
                    )}
                  </div>
                </div>

                {/* Character Arc */}
                <div>
                  <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
                    <TrendingUp className="h-4 w-4" /> Character Arc
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-stone-600">
                      <span>진행률</span>
                      <span>{arcProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 border border-stone-200">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${arcProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1 leading-normal">
                      캐릭터 아크 진행 상황을 표시합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 2: Relationships */}
              <div className="space-y-6">
                <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Users className="h-4 w-4" /> Relationships
                </h3>
                <div className="space-y-3">
                  {relationships.length > 0 ? (
                    relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-700 group-hover:text-primary">
                            {rel.name}
                            {rel.relation && (
                              <span className="text-[10px] font-normal text-stone-400 ml-1">
                                ({rel.relation})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-400">
                      관계 정보가 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* Column 3: Appearances */}
              <div className="space-y-6">
                <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
                  <BookOpen className="h-4 w-4" /> Appearances
                </h3>
                <div className="space-y-2">
                  {appearances.length > 0 ? (
                    <>
                      {appearances.slice(0, 3).map((chapter, idx) => (
                        <a
                          key={idx}
                          href="#"
                          className="flex items-center justify-between p-2.5 rounded border border-stone-200 bg-stone-50/50 hover:bg-white hover:shadow-sm hover:border-primary/30 transition-all group"
                        >
                          <span className="text-xs font-bold text-stone-700">
                            {chapter}
                          </span>
                          <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-primary" />
                        </a>
                      ))}
                      {appearances.length > 3 && (
                        <div className="flex items-center justify-center pt-2">
                          <button className="text-xs font-bold text-primary hover:underline">
                            View All Mentions ({appearances.length})
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-stone-400">
                      등장 정보가 없습니다
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Extras (if any) */}
            {character.extras && Object.keys(character.extras).length > 0 && (
              <div className="mt-8 pt-8 border-t border-stone-200">
                <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Additional Details
                </h3>
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(character.extras)
                      .filter(
                        ([key]) =>
                          ![
                            "성격",
                            "관계",
                            "등장",
                            "traits",
                            "relationships",
                            "chapters",
                            "설명",
                            "description",
                          ].some((k) =>
                            key.toLowerCase().includes(k.toLowerCase()),
                          ),
                      )
                      .slice(0, MAX_FILTERED_ITEMS)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="p-3 bg-stone-50 rounded-lg border border-stone-100"
                        >
                          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">
                            {key}
                          </p>
                          <p className="text-sm font-medium text-stone-700 truncate">
                            {Array.isArray(value)
                              ? value.join(", ")
                              : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
