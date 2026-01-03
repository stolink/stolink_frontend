import { useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  RotateCcw,
  Sparkles,
  Network,
  Quote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useChatStream,
  type SourceChunk,
  type ChatMessage,
} from "@/hooks/useChatStream";
import { motion, AnimatePresence } from "framer-motion";

interface AIAssistantPanelProps {
  projectId: string | null;
}

export default function AIAssistantPanel({ projectId }: AIAssistantPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    streaming,
    currentResponse,
    currentSources,
    sendMessage,
    cancelStream,
    resetSession,
  } = useChatStream({
    onError: (error) => {
      console.error("AI Chat error:", error);
    },
  });

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    if (!projectId) {
      console.warn("projectId가 없습니다.");
      return;
    }

    const message = input;
    setInput("");
    await sendMessage(message, projectId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFBF9] relative font-sans overflow-hidden">
      {/* Header with refined Identity */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-mocha-100/40 bg-white/60 backdrop-blur-md sticky top-0 z-20 shrink-0 shadow-sm">
        <div className="flex flex-col select-none cursor-default group">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold tracking-tight text-espresso-900 leading-none">
              Check
            </span>
            <span className="text-xs font-sans font-black tracking-[0.2em] text-mocha-400 uppercase leading-none opacity-80 group-hover:text-mocha-600 transition-colors">
              bot
            </span>
          </div>
          <div className="mt-1.5 h-[3px] w-6 bg-mocha-200 group-hover:w-10 transition-all duration-500 rounded-full" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetSession}
          className="h-9 w-9 text-mocha-300 hover:text-mocha-600 hover:bg-mocha-50 transition-all duration-300 rounded-xl"
          title="새 대화 시작"
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-thin scrollbar-thumb-mocha-100 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
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
                <div className="w-20 h-20 rounded-2xl bg-mocha-50 flex items-center justify-center relative z-10 shadow-paper">
                  <Sparkles className="h-8 w-8 text-mocha-500" />
                </div>
              </div>
              <h3 className="text-xl font-display text-espresso-900 mb-2">
                지적 여정을 시작하세요
              </h3>
              <p className="text-sm text-mocha-400 font-sans leading-relaxed">
                Check-Bot이 작품의 맥락을 연결하여
                <br />
                깊이 있는 답변을 드립니다.
              </p>
            </motion.div>
          ) : (
            <div key="message-list" className="space-y-10">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Streaming Response */}
              {streaming && currentResponse && (
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

              {/* Generative Loading State */}
              {streaming && !currentResponse && (
                <div className="flex flex-col gap-3 mr-auto items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-4 bg-mocha-100" />
                    <span className="text-[10px] font-sans font-black tracking-widest text-mocha-400 uppercase">
                      analyzing graph
                    </span>
                  </div>
                  <div className="bg-white border border-mocha-100/50 rounded-2xl p-6 shadow-paper">
                    <div className="flex gap-3 items-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-2 h-2 rounded-full bg-mocha-400"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3,
                        }}
                        className="w-2 h-2 rounded-full bg-mocha-300"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.6,
                        }}
                        className="w-2 h-2 rounded-full bg-mocha-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area - Marginalia Style */}
      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-[#FBFBF9] via-[#FBFBF9] to-transparent">
        <div className="relative group transition-all duration-300">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              projectId ? "무엇을 물어볼까요?" : "프로젝트를 선택해주세요"
            }
            disabled={streaming || !projectId}
            className="min-h-[64px] max-h-[160px] w-full resize-none border-mocha-200/60 bg-white/80 p-5 pr-14 text-[0.95rem] rounded-2xl shadow-paper focus:ring-2 focus:ring-mocha-100 focus:border-mocha-300 backdrop-blur-sm transition-all placeholder:text-mocha-300/80 font-serif italic"
            rows={1}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />
          <div className="absolute right-3 bottom-3">
            {streaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={cancelStream}
                className="h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300"
              >
                <Square className="h-4.5 w-4.5 fill-current animate-pulse" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || !projectId}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-500 flex items-center justify-center border",
                  input.trim()
                    ? "bg-espresso-900 border-espresso-900 text-white shadow-lg shadow-espresso-900/10 hover:bg-black"
                    : "bg-white border-mocha-100 text-mocha-200",
                )}
              >
                <Send
                  className={cn(
                    "h-4.5 w-4.5 transition-transform duration-300",
                    input.trim() && "translate-x-0.5 -translate-y-0.5",
                  )}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Message Bubble component with Serif/Sans pairing
 */
function MessageBubble({ message }: { message: ChatMessage }) {
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
        <div className="whitespace-pre-wrap">{message.content}</div>

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
                key={source.chunk_uuid}
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
                    {source.metadata?.document_title || "Untitled Fragment"}
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
