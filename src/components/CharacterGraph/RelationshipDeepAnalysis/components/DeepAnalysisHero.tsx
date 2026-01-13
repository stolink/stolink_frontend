import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Heart,
  Sword,
  Users,
  HelpCircle,
  Thermometer,
  Info,
  Star,
} from "lucide-react";
import type {
  AnalysisCharacterInfo,
  AsymmetricStrength,
  StrengthFactor,
} from "@/types/relationshipAnalysis";
import { EmotionCollisionEffect } from "./EmotionCollisionEffect";
import { AsymmetricStrengthGraph } from "./AsymmetricStrengthGraph";

interface DeepAnalysisHeroProps {
  sourceCharacter: AnalysisCharacterInfo;
  targetCharacter: AnalysisCharacterInfo;
  asymmetricStrength: AsymmetricStrength;
  onClose: () => void;
  relationshipTypes: string[]; // Added
  description?: string; // Added
  since?: string;
  className?: string;
}

/**
 * 중고등학생 수준의 자연스러운 용어 변환기
 */
const simplifyTerm = (term: string) => {
  const t = term.toLowerCase();
  if (
    t.includes("subordinate") ||
    t.includes("master_servant") ||
    t.includes("군신")
  )
    return "충성과 헌신의 군신 관계";
  if (t.includes("trust") || t.includes("신뢰")) return "흔들림 없는 깊은 신뢰";
  if (t.includes("mentor") || t.includes("스승")) return "나를 이끌어주는 멘토";
  if (t.includes("admiration") || t.includes("흠모"))
    return "존경과 흠모의 마음";
  if (t.includes("friend") || t.includes("친구"))
    return "서로 믿고 의지하는 친구";
  if (t.includes("romantic") || t.includes("lover"))
    return "설렘 가득한 로맨스";
  if (t.includes("hostile") || t.includes("enemy") || t.includes("rival"))
    return "서로의 성장을 자극하는 라이벌";
  if (t.includes("coworker") || t.includes("ally"))
    return "목표를 함께하는 든든한 동료";
  if (t.includes("family") || t.includes("집안"))
    return "피보다 진한 유대, 가족";
  if (t.includes("complex")) return "많은 감정이 섞인 복잡한 마음";
  return term;
};

const getRelationColor = (type: string | string[]) => {
  if (!type) return "#A47764";

  // 만약 5개 이상의 복합 관계라면 보라색(Complex) 반환 -> REMOVED to allow primary color to show
  // if (Array.isArray(type) && type.length >= 5) return "#7C3AED";

  const rawType = Array.isArray(type) ? type[0] : type;
  if (!rawType) return "#A47764";

  const t = rawType.toLowerCase();

  // Hostile - Premium Darker Tones
  if (t.includes("원수") || t.includes("enemy")) return "#9F1239"; // Rose 800
  if (t.includes("적대") || t.includes("hostile")) return "#E11D48"; // Rose 600
  if (t.includes("rival") || t.includes("라이벌")) return "#D97706"; // Amber 600

  // Romantic - Premium Pink
  if (
    t.includes("연인") ||
    t.includes("사랑") ||
    t.includes("romantic") ||
    t.includes("애정")
  )
    return "#DB2777"; // Pink 600

  // Friendly - Premium Green/Teal
  if (t.includes("ally") || t.includes("alliance")) return "#059669"; // Emerald 600
  if (t.includes("동료") || t.includes("coworker")) return "#0891B2"; // Cyan 600
  if (t.includes("친구") || t.includes("우호") || t.includes("friendly"))
    return "#15803D"; // Green 700

  // Mentor/Family - Premium Purple/Slate
  if (t.includes("mentor") || t.includes("스승") || t.includes("멘토"))
    return "#7C3AED"; // Violet 600
  if (t.includes("family") || t.includes("가족")) return "#4F5861"; // Blue-Gray

  if (t.includes("complex") || t.includes("복합")) return "#7C3AED";
  return "#A47764";
};

const getRelationIcon = (type: string) => {
  if (!type) return <HelpCircle className="w-[18px] h-[18px]" />;
  const t = type.toLowerCase();
  if (t.includes("적대") || t.includes("원수") || t.includes("hostile"))
    return <Sword className="w-[18px] h-[18px]" />;
  if (
    t.includes("연인") ||
    t.includes("사랑") ||
    t.includes("romantic") ||
    t.includes("애정")
  )
    return <Heart className="w-[18px] h-[18px]" fill="currentColor" />;
  if (
    t.includes("친구") ||
    t.includes("동료") ||
    t.includes("우호") ||
    t.includes("friendly") ||
    t.includes("ally")
  )
    return <Users className="w-[18px] h-[18px]" />;
  if (t.includes("mentor") || t.includes("스승"))
    return <Star className="w-[18px] h-[18px]" fill="currentColor" />;
  if (t.includes("family") || t.includes("가족"))
    return <Users className="w-[18px] h-[18px]" />;
  if (t.includes("complex") || t.includes("복합"))
    return <Info className="w-[18px] h-[18px]" />;
  return <HelpCircle className="w-[18px] h-[18px]" />;
};

function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * 빈 공간을 채우는 비대칭 앰비언트 오로라
 * 두 캐릭터의 감정 색상을 섞어서 비대칭성을 시각화함
 */
const AsymmetryAurora = ({
  sourceColor,
  targetColor,
  delay = 0,
}: {
  sourceColor: string;
  targetColor: string;
  delay?: number;
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      width: "350px",
      height: "350px",
      borderRadius: "100%",
      background: `radial-gradient(circle at 30% 30%, ${sourceColor} 0%, transparent 60%), radial-gradient(circle at 70% 70%, ${targetColor} 0%, transparent 60%)`,
      filter: "blur(65px)",
      mixBlendMode: "multiply",
    }}
    animate={{
      opacity: [0.1, 0.25, 0.15, 0.1],
      scale: [1, 1.15, 1.05, 1],
      rotate: [0, 180, 360],
      x: [0, 20, -10, 0],
      y: [0, -15, 10, 0],
    }}
    transition={{
      duration: 18,
      repeat: Infinity,
      ease: "linear",
      delay,
    }}
  />
);

/**
 * 몽글몽글 움직이는 감정 비눗방울 (Perspective Card 전용)
 */
const EmotionBlob = ({
  color,
  size,
  delay = 0,
}: {
  color: string;
  size: number;
  delay?: number;
}) => {
  const [random] = useState(() => ({
    x1: Math.random() * 40 - 20,
    x2: Math.random() * 40 - 20,
    y1: Math.random() * 40 - 20,
    y2: Math.random() * 40 - 20,
    duration: 10 + Math.random() * 5,
  }));

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0.8, opacity: 0 }}
      animate={{
        x: [0, random.x1, random.x2, 0],
        y: [0, random.y1, random.y2, 0],
        scale: [0.8, 1.1, 0.95, 1],
        opacity: [0.1, 0.25, 0.15, 0.1],
      }}
      transition={{
        duration: random.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        filter: "blur(22px)",
      }}
      className="absolute rounded-full pointer-events-none"
    />
  );
};

const FactorPill = ({ factor }: { factor: StrengthFactor }) => {
  const isFriendly = factor.category === "friendly";
  const color = isFriendly ? "#15803D" : "#A33A3A";
  const label = simplifyTerm(factor.type);

  // 간결한 알약 형태 디자인
  return (
    <div className="flex items-center justify-between bg-white/50 rounded-full px-3 py-1.5 border border-espresso-900/5 shadow-sm">
      <div className="flex items-center gap-2">
        <span style={{ color }} className="shrink-0">
          {getRelationIcon(factor.type)}
        </span>
        <span className="text-xs font-serif font-bold text-espresso-800 tracking-tight">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1 pl-2 border-l border-espresso-900/10 ml-2">
        <span className="text-[10px] font-black" style={{ color }}>
          {factor.score}
        </span>
      </div>
    </div>
  );
};

const CharacterPerspective = ({
  char,
  perspectiveData,
  otherSideColor,
  side,
}: {
  char: AnalysisCharacterInfo;
  perspectiveData: { total: number; factors: StrengthFactor[] };
  otherSideColor: string;
  side: "left" | "right";
}) => {
  const myColor = getRelationColor(perspectiveData.factors[0]?.type);

  return (
    <div
      className={cn("flex flex-col gap-12", side === "right" && "items-end")}
    >
      {/* Header with Name and Portrait */}
      <div
        className={cn(
          "flex items-center gap-12 relative",
          side === "right" && "flex-row-reverse text-right",
        )}
      >
        {/* Ambient Aurora in the empty space between name/portrait and card */}
        <div
          className={cn(
            "absolute z-0",
            side === "left" ? "left-[140%] top-0" : "right-[140%] top-0",
          )}
        >
          <AsymmetryAurora sourceColor={myColor} targetColor={otherSideColor} />
        </div>

        <motion.div className="relative z-10" whileHover={{ scale: 1.05 }}>
          <div className="absolute inset-0 bg-espresso-900/5 rounded-full blur-2xl opacity-20" />
          {char.imageUrl ? (
            <img
              src={char.imageUrl}
              alt={char.name}
              className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-2xl relative z-10"
            />
          ) : (
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center border-4 border-white shadow-2xl relative z-10">
              <span className="text-[36px] md:text-[44px] font-bold text-white font-serif">
                {getInitials(char.name)}
              </span>
            </div>
          )}
        </motion.div>

        <div className="space-y-0 relative z-10 min-w-0 flex-1">
          <h2 className="text-[clamp(1.25rem,5vw,3.5rem)] md:text-[clamp(2.5rem,5vw,4.25rem)] font-serif font-black text-espresso-900 tracking-tight leading-tight truncate">
            {char.name}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-4">
            {perspectiveData.factors.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/60 border border-espresso-900/5 text-[10px] md:text-xs font-bold text-espresso-600 backdrop-blur-sm"
              >
                # {simplifyTerm(f.type)}
              </span>
            ))}
            {perspectiveData.factors.length > 3 && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/60 border border-espresso-900/5 text-[10px] md:text-xs font-bold text-espresso-400 backdrop-blur-sm">
                + {perspectiveData.factors.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Persistence Card */}
      <div
        className={cn(
          "w-full max-w-[420px] bg-white/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/60 shadow-2xl relative overflow-hidden",
          side === "right" ? "rounded-tr-none" : "rounded-tl-none",
        )}
      >
        {/* Emotion Blobs inside card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {perspectiveData.factors.map((f, i) => (
            <EmotionBlob
              key={i}
              color={getRelationColor(f.type)}
              size={120 + f.weight * 150}
              delay={i * 2}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-10">
            <div className="flex flex-col">
              <span className="text-base font-black uppercase text-espresso-500 tracking-widest">
                유대 깊이
              </span>
              <span className="text-sm text-mocha-400 font-bold italic">
                Affinity Depth
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-mocha-500" />
              <span className="text-[48px] font-black text-espresso-900 lining-nums tracking-tighter">
                {perspectiveData.total.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="w-full bg-white/70 rounded-[2rem] p-6 shadow-xl border border-espresso-900/5 backdrop-blur-md min-h-[220px] flex flex-col">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-4 h-4 rounded-full bg-mocha-500/20 flex items-center justify-center">
                <Info className="w-2.5 h-2.5 text-mocha-500" />
              </div>
              <span className="text-sm font-black text-espresso-400 uppercase tracking-widest">
                주요 관계 요인
              </span>
            </div>

            {/* Factor Pills Grid */}
            <div className="flex flex-col gap-2">
              {perspectiveData.factors.slice(0, 4).map((f, i) => (
                <FactorPill key={i} factor={f} />
              ))}

              {/* More Indicator */}
              {perspectiveData.factors.length > 4 && (
                <div className="flex items-center justify-center p-2 mt-1">
                  <span className="text-xs font-bold text-mocha-400">
                    + {perspectiveData.factors.length - 4} more factors
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function DeepAnalysisHero({
  sourceCharacter,
  targetCharacter,
  asymmetricStrength,
  className,
  relationshipTypes: _relationshipTypes,
  description,
  since,
}: DeepAnalysisHeroProps) {
  // Note: _relationshipTypes is passed for future use but currently colors are derived from factors
  const sourceColor = getRelationColor(
    asymmetricStrength.sourceToTarget.factors[0]?.type,
  );
  const targetColor = getRelationColor(
    asymmetricStrength.targetToSource.factors[0]?.type,
  );

  return (
    <div className={cn("relative z-20 p-8 pb-16 pt-16", className)}>
      <motion.div
        key={`${sourceCharacter.id}-${targetCharacter.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[1400px] mx-auto relative"
      >
        {/* Analysis Header */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-12 md:mb-20 px-4">
          <div className="flex items-center gap-3 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white/60 border border-espresso-900/5 shadow-xl backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-mocha-500 animate-pulse" />
            <span className="text-[10px] md:text-sm font-black text-espresso-800 uppercase tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap">
              Deep Discovery Analysis
            </span>
          </div>
          {description && (
            <div className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-mocha-500/10 border border-mocha-500/20 shadow-sm backdrop-blur-xl">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-mocha-500 fill-mocha-500" />
              <span className="text-xs md:text-sm font-black text-mocha-700 truncate max-w-[200px] md:max-w-none">
                {description}
              </span>
            </div>
          )}
          {since && (
            <div className="flex items-center gap-2 md:gap-2.5 text-sm md:text-base text-espresso-400 font-serif italic whitespace-nowrap">
              <span className="text-mocha-300">✦</span>
              <span>인연의 시작 : {since}</span>
            </div>
          )}
        </div>

        {/* Main Side-by-Side Content */}
        <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-12 xl:gap-8 relative">
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, ease: "easeOut" }}
            className="w-full xl:flex-1"
          >
            <CharacterPerspective
              char={sourceCharacter}
              perspectiveData={asymmetricStrength.sourceToTarget}
              otherSideColor={targetColor}
              side="left"
            />
          </motion.div>

          {/* Central Connecting Divider with Shader Effect */}
          <div className="hidden xl:flex w-[clamp(240px,25vw,380px)] self-stretch flex-col relative pt-[8rem] shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <EmotionCollisionEffect
                factorsA={asymmetricStrength.sourceToTarget.factors}
                factorsB={asymmetricStrength.targetToSource.factors}
                strengthA={asymmetricStrength.sourceToTarget.total}
                strengthB={asymmetricStrength.targetToSource.total}
                className="w-full h-full"
              />
            </div>
          </div>

          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, ease: "easeOut" }}
            className="w-full xl:flex-1"
          >
            <CharacterPerspective
              char={targetCharacter}
              perspectiveData={asymmetricStrength.targetToSource}
              otherSideColor={sourceColor}
              side="right"
            />
          </motion.div>
        </div>

        {/* Bottom Full-Width Section: Bond Balance */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, ease: "easeOut" }}
          className="mt-16 relative z-30 px-4"
        >
          <AsymmetricStrengthGraph
            sourceCharacter={sourceCharacter}
            targetCharacter={targetCharacter}
            asymmetricStrength={asymmetricStrength}
            sourceColor={sourceColor}
            targetColor={targetColor}
            className="w-full max-w-[900px] mx-auto relative z-10"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
