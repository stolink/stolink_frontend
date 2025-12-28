import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSharedProject } from "@/hooks/useShare";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookReaderModal } from "@/components/reader/BookReaderModal";
import type { Chapter } from "@/components/reader/hooks/useBookReader";

// Define a type for the document structure from the API
interface SharedDocument {
  id: string;
  title: string;
  type: "folder" | "text" | "FOLDER" | "TEXT";
  content?: string; // HTML content
  children?: SharedDocument[];
  wordCount?: number;
  description?: string;
}

export default function SharedProjectPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const {
    data: project,
    isLoading,
    error,
  } = useSharedProject(shareId || "", password, {
    enabled: !!shareId,
  });

  // Flatten the document tree into a linear list of chapters
  const chapters = useMemo<Chapter[]>(() => {
    if (!project?.documents) return [];

    const result: Chapter[] = [];

    const traverse = (docs: SharedDocument[]) => {
      for (const doc of docs) {
        // We only treat "text" type as readable chapters
        if ((doc.type === "text" || doc.type === "TEXT") && doc.content) {
          result.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
          });
        }

        // Recursively check children
        if (doc.children && doc.children.length > 0) {
          traverse(doc.children as SharedDocument[]);
        }
      }
    };

    traverse(project.documents as unknown as SharedDocument[]);
    return result;
  }, [project]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(passwordInput);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isPasswordError = (error as any)?.response?.status === 403;

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
      onClose={() => {}} // No-op: user effectively stays on the page
      chapters={chapters}
      bookTitle={project?.title || "공유된 작품"}
    />
  );
}
