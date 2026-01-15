import { useState, useRef, useEffect } from "react";
import {
  RotateCcw,
  Sparkles,
  Network,
  CheckCircle2,
  Quote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/utils/imageUtils";
import {
  useChatStream,
  type SourceChunk,
  type ChatMessage,
} from "@/hooks/useChatStream";
import { motion, AnimatePresence } from "framer-motion";

import { useUIStore } from "@/stores/useUIStore";
import { useCharacters } from "@/hooks/useCharacters";
import { useProjectEvents } from "@/hooks/useEvents";
import { AIChatInput, type AIChatInputRef } from "./AIChatInput";

import type { ConsistencyReport } from "@/types/analysisResult";
import type { Character } from "@/types/character";

interface AIAssistantPanelProps {
  projectId: string | null;
  consistencyReport?: ConsistencyReport | null;
}

export default function AIAssistantPanel({
  projectId,
  consistencyReport,
}: AIAssistantPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<AIChatInputRef>(null);
  const {
    messages,
    streaming,
    analyzing,
    analysisComplete,
    currentResponse,
    currentSources,
    sendMessage,
    cancelStream,
    resetSession,
    loadHistory,
    clearAnalysisComplete,
    loadHistory,
  } = useChatStream({
    onError: (error) => {
      console.error("AI Chat error:", error);
    },
  });

  // 초기 히스토리 로드
  useEffect(() => {
    if (projectId) {
      loadHistory(projectId);
    }
  }, [projectId, loadHistory]);

  // 분석 완료 애니메이션 표시 상태
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);

  // 분석 완료 시 애니메이션 트리거
  useEffect(() => {
    if (analysisComplete) {
      // eslint-disable-next-line
      setShowCompleteAnimation(true);
      // 0.8초 후 애니메이션 숨기고 응답 표시
      const timer = setTimeout(() => {
        setShowCompleteAnimation(false);
        clearAnalysisComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [analysisComplete, clearAnalysisComplete]);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  // InsightsPanel 등에서 넘어온 자동 발송 메시지 처리
  const pendingMessage = useUIStore((state) => state.pendingAIChatMessage);
  const setPendingMessage = useUIStore(
    (state) => state.setPendingAIChatMessage,
  );

  useEffect(() => {
    if (!pendingMessage || streaming) {
      return;
    }

    // Attempt to set input. We use a short delay to ensure editor is hydrated.
    const timer = setTimeout(() => {
      if (chatInputRef.current) {
        const success = chatInputRef.current.setInput(pendingMessage);
        if (success) {
          setPendingMessage(null);
          chatInputRef.current.focus();
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pendingMessage, streaming, setPendingMessage]);

  const handleSend = async (
    message: string,
    contextData: Record<string, unknown>,
  ) => {
    if (!message.trim() || streaming) return;

    if (!projectId) {
      console.warn("projectId가 없습니다.");
      return;
    }

    await sendMessage(message, projectId, contextData);
  };

  // Tag Suggestion Data Sources
  const { data: characters } = useCharacters(projectId ?? "");
  const { data: events } = useProjectEvents(projectId);

  return (
    <div className="flex flex-col h-full bg-cloud-50/30 relative overflow-hidden">
      {/* Header with refined Identity */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-mocha-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 box-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-mocha-100 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-mocha-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-espresso-900">Check-Bot</h3>
          </div>
        </div>
        <Button
          intent="ghost"
          size="icon"
          onClick={() => resetSession(projectId ?? undefined)}
          className="h-8 w-8 text-mocha-300 hover:text-mocha-600 hover:bg-mocha-50 transition-all duration-300 rounded-lg"
          title="새 대화 시작"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-thin scrollbar-thumb-mocha-100 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {messages.length === 0 && !streaming ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 opacity-10"
                >
                  <Network className="w-24 h-24 text-mocha-400" />
                </motion.div>
                <div className="w-20 h-20 rounded-2xl bg-mocha-50/30 backdrop-blur-md flex items-center justify-center relative z-10 shadow-paper border border-white/40">
                  <Sparkles className="h-8 w-8 text-mocha-500/80" />
                </div>
              </div>
              <h3 className="text-xl font-display text-espresso-900 mb-2">
                지적 여정을 시작하세요
              </h3>
              <p className="text-sm text-mocha-400 font-sans max-w-[240px] leading-relaxed">
                GraphRAG 기반의 Check-Bot이 책의 방대한 맥락을 연결하여
                답해드립니다.
              </p>
            </motion.div>
          ) : (
            <div key="message-list" className="space-y-10">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  characters={characters || []}
                />
              ))}

              {/* 토스 스타일 분석 완료 애니메이션 */}
              <AnimatePresence>
                {showCompleteAnimation && (
                  <motion.div
                    key="analysis-complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="flex flex-col items-center justify-center py-12 relative"
                  >
                    {/* 배경 글로우 효과 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div
                        className="w-40 h-40 rounded-full blur-3xl"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(var(--sage-200), 0.5) 0%, rgba(var(--sage-100), 0.2) 50%, transparent 100%)",
                        }}
                      />
                    </motion.div>

                    {/* 파티클 효과 */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.3],
                          x: Math.cos((i * Math.PI * 2) / 8) * 55,
                          y: Math.sin((i * Math.PI * 2) / 8) * 55,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: 0.12 + i * 0.025,
                          ease: "easeOut",
                        }}
                        className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-sage-400 to-sage-500"
                        style={{
                          left: "50%",
                          top: "45%",
                          marginLeft: -4,
                          marginTop: -4,
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
                      {/* 외곽 링 펄스 1 */}
                      <motion.div
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{ scale: 1.8, opacity: [0, 0.5, 0] }}
                        transition={{
                          duration: 0.45,
                          delay: 0.12,
                          ease: "easeOut",
                        }}
                        className="absolute inset-0 rounded-full border-2 border-sage-300"
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
                        className="absolute inset-0 rounded-full border border-sage-200"
                      />

                      {/* 메인 아이콘 */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 16,
                        }}
                        className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-sage-50 via-sage-100 to-sage-200 flex items-center justify-center shadow-xl border border-sage-200/60"
                      >
                        <CheckCircle2
                          className="w-9 h-9 text-sage-600"
                          strokeWidth={2.5}
                        />
                      </motion.div>
                    </motion.div>

                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.28,
                        duration: 0.22,
                        ease: "easeOut",
                      }}
                      className="mt-5 text-sm font-semibold text-sage-700 tracking-wide"
                    >
                      분석 완료
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streaming Response - 완료 애니메이션 후 표시 */}
              {streaming && currentResponse && !showCompleteAnimation && (
                <div className="flex flex-col gap-3 mr-auto items-start max-w-[95%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-4 bg-mocha-100" />
                    <span className="text-[10px] font-sans font-black tracking-widest text-mocha-400 uppercase">
                      check-bot
                    </span>
                  </div>
                  <div className="bg-white border border-mocha-100/50 text-espresso-900 rounded-2xl shadow-paper p-5 w-full">
                    <div className="text-[0.95rem] leading-[1.8] font-sans font-normal tracking-normal whitespace-pre-wrap">
                      {currentResponse}
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-1.5 h-4 bg-mocha-400 align-middle ml-1 rounded-sm"
                      />
                    </div>
                    {currentSources.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-mocha-100/30">
                        <SourceList sources={currentSources} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generative Loading State - 프리미엄 분석 중 애니메이션 */}
              {streaming && analyzing && !showCompleteAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-10 relative"
                >
                  {/* 배경 글로우 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0,
                      }}
                      className="w-36 h-36 rounded-full blur-2xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(166, 140, 114, 0.4) 0%, rgba(166, 140, 114, 0.2) 50%, transparent 100%)",
                      }}
                    />
                  </div>

                  {/* 메인 로딩 오브 */}
                  <div className="relative w-20 h-20">
                    {/* 중심 오브 */}
                    <motion.div
                      animate={{
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 0 20px rgba(0, 0, 0, 0.05)",
                          "0 0 30px rgba(0, 0, 0, 0.1)",
                          "0 0 20px rgba(0, 0, 0, 0.05)",
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-4 rounded-full bg-gradient-to-br from-mocha-50 via-white to-mocha-100 flex items-center justify-center shadow-lg border border-mocha-100/50"
                    >
                      <Network className="w-5 h-5 text-mocha-500" />
                    </motion.div>

                    {/* 외곽 회전 링 */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-mocha-200/60"
                    />

                    {/* 두 번째 회전 링 (반대 방향) */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-2 rounded-full border border-mocha-300/40"
                    />

                    {/* 궤도 위 도트들 */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.8,
                        }}
                        className="absolute inset-0"
                        style={{ transformOrigin: "center center" }}
                      >
                        <motion.div
                          animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.4,
                          }}
                          className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-mocha-400 to-mocha-500"
                          style={{
                            top: -4,
                            left: "50%",
                            marginLeft: -4,
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* 텍스트 레이블 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-semibold text-mocha-500 tracking-wide">
                      그래프 분석 중
                    </span>
                    <motion.div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.span
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="text-mocha-400"
                        >
                          •
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area - Marginalia Style */}
      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-cloud-50 via-cloud-50 to-transparent">
        <AIChatInput
          ref={chatInputRef}
          projectId={projectId}
          characters={characters}
          events={events}
          consistencyReport={consistencyReport || null}
          onSend={handleSend}
          streaming={streaming}
          onCancel={cancelStream}
          placeholder={
            projectId
              ? "Check-Bot에게 무엇을 물어볼까요?"
              : "프로젝트를 선택해주세요"
          }
          disabled={streaming || !projectId}
        />
      </div>
    </div>
  );
}

/**
 * Message Bubble component with Serif/Sans pairing
 */
function MessageBubble({
  message,
  characters = [],
}: {
  message: ChatMessage;
  characters?: Character[];
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-3 w-full",
        isUser ? "items-end" : "items-start",
      )}
    >
      {/* Label */}
      <div
        className={cn(
          "flex items-center gap-2 mb-1",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div className="h-px w-4 bg-mocha-100" />
        <span className="text-[10px] font-sans font-black tracking-widest text-mocha-400 uppercase text-opacity-80">
          {isUser ? "Reader's Thought" : "Check-bot"}
        </span>
      </div>

      <div
        className={cn(
          "max-w-[95%] p-5 transition-all duration-300 relative",
          isUser
            ? "text-espresso-800 font-serif italic text-lg leading-relaxed bg-mocha-50/30 rounded-2xl rounded-tr-none border border-mocha-100/30"
            : "text-espresso-900 font-sans leading-[1.8] bg-white rounded-2xl rounded-tl-none border border-mocha-100/50 shadow-paper",
        )}
      >
        {!isUser && (
          <div className="absolute -left-1 -top-1">
            <Quote className="w-4 h-4 text-mocha-100 opacity-50" />
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {(() => {
            // Parse and style tags: [#Conflict], [@Character], [!Event]
            const parts = message.content.split(
              /(\[#[^\]]+\]|\[@[^\]]+\]|\[![^\]]+\])/g,
            );
            return parts.map((part, index) => {
              if (part.startsWith("[#") && part.endsWith("]")) {
                const label = part.slice(2, -1);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-3.5 py-1.5 mx-1 text-[15px] font-black tracking-wide text-rose-700 bg-gradient-to-br from-rose-50/90 via-white/60 to-rose-50/20 border-2 border-rose-200/60 rounded-full shadow-sm backdrop-blur-md align-middle hover:shadow-md hover:scale-105 transition-all cursor-default"
                  >
                    #{label}
                  </span>
                );
              }
              if (part.startsWith("[@") && part.endsWith("]")) {
                const label = part.slice(2, -1);
                const char = characters.find(
                  (c) => c.profile?.name === label, // Simplified check
                );
                const imageUrl = char?.imageUrl;

                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 mx-1 text-[15px] font-black tracking-wide text-sage-700 bg-gradient-to-br from-sage-50/90 via-white/60 to-sage-50/20 border-2 border-sage-200/60 rounded-full shadow-sm backdrop-blur-md align-middle hover:shadow-md hover:scale-105 transition-all cursor-default"
                  >
                    {imageUrl && (
                      <img
                        src={resolveImageUrl(imageUrl)}
                        alt={label}
                        className="w-5 h-5 rounded-full object-cover border border-sage-200/50 -ml-1"
                      />
                    )}
                    @{label}
                  </span>
                );
              }
              if (part.startsWith("[!") && part.endsWith("]")) {
                const label = part.slice(2, -1);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-3.5 py-1.5 mx-1 text-[15px] font-black tracking-wide text-mocha-700 bg-gradient-to-br from-mocha-50/90 via-white/60 to-mocha-50/20 border-2 border-mocha-200/60 rounded-full shadow-sm backdrop-blur-md align-middle hover:shadow-md hover:scale-105 transition-all cursor-default"
                  >
                    !{label}
                  </span>
                );
              }
              return part;
            });
          })()}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-mocha-100/30">
            <SourceList sources={message.sources} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * RAG Source List with structural connectivity
 */
function SourceList({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="font-sans">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-3 text-[11px] font-bold text-mocha-400 hover:text-mocha-600 transition-colors"
      >
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-mocha-50/50 group-hover:bg-mocha-100/50 transition-colors">
          <Network className="h-3 w-3" />
        </div>
        <span className="uppercase tracking-[0.1em]">
          {sources.length} Connected Contexts
        </span>
        <div className="flex-1 h-px bg-mocha-50" />
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 space-y-6 overflow-hidden pl-2"
          >
            {sources.map((source, idx) => (
              <div
                key={source.chunkUuid}
                className="relative pl-6 group/source"
              >
                {/* Vertical Line */}
                <div className="absolute left-[7.5px] top-[14px] bottom-[-24px] w-px bg-mocha-100 last:bottom-0 group-last/source:hidden" />
                {/* Node */}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full border border-mocha-100 bg-white flex items-center justify-center z-10 shadow-sm transition-transform group-hover/source:scale-110">
                  <div className="w-1.5 h-1.5 rounded-full bg-mocha-400 group-hover/source:bg-sage-600 transition-colors" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-mocha-300 uppercase tracking-tighter">
                    Source {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-espresso-800 leading-tight">
                    {source.metadata?.documentTitle || "Untitled Fragment"}
                  </span>
                  <div className="p-3 rounded-xl bg-[#FBFBF9] border border-mocha-100/20 text-[12px] text-espresso-600/90 leading-relaxed italic">
                    "{source.content}"
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
