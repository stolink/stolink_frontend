import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RelationType } from "@/types";

interface MoodBackgroundProps {
  type: RelationType | string;
  className?: string;
}

// Mood configurations: [Gradient From, Gradient To, Ambient Color]
const MOOD_CONFIGS: Record<string, [string, string, string]> = {
  // Positive
  ALLY: ["from-teal-50", "to-emerald-100", "bg-teal-200"],
  FRIEND: ["from-green-50", "to-teal-100", "bg-green-200"],
  ROMANTIC: ["from-pink-50", "to-rose-100", "bg-pink-200"],
  FAMILY: ["from-indigo-50", "to-purple-100", "bg-purple-200"],
  MENTOR: ["from-amber-50", "to-orange-100", "bg-amber-200"],

  // Negative
  RIVAL: ["from-orange-50", "to-red-100", "bg-orange-200"],
  ENEMY: ["from-red-50", "to-rose-100", "bg-red-200"],

  // Neutral/Complex
  NEUTRAL: ["from-slate-50", "to-gray-100", "bg-gray-200"],
  COMPLEX: ["from-violet-50", "to-fuchsia-100", "bg-violet-200"],
  MASTER_SERVANT: ["from-slate-100", "to-zinc-200", "bg-slate-300"],
  COWORKER: ["from-blue-50", "to-sky-100", "bg-sky-200"],

  // Default fallback
  DEFAULT: ["from-cloud-50", "to-white", "bg-cloud-100"],
};

export function MoodBackground({ type, className }: MoodBackgroundProps) {
  // Normalize type key
  const typeKey = typeof type === "string" ? type.toUpperCase() : "NEUTRAL";
  const [gradientFrom, gradientTo, ambientColor] =
    MOOD_CONFIGS[typeKey] || MOOD_CONFIGS.DEFAULT;

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
          "absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-40",
          ambientColor,
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className={cn(
          "absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-30",
          ambientColor,
        )}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* 3. Noise Texture Overlay (Premium Feel) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. Glass Overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
    </div>
  );
}
