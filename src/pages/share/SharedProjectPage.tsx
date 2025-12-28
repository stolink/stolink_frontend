import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSharedProject } from "@/hooks/useShare";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookReaderModal } from "@/components/reader/BookReaderModal";
import type { Chapter } from "@/components/reader/hooks/useBookReader";

// Define a type for the document structure from the API
interface DocumentNode {
  id: string;
  title: string;
  type: string;
  content?: string;
  children?: DocumentNode[];
}

// Define ApiError type for better type safety
interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
}

const isValidDocumentNode = (item: unknown): item is DocumentNode => {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === "string" && typeof obj.title === "string" && "type" in obj
  );
};

export default function SharedProjectPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useSharedProject(shareId || "", password, {
    enabled: !!shareId, // Fetch initially to check if password is required
    retry: (failureCount, error) => {
      const isPasswordError = (error as ApiError)?.response?.status === 403;
      // Don't retry on 403 (password required)
      return !isPasswordError && failureCount < 1;
    },
  });

  // Flatten the document tree into a linear list of chapters
  const chapters = useMemo<Chapter[]>(() => {
    if (!project?.documents || !Array.isArray(project.documents)) return [];

    const result: Chapter[] = [];

    // Helper with runtime checks
    const traverse = (docs: unknown) => {
      if (!Array.isArray(docs)) return;

      for (const doc of docs) {
        if (!isValidDocumentNode(doc)) continue;

        const item = doc as DocumentNode;

        // We only treat "text" type as readable chapters
        if (
          (item.type === "text" || item.type === "TEXT") &&
          item.content &&
          typeof item.content === "string"
        ) {
          result.push({
            id: item.id,
            title: item.title,
            content: item.content,
          });
        }

        // Recursively check children
        if (Array.isArray(item.children) && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };

    traverse(project.documents);
    return result;
  }, [project]);

  if (!shareId) {
    return (
      <div className="h-screen flex items-center justify-center bg-paper text-stone-500">
        잘못된 접근입니다. (공유 ID 누락)
      </div>
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(passwordInput);
    // Retry fetching with new password
    await refetch();
  };

  const handleClose = () => {
    // For a shared link, we might not have a logical "back", so we could redirect to home or just do nothing (modal stays open)
    // Here we'll try to go back, or go to home if history is empty-ish
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-paper text-sage-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
          <p>작품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Handle password required error (403 or specific error code)
  if (error) {
    const isPasswordError = (error as ApiError)?.response?.status === 403;

    if (isPasswordError || !project) {
      return (
        <div className="h-screen flex items-center justify-center bg-paper">
          <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">
                접근이 제한된 작품입니다
              </h2>
              <p className="text-stone-500">
                이 작품을 보려면 비밀번호를 입력하세요.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="text-center"
              />
              <Button type="submit" className="w-full">
                확인
              </Button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen flex items-center justify-center bg-paper text-stone-500">
        <div className="text-center">
          <p className="mb-4">작품을 불러올 수 없습니다.</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  // If no readable chapters found
  if (chapters.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-paper text-stone-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">
            내용이 없습니다
          </h2>
          <p className="mb-4">이 작품에는 아직 읽을 수 있는 문서가 없습니다.</p>
        </div>
      </div>
    );
  }

  // Render BookReaderModal directly
  // We use key to force re-render if shareId changes, ensuring clean state
  return (
    <BookReaderModal
      key={shareId}
      isOpen={true}
      onClose={handleClose}
      chapters={chapters}
      bookTitle={project?.title || "공유된 작품"}
    />
  );
}
