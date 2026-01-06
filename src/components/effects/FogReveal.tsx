import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, BookOpen, CheckCircle2 } from "lucide-react";

// Types
export type FogState = "IDLE" | "PROCESSING" | "DETECTED" | "REVEALED";

interface FogRevealProps {
  state: FogState;
  className?: string;
}

/**
 * Editorial "Manuscript Unfold" Reveal Effect
 * Designed according to CLAUDE.md (Warm & Soft aesthetic)
 */
export default function FogReveal({ state, className = "" }: FogRevealProps) {
  const isVisible = state !== "IDLE";
  const [showContent, setShowContent] = useState(true);

  // Sync content visibility with state
  useEffect(() => {
    if (state === "REVEALED") {
      // Show '분석 완료!' for 800ms before fading it out
      const timer = setTimeout(() => setShowContent(false), 800);
      return () => clearTimeout(timer);
    }

    // Reset content visibility when logic requires it
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowContent(true);
  }, [state]);

  const textContent = useMemo(() => {
    switch (state) {
      case "PROCESSING":
        return {
          title: "Reading Context...",
          sub: "이야기의 흐름을 읽고 있습니다",
          icon: <BookOpen className="w-5 h-5 animate-pulse text-mocha-400" />,
        };
      case "DETECTED":
        return {
          title: "Insight Found",
          sub: "새로운 연결고리를 발견했습니다",
          icon: (
            <Sparkles className="w-5 h-5 text-mocha-400 animate-spin-slow" />
          ),
        };
      case "REVEALED":
        return {
          title: "분석 완료!",
          sub: "이야기의 새로운 실마리를 찾았습니다",
          icon: <Sparkles className="w-6 h-6 text-mocha-500" />,
        };
      default:
        return null;
    }
  }, [state]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className={cn(
            "absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-col",
            className,
          )}
        >
          {/*
            Editorial Backdrop: Horizontal Split "Manuscript"
            Two panels that split from the middle.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Top Panel */}
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ backgroundColor: "#F1F0EC" }} // Cloud 50
              className="flex-1 w-full relative"
            >
              {/* Grain Texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />
              {/* Soft Gradient Shadow to give depth to the split */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-espresso-900/5 to-transparent" />
            </motion.div>

            {/* Bottom Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ backgroundColor: "#F1F0EC" }} // Cloud 50
              className="flex-1 w-full relative border-t border-cloud-200/50"
            >
              {/* Grain Texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />
              {/* Soft Gradient Shadow */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-espresso-900/5 to-transparent" />
            </motion.div>
          </motion.div>

          {/* Centered Editorial Content */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <AnimatePresence mode="wait">
              {isVisible && showContent && textContent && (
                <>
                  {/* REVEALED 상태: 토스 스타일 분석 완료 애니메이션 */}
                  {state === "REVEALED" ? (
                    <motion.div
                      key="revealed-toss"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.2 },
                      }}
                      className="flex flex-col items-center justify-center relative"
                    >
                      {/* 배경 글로우 효과 */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ top: -30 }}
                      >
                        <div
                          className="w-48 h-48 rounded-full blur-3xl"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(134, 171, 134, 0.4) 0%, rgba(134, 171, 134, 0.1) 50%, transparent 100%)",
                          }}
                        />
                      </motion.div>

                      {/* 파티클 효과 8개 */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.3],
                            x: Math.cos((i * Math.PI * 2) / 8) * 60,
                            y: Math.sin((i * Math.PI * 2) / 8) * 60 - 30,
                          }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 + i * 0.025,
                            ease: "easeOut",
                          }}
                          className="absolute w-2.5 h-2.5 rounded-full"
                          style={{
                            left: "50%",
                            top: "50%",
                            marginLeft: -5,
                            marginTop: -35,
                            background:
                              "linear-gradient(135deg, #86ab86 0%, #6d9a6d 100%)",
                          }}
                        />
                      ))}

                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 18,
                          delay: 0.05,
                        }}
                        className="relative z-10"
                      >
                        {/* 메인 체크마크 아이콘 */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 16,
                          }}
                          className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl border border-cloud-200/60"
                          style={{
                            background:
                              "linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 50%, #d5ddd5 100%)",
                          }}
                        >
                          <CheckCircle2
                            className="w-10 h-10 text-sage-600"
                            strokeWidth={2.5}
                          />
                        </motion.div>

                        {/* 외곽 링 펄스 1 */}
                        <motion.div
                          initial={{ scale: 1, opacity: 0 }}
                          animate={{ scale: 1.8, opacity: [0, 0.5, 0] }}
                          transition={{
                            duration: 0.45,
                            delay: 0.12,
                            ease: "easeOut",
                          }}
                          className="absolute inset-0 rounded-full border-2 border-sage-400"
                        />
                        {/* 외곽 링 펄스 2 */}
                        <motion.div
                          initial={{ scale: 1, opacity: 0 }}
                          animate={{ scale: 2.3, opacity: [0, 0.25, 0] }}
                          transition={{
                            duration: 0.55,
                            delay: 0.2,
                            ease: "easeOut",
                          }}
                          className="absolute inset-0 rounded-full border border-sage-300"
                        />
                      </motion.div>

                      {/* 텍스트 */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.25,
                          duration: 0.25,
                          ease: "easeOut",
                        }}
                        className="mt-6 text-center space-y-2"
                      >
                        <h2 className="text-2xl  font-bold text-espresso-800 tracking-tight">
                          분석 완료!
                        </h2>
                        <p className="text-xs text-mocha-500 font-sans font-medium uppercase tracking-[0.15em]">
                          이야기의 새로운 실마리를 찾았습니다
                        </p>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* 기존 PROCESSING/DETECTED 상태 */
                    <motion.div
                      key={state}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{
                        opacity: 0,
                        y: -20,
                        filter: "blur(4px)",
                        scale: 0.98,
                      }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-center gap-6 text-center"
                    >
                      <div className="p-4 bg-white/50 rounded-full ring-1 ring-espresso-900/5 backdrop-blur-sm shadow-sm">
                        {textContent.icon}
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-4xl  font-bold text-espresso-800 tracking-tight ">
                          {textContent.title}
                        </h2>
                        <p className="text-sm text-mocha-500 font-sans font-bold uppercase tracking-[0.2em]">
                          {textContent.sub}
                        </p>
                      </div>

                      {/* High-End Decorative Separator */}
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 120, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="h-[1px] bg-cloud-200 relative overflow-hidden"
                      >
                        {state === "PROCESSING" && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-mocha-400 to-transparent"
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
