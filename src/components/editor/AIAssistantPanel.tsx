import { useState, useRef, useEffect } from "react";
import { Send, Bot, Square, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChatStream, type SourceChunk } from "@/hooks/useChatStream";

interface AIAssistantPanelProps {
  projectId?: string | null;
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
    <div className="flex flex-col h-full">
      {/* Header with clear button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs text-muted-foreground">AI 어시스턴트</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSession}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          title="대화 초기화"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.role === "user" ? "flex-row-reverse" : "",
            )}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-mocha-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-mocha-600" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                message.role === "user"
                  ? "bg-mocha-500 text-white"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* 출처 표시 */}
              {message.sources && message.sources.length > 0 && (
                <SourceList sources={message.sources} />
              )}
            </div>
          </div>
        ))}

        {/* Streaming Response */}
        {streaming && currentResponse && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-mocha-100 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-mocha-600" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2 text-sm max-w-[85%]">
              <p className="whitespace-pre-wrap">
                {currentResponse}
                <span className="inline-block w-2 h-4 bg-mocha-500 animate-pulse ml-0.5" />
              </p>

              {/* 스트리밍 중 출처 표시 */}
              {currentSources.length > 0 && (
                <SourceList sources={currentSources} />
              )}
            </div>
          </div>
        )}

        {/* Loading indicator (before response starts) */}
        {streaming && !currentResponse && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-mocha-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-mocha-600" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-mocha-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-mocha-400 animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 rounded-full bg-mocha-400 animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex flex-col gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              projectId
                ? "작품에 대해 질문하세요... (Shift+Enter: 줄바꿈)"
                : "프로젝트를 선택해주세요"
            }
            disabled={streaming || !projectId}
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            {streaming ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={cancelStream}
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                중지
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || !projectId}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                전송
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * RAG 검색 출처 목록 컴포넌트
 */
function SourceList({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState(false);
  const displaySources = expanded ? sources : sources.slice(0, 2);

  return (
    <div className="mt-3 pt-2 border-t border-mocha-200/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-mocha-600 font-medium mb-1.5 hover:text-mocha-700 flex items-center gap-1"
      >
        <FileText className="h-3 w-3" />
        참고한 내용 ({sources.length}개)
        {sources.length > 2 && (
          <span className="text-mocha-400">
            {expanded ? "접기" : `외 ${sources.length - 2}개`}
          </span>
        )}
      </button>
      <div className="space-y-1.5">
        {displaySources.map((source, idx) => (
          <div
            key={source.chunk_uuid}
            className="text-[10px] text-espresso-700 bg-cloud-50 rounded px-2 py-1.5"
          >
            <div className="flex items-start gap-1.5">
              <span className="text-mocha-500 font-medium shrink-0">
                [{idx + 1}]
              </span>
              <span className="line-clamp-2">{source.content}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-mocha-400">
              {source.metadata?.document_title && (
                <span className="truncate max-w-[120px]">
                  {source.metadata.document_title}
                </span>
              )}
              <span>관련도: {(source.similarity_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
