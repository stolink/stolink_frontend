import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RelationType } from "@/types";

interface MoodBackgroundProps {
  type: RelationType | string | string[];
  className?: string;
}

// Mood configurations: [Gradient From, Gradient To, Ambient Color]
const MOOD_CONFIGS: Record<string, [string, string, string]> = {
  // Positive
  ALLY: ["from-teal-50", "to-emerald-100", "bg-teal-200"],
  ALLIANCE: ["from-teal-50", "to-emerald-100", "bg-teal-200"],
  FRIEND: ["from-green-50", "to-teal-100", "bg-green-200"],
  FRIENDLY: ["from-green-50", "to-teal-100", "bg-green-200"],
  ROMANTIC: ["from-pink-50", "to-rose-100", "bg-pink-200"],
  FAMILY: ["from-indigo-50", "to-purple-100", "bg-purple-200"],
  MENTOR: ["from-violet-50", "to-fuchsia-100", "bg-violet-200"],

  // Negative
  RIVAL: ["from-orange-50", "to-red-100", "bg-orange-200"],
  ENEMY: ["from-red-50", "to-rose-100", "bg-red-200"],
  HOSTILE: ["from-red-50", "to-rose-100", "bg-red-200"],

  // Neutral/Complex
  NEUTRAL: ["from-slate-50", "to-gray-100", "bg-gray-200"],
  COMPLEX: ["from-violet-50", "to-fuchsia-100", "bg-violet-200"],
  MASTER_SERVANT: ["from-slate-100", "to-zinc-200", "bg-slate-300"],
  COWORKER: ["from-blue-50", "to-sky-100", "bg-sky-200"],

  // Default fallback
  DEFAULT: ["from-cloud-50", "to-white", "bg-cloud-100"],
};

export function MoodBackground({ type, className }: MoodBackgroundProps) {
  // Normalize to types array and clean strings
  const rawTypes = Array.isArray(type) ? type : [type];
  const types = rawTypes.map((t) => (t || "").toString().toUpperCase().trim());

  // Helper to find best config match
  const getConfig = (typeStr: string) => {
    if (!typeStr) return MOOD_CONFIGS.DEFAULT;
    if (MOOD_CONFIGS[typeStr]) return MOOD_CONFIGS[typeStr];

    // Partial matching
    for (const key in MOOD_CONFIGS) {
      if (typeStr.includes(key) || key.includes(typeStr)) {
        return MOOD_CONFIGS[key];
      }
    }
    return MOOD_CONFIGS.DEFAULT;
  };

  // Determine key for global gradient
  // Mix gradients: From Color A -> To Color B
  const configA = getConfig(types[0]);
  const configB = types[1] ? getConfig(types[1]) : configA;

  const gradientFrom = configA[0]; // e.g. "from-teal-50"
  const gradientTo = configB[1]; // e.g. "to-rose-100" or same if single type

  // Get ambient colors for individual orbs
  const ambientA = getConfig(types[0])[2];
  const ambientB = types[1] ? getConfig(types[1])[2] : ambientA;

  return (
    <div className={cn("absolute inset-0 overflow-hidden -z-10", className)}>
      {/* 1. Base Gradient Layer */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-colors duration-1000",
          gradientFrom,
          gradientTo,
        )}
      />

      {/* 2. Animated Ambient Orbs (Framer Motion) */}
      <motion.div
        className={cn(
          "absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[80px] opacity-60 transition-colors duration-1000",
          ambientA,
        )}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.1, 0.95, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className={cn(
          "absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[90px] opacity-50 transition-colors duration-1000",
          ambientB,
        )}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -10, 0],
          scale: [1.1, 0.9, 1.15, 1.1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* 4. Glass Overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
    </div>
  );
}
