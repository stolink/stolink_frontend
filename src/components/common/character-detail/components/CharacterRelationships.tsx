import { useMemo, useState } from "react";
import {
  Users,
  User,
  Heart,
  Swords,
  Handshake,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RelationshipRadar } from "./RelationshipRadar";
import { Badge, Button } from "@stolink/ui";
import {
  RELATION_BADGE_COLORS,
  type UIRelationType,
  RELATION_COLORS_HEX,
  RELATION_LABELS,
  toUIRelationType,
} from "@/components/CharacterGraph/constants";
import { motion, AnimatePresence } from "framer-motion";

interface RelationshipUI {
  name: string;
  relation: string;
  type: string;
  // Detailed Metrics
  emotionalBond?: number;
  functionalTrust?: number;
  valueAlignment?: number;
  interdependence?: number;
  latentTension?: number;
  publicStance?: string;
  privateFeeling?: string;
  imageUrl?: string;
  description?: string;
}

interface CharacterRelationshipsProps {
  relationships: RelationshipUI[];
}

// Section Config
const SECTIONS = [
  {
    id: "romantic",
    title: "Hearts",
    displayTitle: "연인 & 사랑",
    icon: Heart,
    color: "text-pink-600",
    gradient: "from-pink-100/30 via-white/90 to-white/60",
    border: "border-pink-200/50",
    matcher: (type: string) =>
      ["romantic", "love", "spouse", "lover", "couple"].some((k) =>
        type.toLowerCase().includes(k),
      ),
  },
  {
    id: "family",
    title: "Bloodline",
    displayTitle: "가족 & 혈연",
    icon: Users,
    color: "text-teal-700",
    gradient: "from-teal-100/30 via-white/90 to-white/60",
    border: "border-teal-200/50",
    matcher: (type: string) =>
      ["family", "parent", "child", "sibling", "kin"].some((k) =>
        type.toLowerCase().includes(k),
      ),
  },
  {
    id: "friendly",
    title: "Alliance",
    displayTitle: "동료 & 조력",
    icon: Handshake,
    color: "text-emerald-700",
    gradient: "from-emerald-100/30 via-white/90 to-white/60",
    border: "border-emerald-200/50",
    matcher: (type: string) =>
      [
        "ally",
        "friendly",
        "mentor",
        "protects",
        "trust",
        "friend",
        "coworker",
      ].some((k) => type.toLowerCase().includes(k)),
  },
  {
    id: "hostile",
    title: "Conflict",
    displayTitle: "적대 & 경쟁",
    icon: Swords,
    color: "text-rose-700",
    gradient: "from-rose-100/30 via-white/90 to-white/60",
    border: "border-rose-200/50",
    matcher: (type: string) =>
      ["enemy", "hostile", "rival", "betrayed", "conflict", "antagonist"].some(
        (k) => type.toLowerCase().includes(k),
      ),
  },
  {
    id: "others",
    title: "Others",
    displayTitle: "기타 관계",
    icon: Hash,
    color: "text-mocha-500",
    gradient: "from-mocha-100/20 via-white/90 to-white/60",
    border: "border-mocha-200/40",
    matcher: () => true,
  },
];

/**
 * Deep Analysis Style Card
 */
function RelationshipCard({
  rel,
  gradient,
  borderColor,
}: {
  rel: RelationshipUI;
  gradient: string;
  borderColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Show if any metric exists
  const hasMetrics = rel.emotionalBond !== undefined;

  const metricColor =
    RELATION_COLORS_HEX[rel.type as UIRelationType] || "#A47764";

  return (
    <motion.div
      layout
      className={cn(
        "group relative overflow-hidden",
        "backdrop-blur-sm rounded-3xl",
        "border shadow-sm hover:shadow-md hover:border-mocha-300/30",
        "bg-gradient-to-br",
        gradient,
        borderColor,
        "transition-all duration-300",
      )}
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Header: Avatar & Main Info */}
        <div className="flex gap-4 items-start relative z-10">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner ring-1 ring-white/50 bg-white/40">
              {rel.imageUrl ? (
                <img
                  src={rel.imageUrl}
                  alt={rel.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-7 h-7 opacity-50" />
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white shadow-sm"
              style={{ backgroundColor: metricColor }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-lg font-bold text-gray-800 tracking-tight truncate pr-2">
                {rel.name}
              </h4>
              {(() => {
                const uiType = toUIRelationType(rel.type);
                return (
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] px-2 h-5 font-bold tracking-wider bg-white/60",
                      RELATION_BADGE_COLORS[uiType] ||
                        "bg-slate-100 text-slate-600 border-slate-200",
                    )}
                  >
                    {RELATION_LABELS[uiType] || rel.relation}
                  </Badge>
                );
              })()}
            </div>

            {/* Stance Label */}
            <div className="text-xs font-medium text-gray-500 tracking-wide truncate">
              <span>
                {rel.publicStance ? `공식: ${rel.publicStance}` : rel.relation}
              </span>
            </div>
          </div>
        </div>

        {/* Narrative / Description */}
        <div className="relative bg-white/40 rounded-xl p-3 border border-white/50 text-sm text-gray-700 leading-relaxed font-serif shadow-sm">
          {rel.description || rel.privateFeeling ? (
            <p>"{rel.description || rel.privateFeeling}"</p>
          ) : (
            <p className="text-gray-400 italic">상세 설명이 없습니다.</p>
          )}
        </div>

        {/* Metrics Toggle */}
        {hasMetrics && (
          <div className="mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs text-gray-400 hover:text-mocha-600 hover:bg-white/40 h-8 tracking-wider font-semibold"
            >
              {isExpanded ? (
                <span className="flex items-center gap-1">
                  분석 접기 <ChevronUp className="w-3 h-3" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  심층 분석 보기 <ChevronDown className="w-3 h-3" />
                </span>
              )}
            </Button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 grid grid-cols-2 gap-4 border-t border-gray-100/30 mt-2">
                    {/* Radar */}
                    <div className="flex justify-center items-center bg-white/30 rounded-xl p-2 border border-white/40 shadow-inner">
                      <RelationshipRadar
                        data={{
                          emotionalBond: rel.emotionalBond || 0,
                          functionalTrust: rel.functionalTrust || 0,
                          valueAlignment: rel.valueAlignment || 0,
                          interdependence: rel.interdependence || 0,
                          latentTension: rel.latentTension || 0,
                        }}
                        className="h-[120px] w-full"
                      />
                    </div>

                    {/* Bars - Show ALL 5 metrics */}
                    <div className="flex flex-col justify-center space-y-2 px-1">
                      <MetricBar
                        label="정서적 유대"
                        value={rel.emotionalBond}
                        color={metricColor}
                      />
                      <MetricBar
                        label="신뢰도"
                        value={rel.functionalTrust}
                        color={metricColor}
                      />
                      <MetricBar
                        label="가치관 공유"
                        value={rel.valueAlignment}
                        color={metricColor}
                      />
                      <MetricBar
                        label="상호 의존"
                        value={rel.interdependence}
                        color={metricColor}
                      />
                      <MetricBar
                        label="잠재적 갈등"
                        value={rel.latentTension}
                        color="#E11D48"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value?: number;
  color: string;
}) {
  // If undefined, start at 0 but still render to keep UI consistent (as per user request "Show all")
  // Or if truly undefined, we might skip. But usually they come together.
  // Use a fallback of 0 if value is missing but we want to show it?
  // User said "Show all 5". So we will render even if 0/undefined.
  const val = value || 0;

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-gray-500 font-bold tracking-wider">
        <span>{label}</span>
        <span>{val}/10</span>
      </div>
      <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden border border-white/20">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${val * 10}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function CharacterRelationships({
  relationships,
}: CharacterRelationshipsProps) {
  // Grouping Logic
  const grouped = useMemo(() => {
    const groups: Record<string, RelationshipUI[]> = {
      romantic: [],
      family: [],
      friendly: [],
      hostile: [],
      others: [],
    };
    relationships.forEach((rel) => {
      const type = rel.type.toLowerCase();
      if (SECTIONS[0].matcher(type)) groups.romantic.push(rel);
      else if (SECTIONS[1].matcher(type)) groups.family.push(rel);
      else if (SECTIONS[2].matcher(type)) groups.friendly.push(rel);
      else if (SECTIONS[3].matcher(type)) groups.hostile.push(rel);
      else groups.others.push(rel);
    });
    return groups;
  }, [relationships]);

  const isEmpty = relationships.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
        <Users className="w-12 h-12 text-mocha-300 mb-2" />
        <p className="text-mocha-900 font-medium">No Relationships Found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Intro Header - Hidden/Minimal as requested often */}

      {SECTIONS.map((section) => {
        const items = grouped[section.id as keyof typeof grouped];
        if (items.length === 0) return null;

        return (
          <section key={section.id} className="space-y-6">
            {/* Section Divider Header (Deep Analysis Style) */}
            <div className="flex items-center gap-4 px-1">
              <span className="h-[2px] flex-1 bg-mocha-500/10" />
              <h3 className="text-[11px] font-black text-mocha-400 uppercase tracking-[0.2em] flex items-center gap-2 py-1 px-4 bg-mocha-50/50 rounded-full border border-mocha-100/30">
                <section.icon className={cn("w-3.5 h-3.5", section.color)} />
                {section.displayTitle}
              </h3>
              <span className="h-[2px] flex-1 bg-mocha-500/10" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((rel, idx) => (
                <RelationshipCard
                  key={`${rel.name}-${idx}`}
                  rel={rel}
                  gradient={section.gradient}
                  borderColor={section.border}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
