import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";

interface ConflictAlertOverlayProps {
  onComplete: () => void;
}

export function ConflictAlertOverlay({
  onComplete,
}: ConflictAlertOverlayProps) {
  const [phase, setPhase] = useState<"analyzing" | "complete" | "clearing">(
    "analyzing",
  );

  useEffect(() => {
    // Phase 1: Analyzing -> Complete (2.0s)
    const timer1 = setTimeout(() => {
      setPhase("complete");
    }, 2000);

    // Phase 2: Complete -> Clearing (Wait 1.5s)
    const timer2 = setTimeout(() => {
      setPhase("clearing");
    }, 3500);

    // Phase 3: Clearing -> Finish (Animation time 0.8s)
    const timer3 = setTimeout(() => {
      onComplete();
    }, 4300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* 1. Clean Frosted Glass Background (Full Screen) */}
      <motion.div
        className="absolute inset-0 bg-white/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* 2. Content Container (Frameless - No Background/Border) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                {/* Subtle Pulse Ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -inset-6 bg-stone-400/20 rounded-full"
                />

                {/* Floating Icon (No Card Background) */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <BookOpen className="w-16 h-16 text-stone-700 drop-shadow-lg" />
                </motion.div>

                {/* Spinner Badge */}
                <div className="absolute -bottom-2 -right-2 bg-stone-800 rounded-full p-2 shadow-lg ring-4 ring-white/30">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-bold text-stone-800 mb-2 tracking-tight drop-shadow-sm">
                  개연성 분석 중
                </h3>
                <p className="text-lg text-stone-600 font-medium opacity-80">
                  잠시만 기다려주세요...
                </p>
              </div>
            </motion.div>
          )}

          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Success Icon Pop */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    delay: 0.1,
                    stiffness: 400,
                    damping: 15,
                  }}
                  className="bg-green-500 p-6 rounded-full shadow-2xl shadow-green-500/40 ring-4 ring-white/50"
                >
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </motion.div>

                {/* Confetti Pops */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [1, 0],
                      x: Math.cos((angle * Math.PI) / 180) * 60,
                      y: Math.sin((angle * Math.PI) / 180) * 60,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-400 rounded-full"
                  />
                ))}
              </div>

              <div className="text-center">
                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-bold text-stone-800 mb-3 tracking-tight drop-shadow-sm"
                >
                  분석 완료!
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/50 px-5 py-2 rounded-full border border-white/60 shadow-sm backdrop-blur-sm inline-block"
                >
                  <p className="text-base text-green-700 font-bold">
                    새로운 연결점을 찾았어요
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
