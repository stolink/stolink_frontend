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
import type { Character } from "@/types";
import { cn } from "@/lib/utils";
import { useCharacterData } from "./hooks/useCharacterData";
import {
  getRoleInfo,
  EXCLUDED_EXTRA_KEYS,
  MAX_FILTERED_ITEMS,
} from "./character/characterConstants";

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

/**
 * 캐릭터 상세 모달
 * 리팩토링: useCharacterData 훅으로 데이터 추출, 서브 컴포넌트로 UI 분리
 */
export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onEdit,
}: CharacterDetailModalProps) {
  const { traits, relationships, appearances, description, arcProgress } =
    useCharacterData(character);

  if (!character) return null;

  const roleInfo = getRoleInfo(character.role);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-stone-200 shadow-2xl">
        <ScrollArea className="flex-1">
          <div className="p-8 sm:p-10">
            {/* Header Section */}
            <CharacterHeader
              character={character}
              roleInfo={roleInfo}
              description={description}
              onEdit={onEdit}
            />

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TraitsAndArcSection traits={traits} arcProgress={arcProgress} />
              <RelationshipsSection relationships={relationships} />
              <AppearancesSection appearances={appearances} />
            </div>

            {/* Additional Extras */}
            <ExtrasSection extras={character.extras} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- 서브 컴포넌트들 ---

interface CharacterHeaderProps {
  character: Character;
  roleInfo: { label: string; color: string };
  description: string;
  onEdit?: () => void;
}

function CharacterHeader({
  character,
  roleInfo,
  description,
  onEdit,
}: CharacterHeaderProps) {
  return (
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
            {getCharacterEmoji(character.role)}
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
                  roleInfo.color
                )}
              >
                {roleInfo.label}
              </span>
            </div>
            <p className="text-sm text-stone-400 font-medium">
              마지막 업데이트:{" "}
              {new Date(character.updatedAt).toLocaleDateString("ko-KR")}
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

        {description && (
          <p className="mt-5 text-stone-600 font-serif leading-relaxed text-lg italic opacity-90">
            "{description}"
          </p>
        )}
      </div>
    </div>
  );
}

function getCharacterEmoji(role?: string): string {
  switch (role) {
    case "protagonist":
      return "🦸";
    case "antagonist":
      return "🦹";
    case "mentor":
      return "🧙";
    default:
      return "👤";
  }
}

interface TraitsAndArcSectionProps {
  traits: string[];
  arcProgress: number;
}

function TraitsAndArcSection({
  traits,
  arcProgress,
}: TraitsAndArcSectionProps) {
  return (
    <div className="space-y-8">
      {/* Key Traits */}
      <div>
        <SectionHeader icon={Heart} title="Key Traits" />
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
            <span className="text-sm text-stone-400">성격 특성이 없습니다</span>
          )}
        </div>
      </div>

      {/* Character Arc */}
      <div>
        <SectionHeader icon={TrendingUp} title="Character Arc" />
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
  );
}

interface RelationshipsSectionProps {
  relationships: Array<{ name: string; relation: string }>;
}

function RelationshipsSection({ relationships }: RelationshipsSectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Users} title="Relationships" />
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
          <p className="text-sm text-stone-400">관계 정보가 없습니다</p>
        )}
      </div>
    </div>
  );
}

interface AppearancesSectionProps {
  appearances: string[];
}

function AppearancesSection({ appearances }: AppearancesSectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={BookOpen} title="Appearances" />
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
          <p className="text-sm text-stone-400">등장 정보가 없습니다</p>
        )}
      </div>
    </div>
  );
}

interface ExtrasSectionProps {
  extras?: Record<string, unknown>;
}

function ExtrasSection({ extras }: ExtrasSectionProps) {
  if (!extras || Object.keys(extras).length === 0) return null;

  const filteredExtras = Object.entries(extras)
    .filter(
      ([key]) =>
        !EXCLUDED_EXTRA_KEYS.some((k) =>
          key.toLowerCase().includes(k.toLowerCase())
        )
    )
    .slice(0, MAX_FILTERED_ITEMS);

  if (filteredExtras.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-stone-200">
      <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Additional Details
      </h3>
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredExtras.map(([key, value]) => (
            <div
              key={key}
              className="p-3 bg-stone-50 rounded-lg border border-stone-100"
            >
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">
                {key}
              </p>
              <p className="text-sm font-medium text-stone-700 truncate">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 공통 섹션 헤더
interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <h3 className="font-bold text-stone-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-stone-200 pb-2">
      <Icon className="h-4 w-4" /> {title}
    </h3>
  );
}
