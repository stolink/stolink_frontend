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
  since?: string;
  className?: string;
}

/**
 * 중고등학생 수준의 자연스러운 용어 변환기
 */
const simplifyTerm = (term: string) => {
  const t = term.toLowerCase();
  if (t.includes("mentor")) return "나를 이끌어주는 멘토";
  if (t.includes("friend")) return "서로 믿고 의지하는 친구";
  if (t.includes("romantic") || t.includes("lover"))
    return "설렘 가득한 로맨스";
  if (t.includes("hostile") || t.includes("enemy"))
    return "날카로운 적대감과 갈등";
  if (t.includes("coworker") || t.includes("ally"))
    return "목표를 함께하는 든든한 동료";
  if (t.includes("complex")) return "많은 감정이 섞인 복잡한 마음";
  return term;
};

const getRelationColor = (type: string) => {
  if (!type) return "#A47764";
  const t = type.toLowerCase();
  if (t.includes("적대") || t.includes("원수") || t.includes("hostile"))
    return "#F44336";
  if (
    t.includes("연인") ||
    t.includes("사랑") ||
    t.includes("romantic") ||
    t.includes("애정")
  )
    return "#FF4081";
  if (
    t.includes("친구") ||
    t.includes("동료") ||
    t.includes("우호") ||
    t.includes("friendly") ||
    t.includes("ally")
  )
    return "#15803D";
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
  return <HelpCircle className="w-[16px] h-[16px]" />;
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

const FactorLine = ({ factor }: { factor: StrengthFactor }) => {
  const isFriendly = factor.category === "friendly";
  const color = isFriendly ? "#15803D" : "#A33A3A";
  const label = simplifyTerm(factor.type);

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-espresso-900/5 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            style={{ color }}
            className="p-1 rounded bg-white/80 shadow-sm border border-espresso-900/5"
          >
            {getRelationIcon(factor.type)}
          </span>
          <span className="text-base font-serif font-bold text-espresso-800 tracking-tight">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-[13px] h-[13px] text-mocha-400 fill-mocha-400" />
          <span className="text-[13px] font-black" style={{ color }}>
            {factor.score}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-10">
        <div className="flex-1 h-1 bg-espresso-900/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${factor.weight * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <span className="text-xs font-bold text-espresso-300 uppercase shrink-0">
          영향력 {factor.weight}
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

        <div className="space-y-0 relative z-10">
          <h2 className="text-[52px] md:text-[68px] font-serif font-black text-espresso-900 tracking-tight leading-none">
            {char.name}
          </h2>
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

          <div className="w-full bg-white/70 rounded-[2rem] p-6 shadow-xl border border-espresso-900/5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-4 h-4 rounded-full bg-mocha-500/20 flex items-center justify-center">
                <Info className="w-2.5 h-2.5 text-mocha-500" />
              </div>
              <span className="text-sm font-black text-espresso-400 uppercase tracking-widest">
                관계 포인트
              </span>
            </div>
            <div className="space-y-1">
              {perspectiveData.factors.map((f, i) => (
                <FactorLine key={i} factor={f} />
              ))}
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
  since,
}: DeepAnalysisHeroProps) {
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
        <div className="flex items-center gap-6 mb-20 px-4">
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/60 border border-espresso-900/5 shadow-xl backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-mocha-500 animate-pulse" />
            <span className="text-sm font-black text-espresso-800 uppercase tracking-[0.4em]">
              Deep Discovery Analysis
            </span>
          </div>
          {since && (
            <div className="flex items-center gap-2.5 text-base text-espresso-400 font-serif italic">
              <span className="text-mocha-300">✦</span>
              <span>인연의 시작 : {since}</span>
            </div>
          )}
        </div>

        {/* Main Side-by-Side Content */}
        <div className="flex flex-col xl:flex-row items-start justify-between gap-24 xl:gap-8 relative">
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

          {/* Central Connecting Divider */}
          <div className="hidden xl:flex flex-col justify-center items-center gap-8 pt-24 min-h-[600px] relative">
            {/* Emotion Collision Effect (중앙 영역) */}
            <div className="absolute inset-0 w-96 left-1/2 -translate-x-1/2 overflow-hidden pointer-events-none">
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
