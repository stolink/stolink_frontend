import { useState, useEffect } from "react";
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
  onShaderReady?: () => void;
  className?: string;
}

/**
 * 중고등학생 수준의 자연스러운 용어 변환기
 */
const simplifyTerm = (term: string) => {
  const t = term.toLowerCase();

  // 1. Ally / Coworker
  if (t.includes("ally") || t.includes("alliance") || t.includes("동맹"))
    return "목표를 함께하는 든든한 동료";
  if (t.includes("coworker") || t.includes("동료") || t.includes("partner"))
    return "함께 합을 맞추는 파트너";

  // 2. Rival / Enemy
  if (t.includes("rival") || t.includes("라이벌") || t.includes("경쟁"))
    return "서로의 성장을 자극하는 라이벌";
  if (t.includes("enemy") || t.includes("원수") || t.includes("hostile"))
    return "피할 수 없는 숙명의 원수";

  // 3. Romantic / Friend
  if (
    t.includes("romantic") ||
    t.includes("lover") ||
    t.includes("사랑") ||
    t.includes("연인")
  )
    return "설렘 가득한 로맨스";
  if (
    t.includes("friend") ||
    t.includes("친구") ||
    t.includes("friendly") ||
    t.includes("우호")
  )
    return "서로 믿고 의지하는 친구";

  // 4. Mentor / Family
  if (t.includes("mentor") || t.includes("스승") || t.includes("멘토"))
    return "나를 이끌어주는 멘토";
  if (t.includes("family") || t.includes("가족") || t.includes("집안"))
    return "피보다 진한 유대, 가족";

  // 5. Master-Servant / Subordinate
  if (
    t.includes("master_servant") ||
    t.includes("subordinate") ||
    t.includes("군신") ||
    t.includes("주종")
  )
    return "충성과 헌신의 군신 관계";

  // 6. Neutral / Knows
  if (
    t.includes("neutral") ||
    t.includes("중립") ||
    t.includes("knows") ||
    t.includes("면식")
  )
    return "아직은 낯선 묘한 거리감";

  // 7. Classmate
  if (t.includes("classmate") || t.includes("동창") || t.includes("동기"))
    return "함께 추억을 쌓는 동기";

  // 8. Complex / Mixed
  if (t.includes("complex") || t.includes("복합") || t.includes("mixed"))
    return "많은 감정이 섞인 복잡한 마음";

  // 9. Emotional Factors (Admiration, Trust, etc.)
  if (t.includes("admiration") || t.includes("흠모") || t.includes("존경"))
    return "존경과 흠모의 마음";
  if (t.includes("trust") || t.includes("신뢰")) return "흔들림 없는 깊은 신뢰";
  if (t.includes("protection") || t.includes("protects") || t.includes("보호"))
    return "끝까지 지켜주고픈 마음";
  if (t.includes("betrayal") || t.includes("betrayed") || t.includes("배신"))
    return "지워지지 않는 배신의 상처";

  return term;
};

import { RELATION_COLORS, toUIRelationType } from "../../constants";

const getRelationColor = (type: string | string[]) => {
  const rawType = Array.isArray(type) ? type[0] : type;
  if (!rawType) return RELATION_COLORS.neutral;

  const uiType = toUIRelationType(rawType);
  return RELATION_COLORS[uiType] || RELATION_COLORS.neutral;
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
  if (t.includes("classmate") || t.includes("동창"))
    return <Users className="w-[18px] h-[18px]" />;
  if (t.includes("betrayal") || t.includes("배신"))
    return <Sword className="w-[18px] h-[18px] text-red-900" />;
  if (t.includes("protection") || t.includes("보호"))
    return <Heart className="w-[18px] h-[18px]" fill="none" />;
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
        <span className="text-xs font-serif font-bold text-espresso-800 tracking-tight truncate max-w-[120px]">
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
      className={cn(
        "flex flex-col gap-10",
        side === "right" ? "items-end" : "items-start",
      )}
    >
      {/* Header with Name and Portrait - Vertical Stack Design */}
      <div
        className={cn(
          "flex flex-col relative z-10 w-full",
          side === "right" ? "items-end text-right" : "items-start",
        )}
      >
        {/* Ambient Aurora - Now positioned behind the portrait-name group */}
        <div
          className={cn(
            "absolute z-0",
            side === "left"
              ? "left-1/2 -translate-x-1/2 top-10"
              : "right-1/2 translate-x-1/2 top-10",
          )}
        >
          <AsymmetryAurora sourceColor={myColor} targetColor={otherSideColor} />
        </div>

        {/* Portrait - Large and Centered within the header scope */}
        <motion.div
          className="relative z-10 mb-8"
          whileHover={{ scale: 1.05 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-espresso-900/10 rounded-full blur-3xl opacity-30" />
          {char.imageUrl ? (
            <img
              src={char.imageUrl}
              alt={char.name}
              className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10"
            />
          ) : (
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-mocha-400 to-mocha-600 flex items-center justify-center border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10">
              <span className="text-[40px] md:text-[52px] font-bold text-white font-serif">
                {getInitials(char.name)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Name and Tags Area */}
        <div className="space-y-4 relative z-10 w-full">
          <h2
            className={cn(
              "font-serif font-black text-espresso-900 tracking-tight leading-[1.1] break-keep",
              char.name.length > 12
                ? "text-[28px] md:text-[36px]"
                : char.name.length > 8
                  ? "text-[36px] md:text-[48px]"
                  : char.name.length > 4
                    ? "text-[44px] md:text-[56px]"
                    : "text-[52px] md:text-[68px]",
            )}
          >
            {char.name}
          </h2>

          <div
            className={cn(
              "flex flex-wrap gap-2.5",
              side === "right" ? "justify-end" : "justify-start",
            )}
          >
            {perspectiveData.factors.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="px-4 py-1.5 rounded-full bg-white/60 border border-espresso-900/5 text-[11px] font-bold text-espresso-600 backdrop-blur-md shadow-sm whitespace-nowrap"
              >
                # {simplifyTerm(f.type)}
              </span>
            ))}
            {perspectiveData.factors.length > 3 && (
              <span className="px-4 py-1.5 rounded-full bg-white/60 border border-espresso-900/5 text-[11px] font-bold text-espresso-400 backdrop-blur-md shadow-sm">
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
  onShaderReady,
}: DeepAnalysisHeroProps) {
  // Note: _relationshipTypes is passed for future use but currently colors are derived from factors
  const sourceColor = getRelationColor(
    asymmetricStrength.sourceToTarget.factors[0]?.type,
  );
  const targetColor = getRelationColor(
    asymmetricStrength.targetToSource.factors[0]?.type,
  );

  // Fallback: If shader doesn't load within 500ms (e.g. hidden on small screens), force ready
  useEffect(() => {
    const timer = setTimeout(() => {
      onShaderReady?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onShaderReady]);

  return (
    <div className={cn("relative z-20 p-8 pb-16 pt-16", className)}>
      <motion.div
        key={`${sourceCharacter.id}-${targetCharacter.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[1400px] mx-auto relative"
      >
        {/* Intelligence Briefing Card - Structured & Aesthetic */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] mb-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative overflow-hidden group">
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-mocha-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Left: Summary Section */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-10 items-start w-full">
            <div className="shrink-0 flex flex-col items-center">
              <div className="px-4 py-1.5 bg-espresso-900 rounded-full mb-3 shadow-lg">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                  Briefing No.{" "}
                  {Math.abs(
                    sourceCharacter.name.length * 7 +
                      targetCharacter.name.length,
                  )
                    .toString()
                    .padStart(3, "0")}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-mocha-500 animate-pulse" />
                <div className="w-0.5 h-12 bg-gradient-to-b from-mocha-500 to-transparent" />
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[550px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-mocha-400 uppercase tracking-widest">
                  Intelligence Summary
                </span>
                <div className="flex-1 h-px bg-mocha-200/30" />
              </div>

              <div className="space-y-2">
                {(description || "관계 심층 분석 데이터")
                  .split(/[.?!]/)
                  .map((sentence, idx) => {
                    const trimmed = sentence.trim();
                    if (!trimmed) return null;
                    return (
                      <h1
                        key={idx}
                        className="text-xl md:text-2xl font-serif font-black text-espresso-900 tracking-tight leading-tight first-letter:capitalize"
                      >
                        {trimmed}.
                      </h1>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="hidden lg:block w-px h-24 bg-espresso-900/10 shrink-0" />

          {/* Right: Metadata Section */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-10 lg:gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-start px-4 lg:px-0">
            {since && (
              <div className="text-right">
                <div className="text-[10px] font-black text-espresso-300 uppercase tracking-widest mb-1">
                  Established In
                </div>
                <div className="flex items-center gap-3 text-espresso-900 font-serif font-black text-lg md:text-xl">
                  <span className="text-mocha-400 font-bold select-none text-sm">
                    ✦
                  </span>
                  {since}
                </div>
              </div>
            )}

            <div className="text-right">
              <div className="text-[10px] font-black text-espresso-300 uppercase tracking-widest mb-1">
                Classification
              </div>
              <div className="px-3 py-1 bg-mocha-50 rounded-lg border border-mocha-100 text-[11px] font-bold text-mocha-700 uppercase tracking-tight shadow-inner">
                Confidential
              </div>
            </div>
          </div>
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

          {/* Central Connecting Divider with Shader Effect */}
          <div className="hidden xl:flex w-[280px] self-stretch flex-col relative pt-[8rem] shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <EmotionCollisionEffect
                factorsA={asymmetricStrength.sourceToTarget.factors}
                factorsB={asymmetricStrength.targetToSource.factors}
                strengthA={asymmetricStrength.sourceToTarget.total}
                strengthB={asymmetricStrength.targetToSource.total}
                onReady={onShaderReady}
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
