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
} from "lucide-react";
import type {
  DetailedRelationship,
  BackendRelationshipType,
} from "@/types/character";
import { cn } from "@/lib/utils";
import { getRelationshipColor } from "./utils";

interface RelationshipDetailSheetProps {
  relationship: DetailedRelationship | null;
  isOpen: boolean;
  onClose: () => void;
  sourceName?: string;
  targetName?: string;
}

// Local constants removed in favor of getRelationshipColor helper

const RELATION_ICONS: Record<BackendRelationshipType, React.ReactNode> = {
  friendly: <User className="w-4 h-4" />,
  hostile: <Skull className="w-4 h-4" />,
  romantic: <Heart className="w-4 h-4" />,
};

const RELATION_LABELS: Record<BackendRelationshipType, string> = {
  friendly: "우호적",
  hostile: "적대적",
  romantic: "로맨틱",
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
    evolvedFrom,
    bidirectional,
    since,
    history,
  } = relationship;

  // Use relationship.relationType if available, otherwise fallback to type
  const displayType = (relationship.relationType ||
    type) as BackendRelationshipType;
  const color = getRelationshipColor(displayType, strength);
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
                  className={cn("text-white gap-1.5 px-3 py-1")}
                  style={{ backgroundColor: color, borderColor: color }}
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
                  className={cn("h-full transition-all duration-500")}
                  style={{
                    width: `${(strength / 10) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>

            {/* Relationship History Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                관계 변천사
              </h4>
              {history && Array.isArray(history) && history.length > 0 ? (
                <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-200">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {history.map((event: any, idx: number) => {
                    const eventColorHex = getRelationshipColor(
                      event.type as BackendRelationshipType,
                      5,
                    ); // Default strength

                    return (
                      <div key={event.eventId || idx} className="relative">
                        {/* Timeline Dot */}
                        <div
                          className={cn(
                            "absolute -left-[13px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-stone-200",
                          )}
                          style={{ backgroundColor: eventColorHex }}
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
                              {RELATION_LABELS[
                                event.type as BackendRelationshipType
                              ] || event.type}
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
            {evolvedFrom && (
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-2">
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">이전 관계</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-stone-500 bg-white">
                    {RELATION_LABELS[evolvedFrom as BackendRelationshipType] ||
                      evolvedFrom}
                  </Badge>
                  <span className="text-stone-400">→</span>
                  <Badge
                    className={cn("text-white hover:opacity-90")}
                    style={{ backgroundColor: color }}
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
