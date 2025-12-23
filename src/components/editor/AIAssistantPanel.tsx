import { useState } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "안녕하세요! 스토리 작성을 도와드릴게요. 무엇이 궁금하신가요?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: new Date().getTime().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (new Date().getTime() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    if (query.includes("다음") || query.includes("뭘")) {
      return '현재 "전설의 검"이라는 복선이 설정되어 있네요. 몇 가지 방향을 제안드릴게요:\n\n1. 검에 대한 단서를 더 뿌려두기 - 검이 특정 상황에서 반응하는 장면\n2. 멘토 캐릭터 등장 - 검의 역사를 알고 있는 인물\n3. 첫 번째 위기 상황 - 검의 힘이 필요한 순간';
    }
    if (query.includes("캐릭터") || query.includes("성격")) {
      return "현재 주인공의 성격이 용감하고 정의로운 것으로 설정되어 있어요. 일관성을 위해 다음을 참고하세요:\n\n• 위험 앞에서 두려움보다 책임감이 앞선다\n• 약자를 보호하려는 본능이 있다\n• 때로는 무모해 보일 수 있다";
    }
    return "좋은 질문이에요! 스토리의 맥락을 고려했을 때, 독자의 흥미를 유지하면서 복선을 자연스럽게 풀어가는 것이 중요합니다. 더 구체적인 질문이 있으시면 말씀해주세요.";
  };

  return (
    <div className="flex flex-col h-full">
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
              <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-sage-600" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                message.role === "user"
                  ? "bg-sage-500 text-white"
                  : "bg-stone-100 text-stone-800",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-sage-600" />
            </div>
            <div className="bg-stone-100 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
