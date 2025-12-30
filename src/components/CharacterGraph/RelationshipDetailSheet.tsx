import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Clock,
  ArrowLeftRight,
  Heart,
  Skull,
  User,
  Sword,
} from "lucide-react";
import type {
  DetailedRelationship,
  BackendRelationshipType,
} from "@/types/character";
import { cn } from "@/lib/utils";

interface RelationshipDetailSheetProps {
  relationship: DetailedRelationship | null;
  isOpen: boolean;
  onClose: () => void;
  sourceName?: string;
  targetName?: string;
}

// Palette from CLAUDE.md (Relationship Colors)
const RELATION_COLORS: Record<BackendRelationshipType, string> = {
  friendly: "bg-[#7A8C6F] border-[#7A8C6F]", // Friendly: #7A8C6F
  hostile: "bg-[#9C4A3F] border-[#9C4A3F]", // Hostile: #9C4A3F
  romantic: "bg-[#B38B82] border-[#B38B82]", // Romance: #B38B82
  enemy: "bg-[#9C4A3F] border-[#9C4A3F]",
  lover: "bg-[#B38B82] border-[#B38B82]",
  friend: "bg-[#7A8C6F] border-[#7A8C6F]",
  family: "bg-[#4F5861] border-[#4F5861]", // Family: #4F5861
  neutral: "bg-[#8D8B88] border-[#8D8B88]", // Neutral: #8D8B88
  conflict: "bg-[#9C4A3F] border-[#9C4A3F]",
  romance: "bg-[#B38B82] border-[#B38B82]",
  friendship: "bg-[#7A8C6F] border-[#7A8C6F]",
};

const RELATION_ICONS: Record<BackendRelationshipType, React.ReactNode> = {
  friendly: <User className="w-4 h-4" />,
  hostile: <Skull className="w-4 h-4" />,
  romantic: <Heart className="w-4 h-4" />,
  enemy: <Skull className="w-4 h-4" />,
  lover: <Heart className="w-4 h-4" />,
  friend: <User className="w-4 h-4" />,
  family: <User className="w-4 h-4" />,
  neutral: <Activity className="w-4 h-4" />,
  conflict: <Sword className="w-3 h-3" />,
  romance: <Heart className="w-4 h-4" />,
  friendship: <User className="w-4 h-4" />,
};

const RELATION_LABELS: Record<BackendRelationshipType, string> = {
  friendly: "우호적",
  hostile: "적대적",
  romantic: "로맨틱",
  enemy: "적대",
  lover: "연인",
  friend: "친구",
  family: "가족",
  neutral: "중립",
  conflict: "갈등",
  romance: "로맨스",
  friendship: "우정",
};

export function RelationshipDetailSheet({
  relationship,
  isOpen,
  onClose,
  sourceName,
  targetName,
}: RelationshipDetailSheetProps) {
  if (!relationship) return null;

  const {
    type,
    strength,
    description,
    label: relationLabel,
    evolved_from,
    bidirectional,
    since,
    history,
  } = relationship;

  // Use relationship.relation_type if available (from JSON), otherwise fallback to type
  const displayType = relationship.relation_type || type;
  const colorClass = RELATION_COLORS[displayType] || "bg-gray-500";
  const label = RELATION_LABELS[displayType] || displayType;
  const icon = RELATION_ICONS[displayType] || <Activity className="w-4 h-4" />;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-stone-200">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {/* Header: Names & Badge */}
            <SheetHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={cn("text-white gap-1.5 px-3 py-1", colorClass)}
                >
                  {icon}
                  {label}
                </Badge>
                {bidirectional && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-stone-100 text-stone-600 hover:bg-stone-200"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    상호 관계
                  </Badge>
                )}
              </div>

              <SheetTitle className="text-2xl font-serif font-bold text-stone-900 leading-tight">
                <span className="block text-stone-500 text-base font-sans font-medium mb-1">
                  Source
                </span>
                {sourceName || "Unknown"}
                <span className="block my-2 text-stone-300 text-sm border-b border-dashed" />
                <span className="block text-stone-500 text-base font-sans font-medium mb-1">
                  Target
                </span>
                {targetName || "Unknown"}
              </SheetTitle>
            </SheetHeader>

            <Separator />

            {/* Creating a prominant banner for 'Since' info as requested */}
            {since && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center gap-3 shadow-sm">
                <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                    Relationship Started
                  </p>
                  <p className="text-stone-800 font-medium">{since}</p>
                </div>
              </div>
            )}

            {/* Main Description */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                관계 설명
              </h4>
              {relationLabel || description ? (
                <p className="text-stone-800 leading-relaxed whitespace-pre-wrap font-sans text-base">
                  {relationLabel || description}
                </p>
              ) : (
                <p className="text-stone-400 italic text-sm">
                  관계에 대한 설명이 없습니다.
                </p>
              )}
            </div>

            {/* Strength Gauge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                  관계 강도
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Low</span>
                  <span className="text-lg font-bold text-mocha-500">
                    {strength} / 10
                  </span>
                  <span className="text-xs text-stone-400">High</span>
                </div>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    colorClass,
                  )}
                  style={{ width: `${(strength / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Relationship History Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                관계 변천사
              </h4>
              {history && history.length > 0 ? (
                <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-200">
                  {history.map((event, idx) => {
                    const eventColor =
                      RELATION_COLORS[event.type] ||
                      "bg-stone-400 border-stone-400";

                    return (
                      <div key={event.eventId || idx} className="relative">
                        {/* Timeline Dot */}
                        <div
                          className={cn(
                            "absolute -left-[13px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-stone-200",
                            eventColor.split(" ")[0], // Extract bg class
                          )}
                        />

                        <div className="bg-white p-3 rounded-lg border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {event.chapter || "Legacy Info"}
                            </span>
                            {event.date && (
                              <span className="text-[10px] text-stone-400">
                                {event.date}
                              </span>
                            )}
                          </div>
                          <h5 className="font-semibold text-stone-800 text-sm mb-1">
                            {event.title}
                          </h5>
                          {event.reason && (
                            <p className="text-xs text-stone-600 leading-relaxed">
                              {event.reason}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5"
                              style={{ borderColor: "currentColor" }}
                            >
                              {RELATION_LABELS[event.type] || event.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-stone-400 italic">
                  관계 변천사가 아직 기록되지 않았습니다.
                </p>
              )}
            </div>

            {/* Legacy Evolution History (Fallback) */}
            {evolved_from && (
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-2">
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">이전 관계</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-stone-500 bg-white">
                    {RELATION_LABELS[evolved_from] || evolved_from}
                  </Badge>
                  <span className="text-stone-400">→</span>
                  <Badge
                    className={cn("text-white hover:opacity-90", colorClass)}
                  >
                    {label}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
