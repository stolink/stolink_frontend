import { motion } from "framer-motion";
import { Users, Heart, Swords, Scale, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/utils/imageUtils";
import ReactMarkdown from "react-markdown";

/**
 * Relationship data structure from SSE cards
 */
interface RelationshipCardData {
  sourceCharacter: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  targetCharacter: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  types: string[];
  strength: number;
  description?: string;
  bidirectional?: boolean;
}

interface ChatRelationshipCardProps {
  data: RelationshipCardData;
  onClick?: () => void;
}

/**
 * Relationship type to icon/color mapping
 */
const RELATIONSHIP_STYLE: Record<
  string,
  { icon: typeof Heart; color: string; bgColor: string }
> = {
  friendship: {
    icon: Heart,
    color: "text-sage-600",
    bgColor: "bg-sage-50",
  },
  romance: {
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  rivalry: {
    icon: Swords,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  enemy: {
    icon: Swords,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  mentor: {
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  family: {
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  ally: {
    icon: Scale,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
};

const getRelationshipStyle = (type: string) => {
  const normalizedType = type.toLowerCase().trim();
  return (
    RELATIONSHIP_STYLE[normalizedType] || {
      icon: Users,
      color: "text-mocha-600",
      bgColor: "bg-mocha-50",
    }
  );
};

/**
 * Strength indicator bar component
 */
function StrengthBar({ strength }: { strength: number }) {
  const percentage = Math.min(Math.max(strength, 0), 10) * 10;
  const getColor = () => {
    if (percentage >= 70) return "bg-sage-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-mocha-400";
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium text-mocha-400">강도</span>
      <div className="flex-1 h-1.5 bg-mocha-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>
      <span className="text-[10px] font-bold text-mocha-600">
        {strength}/10
      </span>
    </div>
  );
}

/**
 * Character avatar component
 */
function CharacterAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative">
        {imageUrl ? (
          <img
            src={resolveImageUrl(imageUrl)}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mocha-100 to-mocha-200 flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-lg font-bold text-mocha-600">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-espresso-800 text-center max-w-[80px] truncate">
        {name}
      </span>
    </div>
  );
}

/**
 * Chat Relationship Card - Compact card for AI chat responses
 */
export function ChatRelationshipCard({
  data,
  onClick,
}: ChatRelationshipCardProps) {
  if (!data || !data.sourceCharacter || !data.targetCharacter) {
    return null;
  }

  const {
    sourceCharacter,
    targetCharacter,
    types,
    strength = 5,
    description,
    bidirectional,
  } = data;

  const relationshipTypes = Array.isArray(types) ? types : [];
  const primaryType = (relationshipTypes[0] || "unknown").toString();
  const style = getRelationshipStyle(primaryType);
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-mocha-100/60 bg-white shadow-paper",
        "hover:shadow-md transition-shadow duration-300 cursor-pointer",
      )}
      onClick={onClick}
    >
      {/* Header gradient bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          style.bgColor.replace("bg-", "bg-gradient-to-r from-") +
            " to-white/0",
        )}
      />

      <div className="p-4">
        {/* Character portraits with connection */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <CharacterAvatar
            name={sourceCharacter.name}
            imageUrl={sourceCharacter.imageUrl}
          />

          {/* Connection indicator */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "p-2 rounded-full",
                style.bgColor,
                "ring-2 ring-white shadow-sm",
              )}
            >
              <Icon className={cn("w-4 h-4", style.color)} />
            </div>
            <div className="flex items-center gap-0.5 text-mocha-300">
              {bidirectional ? (
                <>
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  <ArrowRight className="w-3 h-3" />
                </>
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </div>
          </div>

          <CharacterAvatar
            name={targetCharacter.name}
            imageUrl={targetCharacter.imageUrl}
          />
        </div>

        {/* Relationship types */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {relationshipTypes.map((type) => {
            const typeStyle = getRelationshipStyle(type);
            return (
              <span
                key={type}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                  typeStyle.bgColor,
                  typeStyle.color,
                )}
              >
                {type}
              </span>
            );
          })}
        </div>

        {/* Strength indicator */}
        <StrengthBar strength={strength} />

        {/* Description */}
        {description && (
          <div className="mt-3 text-xs text-mocha-600 leading-relaxed text-center line-clamp-2 prose prose-sm prose-mocha max-w-full">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
