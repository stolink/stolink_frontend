// =====================================================
// 🎯 Relationship Deep Analysis Modal (Premium Dossier Edition)
// 캐릭터 관계 심층 분석 메인 모달 컴포넌트
// =====================================================

import { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";
import { CharacterPortraitPanel } from "./components/CharacterPortraitPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { RelationshipTimelineGraph } from "./components/RelationshipTimelineGraph";
import { RelationshipWarningBanner } from "./components/RelationshipWarningBanner";
import { SharedScenesPanel } from "./components/SharedScenesPanel";
import { DeepAnalysisHero } from "./components/DeepAnalysisHero";
import { MoodBackground } from "./components/MoodBackground";
import { X, Loader2 } from "lucide-react";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";

interface RelationshipDeepAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RelationshipDeepAnalysisData | null;
  onNavigateToEvent?: (eventId: string) => void;
}

export function RelationshipDeepAnalysisModal({
  isOpen,
  onClose,
  data,
  onNavigateToEvent,
}: RelationshipDeepAnalysisModalProps) {
  const [isShaderReady, setIsShaderReady] = useState(false);

  // Reset loading state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      startTransition(() => {
        setIsShaderReady(false);
      });
    }
  }, [isOpen, data?.sourceCharacter.id, data?.targetCharacter.id]);

  if (!data) return null;

  const {
    sourceCharacter,
    targetCharacter,
    sourceToTargetAttributes,
    targetToSourceAttributes,
    timeline,
    insights,
    relationshipTypes,
    asymmetricStrength,
    since,
    warnings,
    sharedScenes,
  } = data;

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
          <DialogPrimitive.Portal>
            {/* 1. Backdrop */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[150] bg-espresso-900/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </DialogPrimitive.Overlay>

            {/* 2. Modal Content (Full Screen Dossier) */}
            <DialogPrimitive.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-0 top-0 z-[151]",
                  "w-full h-full",
                  "flex items-center justify-center p-4 md:p-8",
                )}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Dossier Card */}
                <div className="relative w-full max-w-6xl h-full max-h-[92vh] bg-[#FAFAF8] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                  {/* Accessibility: DialogTitle is required by Radix for screen readers */}
                  <DialogPrimitive.Title className="sr-only">
                    {sourceCharacter.name}와 {targetCharacter.name}의 관계 심층
                    분석
                  </DialogPrimitive.Title>
                  {/* Fixed Close Button for the entire Dossier */}
                  <Button
                    intent="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-8 top-8 z-[100] rounded-full hover:bg-espresso-50 w-12 h-12 shadow-lg border border-espresso-200/30 bg-white/80 backdrop-blur-md transition-all active:scale-95"
                  >
                    <X className="w-6 h-6 text-espresso-900" />
                  </Button>

                  {/* Dynamic Mood Background (Absolute) */}
                  <MoodBackground
                    type={relationshipTypes}
                    // className="opacity-40" // Removed to allow vivid colors
                  />

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    {/* Hero Section - Now part of scroll */}
                    <DeepAnalysisHero
                      sourceCharacter={sourceCharacter}
                      targetCharacter={targetCharacter}
                      asymmetricStrength={asymmetricStrength}
                      relationshipTypes={relationshipTypes}
                      description={data.description}
                      onClose={onClose}
                      since={since}
                      onShaderReady={() => setIsShaderReady(true)}
                    />

                    <div className="p-8 pb-20 max-w-5xl mx-auto space-y-12">
                      {/* 1. WARNINGS */}
                      {warnings && warnings.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <RelationshipWarningBanner warnings={warnings} />
                        </motion.div>
                      )}

                      {/* 2. CHARACTER DYNAMICS (Side-by-Side Fusion) */}
                      <section>
                        <div className="flex items-center gap-4 mb-6">
                          <span className="h-px flex-1 bg-espresso-900/10" />
                          <h3 className="text-base font-bold text-espresso-400 uppercase tracking-[0.2em]">
                            Character Dynamics
                          </h3>
                          <span className="h-px flex-1 bg-espresso-900/10" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                          {/* Source Character */}
                          <motion.div
                            className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white/40 shadow-sm"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <CharacterPortraitPanel
                              character={sourceCharacter}
                              attributes={sourceToTargetAttributes}
                              targetName={targetCharacter.name}
                              position="left"
                              animationDelay={0.4}
                              className="h-full justify-center"
                            />
                          </motion.div>

                          {/* Target Character */}
                          <motion.div
                            className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white/40 shadow-sm"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <CharacterPortraitPanel
                              character={targetCharacter}
                              attributes={targetToSourceAttributes}
                              targetName={sourceCharacter.name}
                              position="right"
                              animationDelay={0.5}
                              className="h-full justify-center"
                            />
                          </motion.div>
                        </div>
                      </section>

                      {/* 3. NARRATIVE JOURNEY (Timeline) */}
                      <section>
                        <div className="flex items-center gap-4 mb-6">
                          <span className="h-px flex-1 bg-espresso-900/10" />
                          <h3 className="text-base font-bold text-espresso-400 uppercase tracking-[0.2em]">
                            Narrative Arc
                          </h3>
                          <span className="h-px flex-1 bg-espresso-900/10" />
                        </div>

                        <div className="space-y-8">
                          {/* Main Timeline Graph */}
                          <motion.div
                            className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-sm min-h-[350px]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <RelationshipTimelineGraph
                              data={timeline}
                              height={300}
                              animationDelay={0.7}
                            />
                          </motion.div>

                          {/* Decisive Events & Keywords Panel */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                          >
                            <InsightsPanel
                              insights={insights}
                              asymmetricStrength={asymmetricStrength}
                              animationDelay={0.8}
                              className="bg-white/60 backdrop-blur-sm border-white/40 h-full w-full"
                            />
                          </motion.div>
                        </div>
                      </section>

                      {/* 4. SHARED MOMENTS */}
                      {sharedScenes && sharedScenes.length > 0 && (
                        <section>
                          <div className="flex items-center gap-4 mb-6">
                            <span className="h-px flex-1 bg-espresso-900/10" />
                            <h3 className="text-base font-bold text-espresso-400 uppercase tracking-[0.2em]">
                              Shared Moments
                            </h3>
                            <span className="h-px flex-1 bg-espresso-900/10" />
                          </div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                          >
                            <SharedScenesPanel
                              scenes={sharedScenes}
                              onNavigate={onNavigateToEvent}
                              maxVisible={4}
                            />
                          </motion.div>
                        </section>
                      )}
                    </div>
                  </div>

                  {/* 3. Loading Overlay */}
                  <AnimatePresence>
                    {!isShaderReady && (
                      <motion.div
                        className="absolute inset-0 z-[200] bg-[#FAFAF8] flex flex-col items-center justify-center"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Loader2 className="w-12 h-12 text-mocha-500" />
                          </motion.div>
                          <div className="absolute inset-0 blur-xl bg-mocha-400/20 rounded-full animate-pulse" />
                        </div>
                        <motion.p
                          className="mt-6 text-sm font-serif font-bold text-espresso-400 tracking-[0.2em] uppercase"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Deep Analysis Discovering...
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}

export default RelationshipDeepAnalysisModal;
