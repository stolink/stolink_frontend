import { useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  RotateCcw,
  BookOpen,
  Network,
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
    <div className="flex flex-col h-full bg-cloud-50 relative font-sans overflow-hidden">
      {/* Iconic Header - Mocha Palette */}
      <div className="relative px-5 py-4 border-b border-mocha-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        {/* Decorative accent line - Mocha gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-mocha-400 via-mocha-500 to-mocha-400" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 select-none group">
            {/* Iconic Logo - Mocha colors */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mocha-500 to-mocha-700 flex items-center justify-center shadow-lg shadow-mocha-500/20 group-hover:shadow-mocha-500/30 transition-shadow">
                <BookOpen className="h-5 w-5 text-white/90" />
              </div>
              {/* Pulse indicator - Mocha accent */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-mocha-400 rounded-full border-2 border-white flex items-center justify-center"
              >
                <Network className="h-2 w-2 text-white" />
              </motion.div>
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-black tracking-tight text-espresso-900">
                  Check
                </span>
                <span className="text-lg font-light text-mocha-500">Bot</span>
              </div>
              <span className="text-[10px] font-bold text-mocha-400 tracking-[0.12em] uppercase">
                Story Context Engine
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={resetSession}
            className="h-9 w-9 text-mocha-400 hover:text-mocha-600 hover:bg-mocha-100/60 transition-all rounded-xl"
            title="새 대화 시작"
          >
            <RotateCcw className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 scrollbar-thin scrollbar-thumb-mocha-200 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full text-center px-4"
            >
              {/* Decorative Book Illustration - Mocha colors */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 relative"
                >
                  {/* Book cover - Mocha gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-mocha-500 to-mocha-700 rounded-xl shadow-xl shadow-mocha-500/20" />
                  {/* Book spine highlight */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-mocha-400 to-transparent rounded-l-xl" />
                  {/* Pages */}
                  <div className="absolute left-4 top-2 right-2 bottom-2 bg-cloud-50 rounded-r-lg overflow-hidden">
                    {/* Graph visualization on pages */}
                    <svg className="w-full h-full" viewBox="0 0 60 60">
                      {/* Animated connection lines */}
                      <motion.path
                        d="M20 30 L40 20 M20 30 L45 35 M20 30 L35 48"
                        stroke="#A47764"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        animate={{
                          pathLength: [0, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      {/* Central node - Mocha 700 */}
                      <motion.circle
                        cx="20"
                        cy="30"
                        r="4"
                        fill="#7D5A4B"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {/* Connected nodes - Mocha 400 */}
                      <circle cx="40" cy="20" r="2.5" fill="#BD9B8D" />
                      <circle cx="45" cy="35" r="2.5" fill="#BD9B8D" />
                      <circle cx="35" cy="48" r="2.5" fill="#BD9B8D" />
                    </svg>
                  </div>
                </motion.div>

                {/* Floating particles - Mocha colors */}
                <motion.div
                  animate={{ y: [-5, 5, -5], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-2 h-2 bg-mocha-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [5, -5, 5], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-0 -left-3 w-1.5 h-1.5 bg-mocha-500 rounded-full"
                />
              </div>

              <h3 className="text-xl font-bold text-espresso-900 mb-2 tracking-tight">
                무엇이 궁금하신가요?
              </h3>
              <p className="text-sm text-mocha-500 max-w-[220px] leading-relaxed">
                이야기의 조각들을{" "}
                <span className="font-semibold text-mocha-600">입체적으로</span>{" "}
                연결하여 답변합니다
              </p>
            </motion.div>
          ) : (
            <div key="message-list" className="space-y-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Streaming Response */}
              {streaming && currentResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <span className="text-[10px] font-bold text-mocha-400 uppercase tracking-wider ml-1">
                    Check-Bot
                  </span>
                  <div className="bg-white border border-mocha-200/60 text-espresso-900 rounded-2xl rounded-tl-md p-4 shadow-sm">
                    <div className="text-sm leading-[1.65] whitespace-pre-wrap">
                      {currentResponse}
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-mocha-500 ml-0.5 rounded-full align-middle"
                      />
                    </div>
                    {currentSources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-mocha-100">
                        <SourceList sources={currentSources} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {streaming && !currentResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-1.5"
                >
                  <span className="text-[10px] font-bold text-mocha-400 uppercase tracking-wider ml-1">
                    신중하게 생각 중
                  </span>
                  <div className="bg-white border border-mocha-200/60 rounded-2xl rounded-tl-md p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4"
                      >
                        <Network className="w-4 h-4 text-mocha-400" />
                      </motion.div>
                      <span className="text-sm text-mocha-500">
                        문맥의 연결 고리를 찾는 중...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="px-5 pb-5 pt-3 bg-gradient-to-t from-white via-white/90 to-transparent">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              projectId ? "질문을 입력하세요..." : "프로젝트를 선택해주세요"
            }
            disabled={streaming || !projectId}
            className="min-h-[48px] max-h-[120px] w-full resize-none border-mocha-200 bg-white p-4 pr-14 text-sm leading-relaxed rounded-2xl shadow-sm focus:ring-2 focus:ring-mocha-300/30 focus:border-mocha-400 transition-all placeholder:text-mocha-300"
            rows={1}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          />
          <div className="absolute right-3 bottom-3">
            {streaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={cancelStream}
                className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || !projectId}
                initial={false}
                animate={{
                  backgroundColor: input.trim() ? "#A47764" : "#F1F0EC",
                  scale: input.trim() ? 1 : 0.95,
                }}
                whileHover={input.trim() ? { scale: 1.05 } : {}}
                whileTap={input.trim() ? { scale: 0.95 } : {}}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-shadow",
                  input.trim()
                    ? "text-white shadow-md shadow-mocha-500/20"
                    : "text-mocha-300 pointer-events-none",
                )}
              >
                <Send
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    input.trim() ? "translate-x-0.5 -translate-y-0.5" : "",
                  )}
                />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Message Bubble - Warm & Soft Design (Mocha Palette)
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-1.5",
        isUser ? "items-end" : "items-start",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          isUser ? "text-mocha-400 mr-1" : "text-mocha-400 ml-1",
        )}
      >
        {isUser ? "나" : "Check-Bot"}
      </span>

      <div
        className={cn(
          "max-w-[90%] p-4 transition-all rounded-2xl",
          isUser
            ? "bg-gradient-to-br from-mocha-600 to-mocha-700 text-white/95 rounded-tr-md shadow-md"
            : "bg-white border border-mocha-200/60 text-espresso-900 rounded-tl-md shadow-sm",
        )}
      >
        <div className="text-sm leading-[1.65] whitespace-pre-wrap">
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-mocha-100">
            <SourceList sources={message.sources} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Source List - Mocha Styled
 */
function SourceList({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-2 text-[10px] font-bold text-mocha-500 hover:text-mocha-600 transition-colors"
      >
        <div className="p-1 rounded-md bg-mocha-100/60 group-hover:bg-mocha-200/60 transition-colors">
          <Network className="h-3 w-3" />
        </div>
        <span className="uppercase tracking-wider">
          {sources.length}개의 참고한 장면
        </span>
        <div className="flex-1 h-px bg-mocha-100" />
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-mocha-400" />
        ) : (
          <ChevronDown className="h-3 w-3 text-mocha-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            {sources.map((source, idx) => (
              <div
                key={source.chunk_uuid}
                className="relative pl-5 group/source"
              >
                <div className="absolute left-[6px] top-3 bottom-0 w-px bg-mocha-200 group-last/source:hidden" />
                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-mocha-100 border border-mocha-300 flex items-center justify-center group-hover/source:bg-mocha-200 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-mocha-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-mocha-500">
                    {source.metadata?.document_title || "문서"} · 출처 {idx + 1}
                  </span>
                  <div className="p-2.5 rounded-lg bg-cloud-50 text-xs text-espresso-700 leading-relaxed border border-mocha-100/50">
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
