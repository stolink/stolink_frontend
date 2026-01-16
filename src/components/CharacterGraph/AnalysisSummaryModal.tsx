import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisDiff } from "@/types/analysisTypes";
import type { Character } from "@/types/character";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Sparkles,
  ArrowRight,
  Activity,
  Users,
  X,
  Feather,
  GitCommitHorizontal,
  Trash2,
  BookOpen,
  TrendingUp,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function for badge styles, derived from feature branch logic
// Helper: Normalize relationship types
const normalizeRelationType = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("romantic") || lower.includes("lover")) return "romantic";
  if (
    lower.includes("friend") ||
    lower.includes("ally") ||
    lower.includes("friendly")
  )
    return "friendly";
  if (lower.includes("hostile") || lower.includes("enemy")) return "hostile";
  if (lower.includes("family")) return "family";
  if (lower.includes("business") || lower.includes("colleague"))
    return "business";
  if (lower.includes("master") || lower.includes("servant"))
    return "master_servant";
  if (lower.includes("rival")) return "rival";
  return "default";
};

// Helper: Get Korean label for relationship types
const getRelationLabel = (type: string) => {
  const normalized = normalizeRelationType(type);
  switch (normalized) {
    case "romantic":
      return "연인";
    case "friendly":
      return "우호";
    case "hostile":
      return "적대";
    case "family":
      return "가족";
    case "business":
      return "동료";
    case "master_servant":
      return "주종";
    case "rival":
      return "라이벌";
    default:
      return type.toUpperCase(); // Fallback to uppercase
  }
};

// Helper function for badge styles, derived from feature branch logic
const getRelationBadgeStyle = (type: string) => {
  const normalized = normalizeRelationType(type);

  switch (normalized) {
    case "hostile":
      return {
        background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
      };
    case "friendly":
      return {
        background: "linear-gradient(135deg, #15803D 0%, #22c55e 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(21, 128, 61, 0.25)",
      };
    case "family":
      return {
        background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(14, 165, 233, 0.25)",
      };
    case "romantic":
      return {
        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(236, 72, 153, 0.25)",
      };
    case "business":
      return {
        background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.25)",
      };
    default:
      return {
        background: "linear-gradient(135deg, #A47764 0%, #BD9B8D 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(164, 119, 100, 0.25)",
      };
  }
};

// Simple Confetti Component using Framer Motion
const ConfettiParticle = ({ delay = 0 }: { delay?: number }) => {
  const [randomValues, setRandomValues] = useState<{
    randomX: number;
    randomY: number;
    randomRotate: number;
    color: string;
  } | null>(null);

  useEffect(() => {
    const colors = ["#A47764", "#BD9B8D", "#5B7B4B", "#FFD700", "#FF6B6B"];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRandomValues({
      randomX: Math.random() * 400 - 200,
      randomY: Math.random() * -300 - 100,
      randomRotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }, []);

  if (!randomValues) return null;

  const { randomX, randomY, randomRotate, color } = randomValues;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [1, 1, 0],
        x: randomX,
        y: randomY,
        rotate: randomRotate,
        scale: [0, 1, 0.5],
      }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "8px",
        height: "8px",
        backgroundColor: color,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
};

interface AnalysisSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: AnalysisDiff;
  characters?: Character[];
}

/**
 * Premium "Warm & Soft" Analysis Modal
 * Glassmorphism, soft shadows, refined typography following CLAUDE.md design system
 */
export const AnalysisSummaryModal: React.FC<AnalysisSummaryModalProps> = ({
  isOpen,
  onClose,
  diff,
  characters = [],
}) => {
  // Helper to find character name by ID
  const getCharName = (id: string | { id: string }) => {
    const charId = typeof id === "string" ? id : id.id;
    // 1. Try to find in character list (existing)
    const existing = characters.find((c) => c._id === charId);
    if (existing) return existing.profile.name;

    // 2. Try to find in diff.newCharacters
    const newChar = diff.newCharacters.find((c) => c._id === charId);
    if (newChar) return newChar.profile.name;

    return "알 수 없는 인물";
  };

  // Helper to find character avatar letter
  const getCharAvatar = (id: string | { id: string }) => {
    const name = getCharName(id);
    return name.charAt(0);
  };
  const [activeTab, setActiveTab] = useState<"characters" | "relations">(
    "characters",
  );

  const newCharCount = diff.newCharacters.length;
  const updatedCharCount = diff.updatedCharacters.length;
  const newRelCount = diff.newRelations.length;
  const updatedRelCount = diff.updatedRelations.length;
  const removedRelCount = diff.removedRelations?.length || 0;

  const totalChanges =
    newCharCount +
    updatedCharCount +
    newRelCount +
    updatedRelCount +
    removedRelCount;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 35,
        staggerChildren: 0.08,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: 10,
      transition: { duration: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
  };

  const tabStats = {
    characters: { new: newCharCount, updated: updatedCharCount },
    relations: {
      new: newRelCount,
      updated: updatedRelCount,
      removed: removedRelCount,
    },
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            {/* Premium Backdrop: Warm blur with subtle gradient */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
                style={{
                  background: "rgba(241, 240, 236, 0.85)", // Restored soft ivory background
                  backdropFilter: "blur(20px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
                }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative w-full max-w-4xl flex flex-col h-[85vh] sm:h-[88vh]"
                  style={{
                    background:
                      "linear-gradient(180deg, #F5F4F0 0%, #FFFFFF 100%)", // Restored Warm Ivory Gradient
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: "2rem",
                    border: "1px solid rgba(164, 119, 100, 0.15)",
                    boxShadow: "0 32px 64px -12px rgba(61, 48, 42, 0.12)",
                    isolation: "isolate",
                    transform: "translateZ(0)",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}
                >
                  {/* Confetti Explosion on Mount */}
                  <div className="absolute top-1/2 left-1/2 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <ConfettiParticle key={i} delay={i * 0.02} />
                    ))}
                  </div>

                  {/* Accessibility: Hidden Title and Description */}
                  <VisuallyHidden>
                    <DialogPrimitive.Title>
                      분석 결과 요약
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description>
                      캐릭터와 관계의 변경 사항을 확인합니다.
                    </DialogPrimitive.Description>
                  </VisuallyHidden>

                  {/* Subtle top highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Clean Background - No Texture */}
                  <div className="absolute inset-0 bg-background rounded-[2rem]" />

                  {/* ═══════════════════════════════════════════════════════════════
                      HEADER: Premium Glassmorphic Design
                  ═══════════════════════════════════════════════════════════════ */}
                  <div className="relative pt-12 px-10 sm:px-14 pb-8 flex-shrink-0">
                    {/* Close button - subtle glass effect */}
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute top-6 right-6 p-3 rounded-full transition-all duration-300 group"
                      style={{
                        background: "rgba(var(--paper), 0.5)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(var(--paper), 0.3)",
                        boxShadow: "0 2px 8px rgba(61, 48, 42, 0.06)",
                      }}
                    >
                      <X className="w-5 h-5 text-mocha-400 group-hover:text-mocha-700 transition-colors" />
                    </motion.button>

                    {/* Header content */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-4">
                        {/* Decorative label */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, #A47764 0%, #BD9B8D 100%)",
                              boxShadow:
                                "0 2px 8px rgba(164, 119, 100, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-mocha-500">
                            Analysis Complete
                          </span>
                        </div>

                        {/* Main title with gradient + Wavy Animation + TV Optimized High Contrast */}
                        <h2
                          className="text-5xl sm:text-7xl font-black leading-tight tracking-tighter break-keep"
                          style={{
                            color: "#A47764", // Pure Mocha color for text
                            textShadow: "0 2px 0 rgba(255, 255, 255, 0.8)", // Clean bottom highlight
                          }}
                        >
                          {"세계관 분석 완료".split(" ").map((word, i) => (
                            <motion.span
                              key={i}
                              initial={{ y: 0 }}
                              animate={{
                                y: [0, -12, 0],
                              }}
                              transition={{
                                duration: 0.8,
                                delay: i * 0.15,
                                repeat: Infinity,
                                repeatDelay: 1.5,
                                ease: "easeInOut",
                              }}
                              style={{
                                display: "inline-block",
                                marginRight: "0.25em",
                              }}
                            >
                              {word}
                            </motion.span>
                          ))}
                        </h2>
                        <p className="text-mocha-700 font-sans text-lg sm:text-2xl font-bold max-w-2xl leading-relaxed mt-6">
                          발견된 캐릭터와 관계의 변화를 확인해보세요.
                        </p>
                      </div>

                      {/* Stats card with glassmorphism */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
                        animate={{ opacity: 1, scale: 1, rotate: 2 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="flex flex-col items-center gap-2 p-6 min-w-[120px]"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(var(--paper), 0.8) 0%, rgba(var(--paper), 0.4) 100%)",
                          backdropFilter: "blur(20px)",
                          borderRadius: "1rem",
                          border: "1px solid rgba(var(--paper), 0.6)",
                          boxShadow: `
                            0 4px 24px rgba(164, 119, 100, 0.1),
                            0 8px 32px rgba(61, 48, 42, 0.05),
                            inset 0 1px 0 rgba(255, 255, 255, 0.8)
                          `,
                        }}
                      >
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.3,
                            type: "spring",
                            stiffness: 300,
                          }}
                          className="text-5xl  font-bold text-mocha-600"
                        >
                          {totalChanges}
                        </motion.span>
                        <span className="text-[9px] font-bold text-mocha-400 uppercase tracking-[0.15em]">
                          Total Updates
                        </span>
                      </motion.div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        TAB NAVIGATION: Pill-style with glassmorphism
                    ───────────────────────────────────────────────────────────── */}
                    <div className="flex gap-3 mt-10">
                      {[
                        {
                          id: "characters",
                          label: "캐릭터",
                          icon: Users,
                          count:
                            tabStats.characters.new +
                            tabStats.characters.updated,
                        },
                        {
                          id: "relations",
                          label: "관계",
                          icon: Link2,
                          count:
                            tabStats.relations.new +
                            tabStats.relations.updated +
                            tabStats.relations.removed,
                        },
                      ].map((tab) => (
                        <motion.button
                          key={tab.id}
                          onClick={() =>
                            setActiveTab(tab.id as "characters" | "relations")
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "relative px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3",
                          )}
                          style={{
                            background:
                              activeTab === tab.id
                                ? "linear-gradient(135deg, #A47764 0%, #BD9B8D 100%)"
                                : "rgba(var(--paper), 0.5)",
                            backdropFilter: "blur(10px)",
                            border:
                              activeTab === tab.id
                                ? "1px solid rgba(164, 119, 100, 0.3)"
                                : "1px solid rgba(var(--paper), 0.4)",
                            boxShadow:
                              activeTab === tab.id
                                ? "0 4px 16px rgba(164, 119, 100, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                                : "0 2px 8px rgba(61, 48, 42, 0.04)",
                            color: activeTab === tab.id ? "#FFFFFF" : "#78716c",
                          }}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                          {tab.count > 0 && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                activeTab === tab.id
                                  ? "bg-white/20 text-white"
                                  : "bg-mocha-100 text-mocha-600",
                              )}
                            >
                              {tab.count}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════
                      BODY CONTENT: Scrollable area with refined cards
                  ═══════════════════════════════════════════════════════════════ */}
                  <ScrollArea className="flex-1 w-full min-h-0">
                    <div className="px-6 sm:px-14 py-8">
                      <AnimatePresence mode="wait">
                        {activeTab === "characters" ? (
                          <motion.div
                            key="characters"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                          >
                            {/* New Characters Section */}
                            {diff.newCharacters.length > 0 && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <h3 className=" text-xl text-espresso-800 font-semibold">
                                    새로운 등장인물
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-cloud-200 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  {diff.newCharacters.map((char, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={char._id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="group p-6 rounded-2xl transition-all duration-500 cursor-default"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, rgba(var(--paper), 0.9) 0%, rgba(var(--paper), 0.6) 100%)",
                                        backdropFilter: "blur(20px)",
                                        border:
                                          "1px solid rgba(var(--paper), 0.6)",
                                        boxShadow:
                                          "0 4px 20px rgba(61, 48, 42, 0.04), inset 0 1px 0 rgba(var(--paper), 0.8)",
                                      }}
                                    >
                                      <div className="flex gap-5">
                                        {/* Avatar */}
                                        <div
                                          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl  font-bold text-white shrink-0 group-hover:scale-105 transition-transform"
                                          style={{
                                            background:
                                              "linear-gradient(135deg, #5B7B4B 0%, #7D9A6A 100%)",
                                            boxShadow:
                                              "0 4px 12px rgba(91, 123, 75, 0.25)",
                                          }}
                                        >
                                          {char.profile.name[0]}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <h4 className="text-lg  font-semibold text-espresso-800 group-hover:text-mocha-700 transition-colors">
                                                {char.profile.name}
                                              </h4>
                                              <p className="text-xs text-mocha-400 mt-0.5">
                                                {char.role} ·{" "}
                                                {char.profile.faction?.name ||
                                                  "무소속"}
                                              </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                              NEW
                                            </span>
                                          </div>
                                          {char.profile.backstory && (
                                            <p className="text-sm text-mocha-500 mt-3 line-clamp-2 leading-relaxed italic">
                                              "{char.profile.backstory}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Updated Characters Section */}
                            {diff.updatedCharacters.length > 0 && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-mocha-100 flex items-center justify-center">
                                    <GitCommitHorizontal className="w-3 h-3 text-mocha-600" />
                                  </div>
                                  <h3 className=" text-xl text-espresso-800 font-semibold">
                                    캐릭터 변화
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-cloud-200 to-transparent" />
                                </div>

                                <div className="space-y-4">
                                  {diff.updatedCharacters.map((update, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={update.id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="p-5 rounded-xl border-l-4 border-mocha-300"
                                      style={{
                                        background: "rgba(var(--paper), 0.5)",
                                        backdropFilter: "blur(10px)",
                                      }}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-mocha-50 flex items-center justify-center shrink-0">
                                          <Activity className="w-5 h-5 text-mocha-400" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-mocha-500 uppercase tracking-wider">
                                              Character Update
                                            </span>
                                            <span className="text-xs text-mocha-400">
                                              #{update.id.slice(-6)}
                                            </span>
                                          </div>
                                          <ul className="space-y-2">
                                            {update.changes.map((change, i) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-3 text-sm text-mocha-600"
                                              >
                                                <CheckCircle2 className="w-4 h-4 text-mocha-400 mt-0.5 shrink-0" />
                                                <span>{change}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Empty state */}
                            {newCharCount === 0 && updatedCharCount === 0 && (
                              <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-cloud-100 flex items-center justify-center mb-4">
                                  <Users className="w-8 h-8 text-mocha-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-espresso-800 mb-2">
                                  캐릭터 데이터가 최신입니다
                                </h3>
                                <p className="text-mocha-400 font-medium max-w-xs mx-auto">
                                  AI가 새로운 캐릭터나 변경사항을 발견하지
                                  못했습니다.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div
                            key="relations"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                          >
                            {/* New Relations */}
                            {diff.newRelations.length > 0 && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-mocha-100 flex items-center justify-center">
                                    <Link2 className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <h3 className=" text-xl text-espresso-800 font-semibold">
                                    새로운 관계
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-cloud-200 to-transparent" />
                                </div>

                                <div className="grid gap-4">
                                  {diff.newRelations.map((rel, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={rel.id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="group p-5 rounded-2xl transition-all duration-300"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, rgba(var(--paper), 0.9) 0%, rgba(var(--paper), 0.6) 100%)",
                                        backdropFilter: "blur(20px)",
                                        border:
                                          "1px solid rgba(var(--paper), 0.6)",
                                        boxShadow:
                                          "0 4px 20px rgba(61, 48, 42, 0.04)",
                                      }}
                                    >
                                      {/* Relationship Header: Source -> Target */}
                                      <div className="flex items-center gap-3 mb-4">
                                        {/* Source */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-mocha-100 flex items-center justify-center text-sm font-bold text-mocha-700">
                                            {getCharAvatar(rel.source)}
                                          </div>
                                          <span className="text-sm font-bold text-espresso-800">
                                            {getCharName(rel.source)}
                                          </span>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex-1 flex items-center justify-center px-2">
                                          <div className="h-px w-full bg-mocha-200 relative">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-mocha-200">
                                              <ArrowRight className="w-3 h-3" />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Target */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-espresso-800">
                                            {getCharName(rel.target)}
                                          </span>
                                          <div className="w-8 h-8 rounded-full bg-cloud-200 flex items-center justify-center text-sm font-bold text-mocha-600">
                                            {getCharAvatar(rel.target)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tag & Description */}
                                      <div className="flex items-start gap-4 bg-white/50 p-4 rounded-xl border border-white/60">
                                        <div
                                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide shadow-sm shrink-0 uppercase"
                                          style={getRelationBadgeStyle(
                                            rel.type,
                                          )}
                                        >
                                          {getRelationLabel(rel.type)}
                                        </div>
                                        <p className="flex-1 text-sm text-mocha-700 leading-relaxed italic">
                                          "{rel.description}"
                                        </p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Updated Relations */}
                            {diff.updatedRelations.length > 0 && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Activity className="w-3 h-3 text-amber-600" />
                                  </div>
                                  <h3 className=" text-xl text-espresso-800 font-semibold">
                                    관계 변화
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-cloud-200 to-transparent" />
                                </div>

                                <div className="space-y-4">
                                  {diff.updatedRelations.map((update, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={update.id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="group p-5 rounded-2xl border border-amber-200/50"
                                      style={{
                                        background: "rgba(255, 251, 235, 0.6)", // Gentle Amber tint
                                        backdropFilter: "blur(10px)",
                                      }}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                          <Activity className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md">
                                              Relationship Update
                                            </span>
                                            {/* We can improve this ID display if we parse it, but for now ID is safer */}
                                            <span className="text-xs text-amber-600/60 font-mono">
                                              #{update.id.slice(0, 8)}
                                            </span>
                                          </div>
                                          <ul className="space-y-2.5">
                                            {update.changes.map((change, i) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-3 text-sm text-mocha-800"
                                              >
                                                <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                <span className="leading-snug">
                                                  {change}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Removed Relations */}
                            {removedRelCount > 0 && (
                              <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                  </div>
                                  <h3 className=" text-xl text-espresso-800 font-semibold">
                                    종료된 관계
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-cloud-200 to-transparent" />
                                </div>

                                <div className="space-y-3">
                                  {diff.removedRelations?.map((id) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={id}
                                      className="p-4 rounded-xl border border-dashed border-cloud-200 bg-muted/50 flex items-center gap-4"
                                    >
                                      <Trash2 className="w-4 h-4 text-mocha-300" />
                                      <span className="text-sm text-mocha-400 ">
                                        Relation #{id.slice(-8)}
                                      </span>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Empty state */}
                            {newRelCount === 0 &&
                              updatedRelCount === 0 &&
                              removedRelCount === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <Link2 className="w-8 h-8 text-mocha-300" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-espresso-800 mb-2">
                                    관계 데이터가 최신입니다
                                  </h3>
                                  <p className="text-mocha-400 font-medium max-w-xs mx-auto">
                                    AI가 새로운 역학구도나 관계 변화를 발견하지
                                    못했습니다.
                                  </p>
                                </div>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>

                  {/* ═══════════════════════════════════════════════════════════════
                      FOOTER: Premium action button
                  ═══════════════════════════════════════════════════════════════ */}
                  <div
                    className="relative px-10 sm:px-14 py-6 flex justify-between items-center"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(var(--paper), 0) 0%, rgba(var(--paper), 0.8) 100%)",
                      borderTop: "1px solid rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div className="flex items-center gap-3 text-mocha-400">
                      <Feather className="w-4 h-4" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        StoLink Analysis Engine v1.0
                      </span>
                    </div>

                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative px-8 py-4 rounded-xl overflow-hidden flex items-center gap-3 transition-all"
                      style={{
                        background:
                          "linear-gradient(135deg, #3D302A 0%, #5D4A40 100%)",
                        boxShadow: `
                          0 4px 16px rgba(61, 48, 42, 0.25),
                          0 8px 32px rgba(61, 48, 42, 0.15),
                          inset 0 1px 0 rgba(255, 255, 255, 0.1)
                        `,
                      }}
                    >
                      {/* Hover layer */}
                      <div className="absolute inset-0 bg-mocha-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <Sparkles className="w-4 h-4 text-white relative z-10" />
                      <span className="text-white font-medium text-sm uppercase tracking-wider relative z-10">
                        확인 완료
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};
