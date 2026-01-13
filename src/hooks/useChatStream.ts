import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores";

const CHAT_API_URL = "/ai-api";

/**
 * RAG 검색 결과 소스 청크
 */
export interface SourceChunk {
  chunkUuid: string;
  content: string;
  similarityScore: number;
  metadata?: {
    documentId?: string;
    documentTitle?: string;
    chapter?: string;
  };
}

/**
 * 관계 카드 데이터 (Neo4j CharacterRelationship 기반)
 */
export interface RelationshipCardData {
  sourceCharacter: { id: string; name: string };
  targetCharacter: { id: string; name: string };
  types: string[]; // ["enemy", "rival"] - 복수 관계 타입
  strength: number; // 1-10
  description?: string;
  bidirectional?: boolean;
  since?: string;
}

/**
 * 컨텍스트 카드 (향후 EventCard, CharacterCard 확장 가능)
 */
export interface ContextCard {
  cardType: "relationship" | "event" | "character";
  data: RelationshipCardData;
  actionUrl: string;
}

/**
 * SSE 스트림 토큰 타입
 */
interface StreamToken {
  type: "token" | "sources" | "cards" | "done" | "error";
  content?: string;
  sources?: SourceChunk[];
  cards?: ContextCard[];
  error?: string;
}

/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  cards?: ContextCard[];
  timestamp: Date;
}

interface UseChatStreamOptions {
  onError?: (error: string) => void;
}

/**
 * SSE 스트리밍 기반 AI 채팅 hook
 *
 * @example
 * ```tsx
 * const { messages, streaming, sendMessage } = useChatStream({ projectId });
 *
 * const handleSubmit = () => {
 *   sendMessage("주인공의 성격에 대해 알려줘");
 * };
 * ```
 */
export function useChatStream(options?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [currentSources, setCurrentSources] = useState<SourceChunk[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentCards, setCurrentCards] = useState<ContextCard[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, projectId: string) => {
      if (!message.trim() || streaming) return;

      const { user } = useAuthStore.getState();
      const userId = user?.id;

      if (!userId) {
        options?.onError?.("로그인이 필요합니다.");
        return;
      }

      // 세션 ID 결정: userId-projectId 조합 (프로젝트 단위 고정)
      const currentSessionId = sessionId ?? `${userId}-${projectId}`;
      if (!sessionId) {
        setSessionId(currentSessionId);
      }

      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 스트리밍 상태 초기화
      setStreaming(true);
      setAnalyzing(true);
      setAnalysisComplete(false);
      setCurrentResponse("");
      setCurrentSources([]);
      setCurrentCards([]);

      // AbortController 생성
      abortControllerRef.current = new AbortController();

      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        };

        // Corrected path from /ai/chat/stream to /chat/stream as per guide
        const response = await fetch(`${CHAT_API_URL}/chat/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message,
            project_id: projectId,
            user_id: userId,
            session_id: currentSessionId,
          }),
          signal: abortControllerRef.current.signal,
          credentials: "include", // 쿠키 자동 전송
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("스트림을 읽을 수 없습니다.");
        }

        const decoder = new TextDecoder();
        let accumulatedResponse = "";
        let sources: SourceChunk[] = [];
        let cards: ContextCard[] = [];
        let isFirstToken = true; // 로컬 플래그로 첫 토큰 감지

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamToken;

                if (data.type === "token" && data.content) {
                  // 첫 토큰 도착 = 분석 완료
                  if (isFirstToken) {
                    isFirstToken = false;
                    setAnalyzing(false);
                    setAnalysisComplete(true);
                  }
                  accumulatedResponse += data.content;
                  setCurrentResponse(accumulatedResponse);
                } else if (data.type === "sources" && data.sources) {
                  sources = data.sources;
                  setCurrentSources(sources);
                } else if (data.type === "cards" && data.cards) {
                  cards = data.cards;
                  setCurrentCards(cards);
                } else if (data.type === "done") {
                  // 스트리밍 완료 - AI 메시지 추가
                  const aiMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: accumulatedResponse,
                    sources,
                    cards,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, aiMessage]);
                  setStreaming(false);
                  setCurrentResponse("");
                  setCurrentSources([]);
                  setCurrentCards([]);
                } else if (data.type === "error") {
                  throw new Error(
                    data.error || "알 수 없는 오류가 발생했습니다.",
                  );
                }
              } catch (parseError) {
                // JSON 파싱 실패 시 무시 (불완전한 청크일 수 있음)
                if (parseError instanceof SyntaxError) {
                  continue;
                }
                throw parseError;
              }
            }
          }
        }

        // 스트림이 done 이벤트 없이 종료된 경우
        if (streaming && accumulatedResponse) {
          const aiMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: accumulatedResponse,
            sources,
            cards,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // 사용자가 취소한 경우
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "오류가 발생했습니다.";
        options?.onError?.(errorMessage);

        // 오류 메시지 표시
        const errorAiMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `죄송합니다. 요청을 처리하는 중 오류가 발생했습니다: ${errorMessage}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [streaming, options, sessionId],
  );

  const cancelStream = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Call stop endpoint as per guide
    try {
      await fetch(`${CHAT_API_URL}/chat/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (err) {
      console.error("Failed to stop generation:", err);
    } finally {
      setStreaming(false);
      setCurrentResponse("");
      setCurrentCards([]);
    }
  }, [sessionId]);

  const resetSession = useCallback((projectId?: string) => {
    const { user } = useAuthStore.getState();
    if (projectId && user?.id) {
      // 프로젝트 기반 세션으로 리셋
      setSessionId(`${user.id}-${projectId}`);
    } else {
      setSessionId(null);
    }
    setMessages([]);
    setAnalyzing(false);
    setAnalysisComplete(false);
  }, []);

  /**
   * 히스토리 로드 - 페이지 진입 시 호출
   */
  const loadHistory = useCallback(async (projectId: string) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) return;

    const sid = `${user.id}-${projectId}`;
    setSessionId(sid);

    try {
      const res = await fetch(`${CHAT_API_URL}/chat/history/${sid}?limit=20`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: ChatMessage[] = data.messages.map(
          (m: { role: string; content: string }, i: number) => ({
            id: `loaded-${i}`,
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
            timestamp: new Date(),
          }),
        );
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, []);

  const clearAnalysisComplete = useCallback(() => {
    setAnalysisComplete(false);
  }, []);

  return {
    messages,
    streaming,
    analyzing,
    analysisComplete,
    currentResponse,
    currentSources,
    currentCards,
    sessionId,
    sendMessage,
    cancelStream,
    resetSession,
    loadHistory,
    clearAnalysisComplete,
  };
}
