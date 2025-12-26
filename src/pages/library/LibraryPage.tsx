import { useState, useRef } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  User,
  LogOut,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/common/Footer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard, type ProjectStatus } from "@/components/library/BookCard";
import { CreateBookCard } from "@/components/library/CreateBookCard";
import { ImportBookCard } from "@/components/library/ImportBookCard";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import {
  useProjects,
  useDeleteProject,
  useCreateProject,
} from "@/hooks/useProjects";
import { projectService, type Project } from "@/services/projectService";
import {
  documentService,
  mapBackendToFrontend,
} from "@/services/documentService";
import type { ApiResponse } from "@/types/api";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { getApiData } from "@/utils/apiUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export default function LibraryPage() {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projectsData, isLoading, error } = useProjects();
  const { mutate: deleteProject } = useDeleteProject();

  const projects = projectsData?.projects || [];

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const { _create } = useDocumentStore.getState();

      // 1. Create Project
      console.log("[LibraryPage] Creating project...");
      const projectResponse = await projectService.create({
        title: "새 작품",
        genre: "other",
        description: "",
      });
      const projectData = getApiData(
        projectResponse,
        "Failed to create project"
      );
      const projectId = projectData.id;
      console.log("[LibraryPage] Project created:", projectId);

      // 2. Create default chapter (folder)
      console.log("[LibraryPage] Creating default chapter...");
      const chapterResponse = await documentService.create(projectId, {
        type: "folder",
        title: "챕터 1",
      });
      const chapterData = getApiData(
        chapterResponse,
        "Failed to create default chapter"
      );
      const chapterId = chapterData.id;
      console.log("[LibraryPage] Chapter created:", chapterId);

      // Add chapter to local store
      _create(mapBackendToFrontend(chapterData));

      // 3. Create default section (text document)
      console.log("[LibraryPage] Creating default section...");
      const sectionResponse = await documentService.create(projectId, {
        type: "text",
        title: "섹션 1",
        parentId: chapterId,
      });

      try {
        const sectionData = getApiData(
          sectionResponse,
          "Failed to create section"
        );
        console.log("[LibraryPage] Section created:", sectionData.id);
        _create(mapBackendToFrontend(sectionData));
      } catch {
        // Section creation failure is not critical
        console.warn("[LibraryPage] Section creation failed, continuing...");
      }

      // 4. Navigate to editor
      console.log("[LibraryPage] Navigating to editor...");
      navigate(`/projects/${projectId}/editor`);
    } catch (error) {
      console.error("[LibraryPage] Create project failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "프로젝트 생성에 실패했습니다.";
      alert(message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const readFileWithEncoding = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();

    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      const text = utf8Decoder.decode(buffer);
      if (!text.includes("�")) {
        return text;
      }
    } catch {
      // UTF-8 decoding failed
    }

    try {
      const eucKrDecoder = new TextDecoder("euc-kr");
      return eucKrDecoder.decode(buffer);
    } catch {
      const fallbackDecoder = new TextDecoder("utf-8", { fatal: false });
      return fallbackDecoder.decode(buffer);
    }
  };

  // Helper: Recursive Character Text Splitter approach
  // Splits text into chunks respecting separators to keep semantic meaning
  const splitContentRecursively = (
    text: string,
    chunkSize: number = 10000,
    overlap: number = 200
  ): { title: string; content: string }[] => {
    const separators = ["\n\n", "\n", ". ", " "];
    const chunks: string[] = [];

    const splitText = (currentText: string) => {
      // Base case: if text fits in chunk, just return it
      if (currentText.length <= chunkSize) {
        chunks.push(currentText);
        return;
      }

      // Try separators in order
      let bestSplitIndex = -1;
      let separatorUsed = "";

      for (const separator of separators) {
        // Find the last occurrence of separator within the limit
        // We want to maximize the chunk size while staying under the limit
        const limit = chunkSize;
        const lastIndex = currentText.lastIndexOf(separator, limit);

        if (lastIndex !== -1 && lastIndex > chunkSize * 0.3) {
          // Found a good split point (at least 30% filled)
          bestSplitIndex = lastIndex;
          separatorUsed = separator;
          break;
        }
      }

      // If no good separator found (rare, huge block of text), force split
      if (bestSplitIndex === -1) {
        bestSplitIndex = chunkSize;
      }

      // Add the chunk
      const chunk = currentText.substring(
        0,
        bestSplitIndex + separatorUsed.length
      );
      chunks.push(chunk);

      // Recurse on the rest
      const remaining = currentText.substring(
        bestSplitIndex + separatorUsed.length
      );
      if (remaining.trim().length > 0) {
        splitText(remaining);
      }
    };

    splitText(text);

    return chunks.map((content, index) => ({
      title: `Part ${index + 1}`,
      content: content.trim(),
    }));
  };

  // Helper: Split text into chapters based on patterns
  const splitContentByChapters = (text: string) => {
    // 1. Try to find explicit chapter headers
    // Patterns: "제1장", "제 1 장", "Chapter 1", "Prologue", "프롤로그"
    // Regex logic:
    // (?:^|\n) matches start of file or new line
    // \s* matches optional whitespace
    // (Chapter\s*\d+|제\s*\d+\s*장|Prologue|Epilogue|프롤로그|에필로그) matches the chapter title
    // .* matches rest of the title line
    const pattern =
      /(?:^|\n)\s*((?:Chapter|제|Section|Part)\s*\d+[^(\n)]*|Prologue|Epilogue|프롤로그|에필로그|Episode\s*\d+).*/gi;

    // Check if we have enough matches to warrant splitting (at least 2, or 1 if it starts with it)
    const matches = [...text.matchAll(pattern)];

    if (matches.length < 2) {
      return null;
    }

    const segments: { title: string; content: string }[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      const matchIndex = match.index!;
      const matchLength = match[0].length;
      const title = match[1].trim();

      // Content before the first chapter (e.g. title page, intro)
      if (i === 0 && matchIndex > 0) {
        const introContent = text.substring(0, matchIndex).trim();
        if (introContent) {
          segments.push({ title: "Intro", content: introContent });
        }
      }

      // Content for the current chapter
      // It goes from end of this match line to start of next match line
      const contentStart = matchIndex + matchLength;
      const nextMatch = matches[i + 1];
      const contentEnd = nextMatch ? nextMatch.index! : text.length;

      const content = text.substring(contentStart, contentEnd).trim();
      segments.push({ title, content });

      lastIndex = contentEnd;
    });

    return segments;
  };

  const cleanText = (text: string): string => {
    let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    cleaned = cleaned
      .replace(/\n{2,}/g, "<<<PARA>>>")
      .replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
      .replace(/\n/g, " ")
      .replace(/<<<PARA>>>/g, "\n\n")
      .replace(/  +/g, " ")
      .trim();

    return cleaned;
  };

  const processContentToHtml = (text: string) => {
    const cleaned = cleanText(text);
    return cleaned
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");
  };

  const handleImportBook = async (file: File) => {
    const rawText = await readFileWithEncoding(file);
    const title = file.name.replace(/\.(txt|md)$/i, "");

    // 1. Try Chapter Splitting
    let segments = splitContentByChapters(rawText);

    // 2. If no chapters, try Recursive Semantic Splitting if text is large (>30k chars)
    if (!segments && rawText.length > 30000) {
      console.log(
        "[Import] No explicit chapters found. Using semantic splitter."
      );
      segments = splitContentRecursively(rawText);
    }

    const hasSegments = segments && segments.length > 0;

    try {
      const { _create, _setContent } = useDocumentStore.getState();

      // 1. Create Project
      const projectResponse = await projectService.create({
        title: title,
        genre: "other",
        description: `${file.name}에서 가져온 책`,
      });

      const projectId = projectResponse.data?.id;
      if (!projectId) throw new Error("Failed to create project");

      // 2. Import Logic
      if (hasSegments) {
        console.log(`[Import] Imported as ${segments!.length} segments.`);

        // Use sequential execution to preserve order and prevent race conditions
        for (const [index, segment] of segments!.entries()) {
          // A. Create Folder (Chapter/Part)
          const folderRes = await documentService.create(projectId, {
            type: "folder",
            title: segment.title,
          });
          const folderId = folderRes.data?.id;
          if (!folderId) continue;

          _create(mapBackendToFrontend(folderRes.data!));

          // B. Create Document (Content) inside Folder
          const chunkHtml = processContentToHtml(segment.content);

          const docRes = await documentService.create(projectId, {
            type: "text",
            title: "본문", // Standard name for section inside chapter
            parentId: folderId,
            targetWordCount: segment.content.length,
          });

          const docId = docRes.data?.id;
          if (docId) {
            _create(mapBackendToFrontend(docRes.data!));
            await documentService.updateContent(docId, chunkHtml);
            _setContent(docId, chunkHtml);
          }
        }
      } else {
        // Fallback: Single Document Import
        console.log("[Import] Importing as single file.");
        const fullContent = processContentToHtml(rawText);

        const docResponse = await documentService.create(projectId, {
          type: "text",
          title: "본문",
          targetWordCount: rawText.length,
        });

        const docId = docResponse.data?.id;
        if (!docId) throw new Error("Failed to create document");

        _create(mapBackendToFrontend(docResponse.data!));
        await documentService.updateContent(docId, fullContent);
        _setContent(docId, fullContent);
      }

      // 3. Navigate
      navigate(`/projects/${projectId}/editor`);
    } catch (error) {
      console.error("Import failed:", error);

      // Handle QuotaExceededError specifically
      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        alert(
          "저장 용량이 부족합니다. 파일이 너무 크거나 브라우저 저장 공간이 가득 찼습니다."
        );
      } else {
        alert(
          "가져오기에 실패했습니다: " +
            (error instanceof Error ? error.message : "알 수 없는 오류")
        );
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImportBook(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-sage-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/assets/main_logo.png"
                    alt="Sto-Link"
                    className="h-16 w-auto"
                  />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title..."
                    className="pl-9 h-9 w-[240px] bg-white border-stone-200 focus:border-sage-400 focus:ring-sage-200 transition-all text-sm rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 bg-white border-stone-200 text-stone-600"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Genre</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>
                      All Genres
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Fantasy</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Romance</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Sci-Fi</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>
                      All Statuses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Drafting
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Completed
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 bg-white border-stone-200 text-stone-600"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Last Modified</DropdownMenuItem>
                    <DropdownMenuItem>Created Date</DropdownMenuItem>
                    <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center rounded-full border border-stone-200 bg-white p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-sage-200",
                      viewMode === "grid"
                        ? "bg-sage-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-sage-600"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-sage-200",
                      viewMode === "list"
                        ? "bg-sage-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-sage-600"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-full bg-sage-100 hover:bg-sage-200"
                    >
                      <User className="h-4 w-4 text-sage-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">내 계정</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || "user@example.com"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="relative w-full lg:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title..."
                className="pl-9 h-10 w-full bg-white border-stone-200 focus:bg-white transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-heading font-bold text-ink inline-block border-b-2 border-sage-500 pb-1">
            내 서재
          </h2>
        </motion.div>

        <motion.div
          className={cn(
            "grid gap-8",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
          initial={false}
          animate="visible"
          variants={containerVariants}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md"
            className="hidden"
          />

          <motion.div variants={itemVariants} className="h-full min-h-[320px]">
            <CreateBookCard
              onClick={handleCreateProject}
              disabled={isCreatingProject}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="h-full min-h-[320px]">
            <ImportBookCard onClick={handleImportClick} />
          </motion.div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                variants={itemVariants}
                className="h-full min-h-[320px]"
              >
                <div className="bg-white rounded-xl border border-stone-200 p-6 h-full animate-pulse">
                  <div className="h-32 bg-stone-200 rounded mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                </div>
              </motion.div>
            ))
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-400">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                프로젝트를 불러오는데 실패했습니다
              </h3>
              <p className="text-stone-500">잠시 후 다시 시도해주세요.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                initial={false}
                className="h-full min-h-[320px]"
              >
                <BookCard
                  title={project.title}
                  author={project.author || "Author"}
                  status={(project.status as ProjectStatus) || "DRAFTING"}
                  genre={project.genre}
                  coverImage={project.coverImage}
                  location={`Chapter ${project.stats?.chapterCount || 0}`}
                  length={`${project.stats?.totalWords || 0} W`}
                  progress={0}
                  lastEdited={new Date(project.updatedAt).toLocaleDateString()}
                  onClick={() => navigate(`/projects/${project.id}/editor`)}
                  onAction={(action) => {
                    if (action === "delete") {
                      if (
                        confirm(`"${project.title}"을(를) 삭제하시겠습니까?`)
                      ) {
                        deleteProject(project.id);
                      }
                    }
                  }}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {filteredProjects.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              검색 결과가 없습니다
            </h3>
            <p className="text-stone-500">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* Empty State - No Projects at all */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-sage-50 rounded-full flex items-center justify-center mb-6 text-sage-400">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-stone-900 mb-2">
              📚 아직 작품이 없어요
            </h3>
            <p className="text-stone-500 mb-6 max-w-md">
              첫 작품을 만들어 당신만의 이야기를 시작해보세요.
              <br />
              복선 관리, AI 분석 등 StoLink의 모든 기능을 경험할 수 있습니다.
            </p>
            <Button size="lg" className="gap-2" onClick={handleCreateProject}>
              <FileText className="w-5 h-5" />새 작품 만들기
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
    </div>
  );
}
