import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisDiff } from "@/types/analysisTypes";
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

interface AnalysisSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: AnalysisDiff;
}

/**
 * Premium "Warm & Soft" Analysis Modal
 * Glassmorphism, soft shadows, refined typography following CLAUDE.md design system
 */
export const AnalysisSummaryModal: React.FC<AnalysisSummaryModalProps> = ({
  isOpen,
  onClose,
  diff,
}) => {
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
        type: "spring",
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
      transition: { type: "spring", stiffness: 400, damping: 30 },
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
                  background:
                    "linear-gradient(135deg, rgba(164, 119, 100, 0.08) 0%, rgba(61, 48, 42, 0.12) 100%)",
                  backdropFilter: "blur(16px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.2)",
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
                  className="relative w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(253, 252, 251, 0.97) 0%, rgba(241, 240, 236, 0.99) 100%)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: "2rem",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: `
                      0 0 0 1px rgba(0, 0, 0, 0.03),
                      0 2px 4px rgba(61, 48, 42, 0.02),
                      0 8px 16px rgba(61, 48, 42, 0.04),
                      0 24px 48px rgba(61, 48, 42, 0.08),
                      0 48px 96px rgba(61, 48, 42, 0.12),
                      inset 0 1px 0 rgba(255, 255, 255, 0.8)
                    `,
                    isolation: "isolate",
                    transform: "translateZ(0)",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}
                >
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
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                  {/* Organic texture overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage:
                        "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
                    }}
                  />

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
                        background: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 2px 8px rgba(61, 48, 42, 0.06)",
                      }}
                    >
                      <X className="w-5 h-5 text-stone-400 group-hover:text-stone-700 transition-colors" />
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

                        {/* Main title with gradient */}
                        <h2
                          className="text-4xl sm:text-5xl font-display font-bold leading-tight tracking-tight"
                          style={{
                            background:
                              "linear-gradient(135deg, #3D302A 0%, #5D4A40 50%, #7D5A4B 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          Narrative Changes
                        </h2>
                        <p className="text-stone-500 font-sans text-sm max-w-md leading-relaxed">
                          이야기 구조의 변화를 분석한 결과입니다. 캐릭터와
                          관계의 새로운 흐름을 확인하세요.
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
                            "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)",
                          backdropFilter: "blur(20px)",
                          borderRadius: "1rem",
                          border: "1px solid rgba(255, 255, 255, 0.6)",
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
                          className="text-5xl font-display font-bold text-mocha-600"
                        >
                          {totalChanges}
                        </motion.span>
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.15em]">
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
                                : "rgba(255, 255, 255, 0.5)",
                            backdropFilter: "blur(10px)",
                            border:
                              activeTab === tab.id
                                ? "1px solid rgba(164, 119, 100, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.4)",
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
                  <ScrollArea className="flex-1">
                    <div className="px-10 sm:px-14 py-8 min-h-[350px]">
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
                                  <h3 className="font-display text-xl text-stone-800 font-semibold">
                                    새로운 등장인물
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
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
                                          "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)",
                                        backdropFilter: "blur(20px)",
                                        border:
                                          "1px solid rgba(255, 255, 255, 0.6)",
                                        boxShadow:
                                          "0 4px 20px rgba(61, 48, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                                      }}
                                    >
                                      <div className="flex gap-5">
                                        {/* Avatar */}
                                        <div
                                          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-display font-bold text-white shrink-0 group-hover:scale-105 transition-transform"
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
                                              <h4 className="text-lg font-display font-semibold text-stone-800 group-hover:text-mocha-700 transition-colors">
                                                {char.profile.name}
                                              </h4>
                                              <p className="text-xs text-stone-400 mt-0.5">
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
                                            <p className="text-sm text-stone-500 mt-3 line-clamp-2 leading-relaxed italic">
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
                                  <h3 className="font-display text-xl text-stone-800 font-semibold">
                                    캐릭터 변화
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
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
                                        background: "rgba(255, 255, 255, 0.5)",
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
                                            <span className="text-xs text-stone-400">
                                              #{update.id.slice(-6)}
                                            </span>
                                          </div>
                                          <ul className="space-y-2">
                                            {update.changes.map((change, i) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-3 text-sm text-stone-600"
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
                                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                                  <Users className="w-8 h-8 text-stone-300" />
                                </div>
                                <p className="text-stone-400 font-medium">
                                  캐릭터 변경사항이 없습니다
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
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Link2 className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <h3 className="font-display text-xl text-stone-800 font-semibold">
                                    새로운 관계
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
                                </div>

                                <div className="grid gap-4">
                                  {diff.newRelations.map((rel, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={rel.id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="group p-6 rounded-2xl transition-all duration-300"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)",
                                        backdropFilter: "blur(20px)",
                                        border:
                                          "1px solid rgba(255, 255, 255, 0.6)",
                                        boxShadow:
                                          "0 4px 20px rgba(61, 48, 42, 0.04)",
                                      }}
                                    >
                                      <div className="flex items-center gap-6">
                                        <div
                                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                          style={{
                                            background:
                                              "linear-gradient(135deg, #A47764 0%, #BD9B8D 100%)",
                                            color: "white",
                                            boxShadow:
                                              "0 2px 8px rgba(164, 119, 100, 0.25)",
                                          }}
                                        >
                                          {rel.type}
                                        </div>
                                        <p className="flex-1 text-lg font-serif text-stone-700 italic">
                                          "{rel.description}"
                                        </p>
                                        <motion.div
                                          whileHover={{ x: 4 }}
                                          className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-mocha-500 group-hover:text-white transition-all"
                                        >
                                          <ArrowRight className="w-5 h-5" />
                                        </motion.div>
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
                                  <h3 className="font-display text-xl text-stone-800 font-semibold">
                                    관계 변화
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
                                </div>

                                <div className="space-y-4">
                                  {diff.updatedRelations.map((update, idx) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={update.id}
                                      initial="hidden"
                                      animate="visible"
                                      transition={{ delay: idx * 0.05 }}
                                      className="p-5 rounded-xl border-l-4 border-amber-300"
                                      style={{
                                        background: "rgba(255, 255, 255, 0.5)",
                                        backdropFilter: "blur(10px)",
                                      }}
                                    >
                                      <ul className="space-y-2">
                                        {update.changes.map((change, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-3 text-sm text-stone-600"
                                          >
                                            <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <span>{change}</span>
                                          </li>
                                        ))}
                                      </ul>
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
                                  <h3 className="font-display text-xl text-stone-800 font-semibold">
                                    종료된 관계
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
                                </div>

                                <div className="space-y-3">
                                  {diff.removedRelations?.map((id) => (
                                    <motion.div
                                      variants={itemVariants}
                                      key={id}
                                      className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 flex items-center gap-4"
                                    >
                                      <Trash2 className="w-4 h-4 text-stone-300" />
                                      <span className="text-sm text-stone-400 font-mono">
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
                                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                                    <Link2 className="w-8 h-8 text-stone-300" />
                                  </div>
                                  <p className="text-stone-400 font-medium">
                                    관계 변경사항이 없습니다
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
                        "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%)",
                      borderTop: "1px solid rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div className="flex items-center gap-3 text-stone-400">
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
