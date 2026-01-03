import { useState, useRef, useEffect } from "react";
import { Send, Bot, Square, Trash2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChatStream, type SourceChunk } from "@/hooks/useChatStream";
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
    <div className="flex flex-col h-full bg-cloud-50 relative font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mocha-100/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex flex-col select-none cursor-default py-1">
            <span className="text-xl font-serif font-bold tracking-tight text-espresso-900 leading-tight">
              Check
            </span>
            <div className="flex items-center gap-2 ml-0.5 -mt-0.5">
              <div className="h-[1px] w-3 bg-mocha-200" />
              <span className="text-[9px] font-sans font-black tracking-[0.3em] text-mocha-400 uppercase leading-none">
                bot
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetSession}
          className="h-8 w-8 text-mocha-300 hover:text-mocha-600 hover:bg-mocha-50/50 transition-colors"
          title="대화 초기화"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full text-center p-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-16 h-16 rounded-full bg-mocha-100/40 flex items-center justify-center mb-6 relative"
              >
                <div className="absolute inset-0 rounded-full border border-mocha-200/30 animate-ping [animation-duration:4s]" />
                <Sparkles className="h-6 w-6 text-mocha-400" />
              </motion.div>
              <motion.p
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-base text-espresso-900 font-sans font-medium tracking-tight mb-2"
              >
                무엇이 궁금하신가요?
              </motion.p>
              <p className="text-xs text-mocha-400/80 font-sans tracking-tight">
                작품의 세계관, 인물, 스토리에 대해 자유롭게 대화하세요.
              </p>
            </motion.div>
          ) : (
            <div key="message-list" className="space-y-6">
              {messages.map((message) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[92%]",
                    message.role === "user"
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  {/* Role Header (Assistant only) */}
                  {message.role === "assistant" && (
                    <span className="text-[10px] font-sans tracking-widest text-mocha-400 ml-1 mb-0.5 font-bold uppercase">
                      check-bot
                    </span>
                  )}

                  <div
                    className={cn(
                      "px-4 py-3 text-[0.93rem] leading-7 shadow-sm transition-all",
                      message.role === "user"
                        ? "bg-mocha-600 text-white rounded-2xl rounded-tr-sm shadow-mocha-900/10"
                        : "bg-white border border-mocha-100/60 text-espresso-900 rounded-2xl rounded-tl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap font-sans font-normal tracking-wide">
                      {message.content}
                    </p>

                    {/* Citations inside bubble */}
                    {message.role === "assistant" &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <SourceList sources={message.sources} />
                      )}
                  </div>
                </motion.div>
              ))}

              {/* Streaming Response */}
              {streaming && (
                <div className="flex flex-col gap-1 max-w-[92%] mr-auto items-start">
                  <span className="text-[10px] font-sans tracking-widest text-mocha-400 ml-1 mb-0.5 font-bold uppercase">
                    check-bot
                  </span>
                  <div className="bg-white border border-mocha-100/60 text-espresso-900 rounded-2xl rounded-tl-sm px-4 py-3 text-[0.93rem] leading-7 shadow-sm">
                    <p className="whitespace-pre-wrap font-sans font-normal tracking-wide">
                      {currentResponse}
                      <span className="inline-block w-1.5 h-4 bg-mocha-500 align-middle ml-1 animate-pulse rounded-sm" />
                    </p>

                    {currentSources.length > 0 && (
                      <SourceList sources={currentSources} />
                    )}
                  </div>
                </div>
              )}

              {/* Loading (Thinking) */}
              {streaming && !currentResponse && (
                <div className="flex flex-col gap-1 max-w-[92%] mr-auto items-start">
                  <span className="text-[10px] font-sans tracking-widest text-mocha-400 ml-1 mb-0.5 font-bold uppercase">
                    check-bot
                  </span>
                  <div className="bg-white border border-mocha-100/60 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm">
                    <div className="flex gap-2 items-center h-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-mocha-200 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-mocha-200 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-mocha-200 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pt-0">
        <div className="relative group transition-all">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              projectId ? "작품에 대해 질문하세요" : "프로젝트를 선택해주세요"
            }
            disabled={streaming || !projectId}
            className="min-h-[56px] max-h-[160px] w-full resize-none border border-mocha-100/80 bg-white p-4 pr-12 text-[0.93rem] rounded-xl shadow-sm focus:ring-1 focus:ring-mocha-300 focus:border-mocha-300 transition-all placeholder:text-mocha-300/60 font-sans"
            rows={1}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />
          <div className="absolute right-2 bottom-2">
            {streaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={cancelStream}
                className="h-10 w-10 text-mocha-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || !projectId}
                className={cn(
                  "h-9 w-9 rounded-lg transition-all duration-300 flex items-center justify-center",
                  input.trim()
                    ? "bg-mocha-600 text-white shadow-mocha-500/20 shadow-lg hover:bg-mocha-700"
                    : "bg-mocha-50 text-mocha-200 border-mocha-100/50"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RAG 검색 출처 목록 컴포넌트 (Perplexity Style / Accordion)
 */
function SourceList({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-mocha-100/50 font-sans">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[11px] bg-mocha-50/50 hover:bg-mocha-100/50 text-mocha-700 font-medium px-2.5 py-1.5 rounded-md transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-mocha-500" />
          <span>{sources.length}개의 문서를 참조함</span>
        </div>
        <div className="text-mocha-400 group-hover:text-mocha-600 font-normal">
          {expanded ? "접기" : "펼치기"}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            {sources.map((source, idx) => (
              <div
                key={source.chunk_uuid}
                className="group flex flex-col gap-1 text-[11px] bg-cloud-50/80 border border-mocha-100/40 rounded-lg p-2.5 hover:bg-white hover:border-mocha-200/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-mocha-100 text-[9px] font-bold text-mocha-600 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-espresso-800 truncate">
                    {source.metadata?.document_title || "제목 없는 문서"}
                  </span>
                </div>

                <div className="pl-6 text-espresso-600 leading-relaxed line-clamp-2">
                  "{source.content}"
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
