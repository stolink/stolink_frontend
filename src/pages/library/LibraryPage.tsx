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
import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";

// Extended Mock data for UI demo
interface ExtendedProject extends Omit<Project, "status"> {
  status: ProjectStatus;
  coverImage?: string;
  location?: string;
  length?: string;
  progress: number;
  lastEditedText: string;
}

const mockProjects: ExtendedProject[] = [
  {
    id: "1",
    title: "The Midnight Echo",
    userId: "1",
    description: "",
    createdAt: "",
    updatedAt: "",
    genre: "mystery",
    author: "J.K. WRITER",
    status: "DRAFTING",
    location: "Chapter 12",
    length: "24,500 W",
    progress: 45,
    lastEditedText: "2 hours ago",
    stats: {
      totalCharacters: 0,
      totalWords: 24500,
      chapterCount: 12,
      characterCount: 5,
      foreshadowingRecoveryRate: 0,
      consistencyScore: 0,
    },
  },
  {
    id: "2",
    title: "Project: Titan",
    userId: "1",
    description: "",
    createdAt: "",
    updatedAt: "",
    genre: "sf",
    author: "J.K. WRITER",
    status: "OUTLINE",
    location: "15 Beats",
    length: "Scenecard",
    progress: 15,
    lastEditedText: "yesterday",
    stats: {
      totalCharacters: 0,
      totalWords: 0,
      chapterCount: 0,
      characterCount: 0,
      foreshadowingRecoveryRate: 0,
      consistencyScore: 0,
    },
  },
  {
    id: "3",
    title: "The Last Algorithm",
    userId: "1",
    description: "",
    createdAt: "",
    updatedAt: "",
    genre: "sf",
    author: "J.K. WRITER",
    status: "EDITING",
    location: "Chapter 28",
    length: "85k W",
    progress: 92,
    lastEditedText: "3 days ago",
    coverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    stats: {
      totalCharacters: 0,
      totalWords: 85000,
      chapterCount: 28,
      characterCount: 0,
      foreshadowingRecoveryRate: 0,
      consistencyScore: 0,
    },
  },
  {
    id: "4",
    title: "Untitled Story Idea",
    userId: "1",
    description: "",
    createdAt: "",
    updatedAt: "",
    genre: "other",
    author: "NO AUTHOR",
    status: "IDEA",
    location: "3 Items",
    length: "0 W",
    progress: 0,
    lastEditedText: "1 week ago",
    stats: {
      totalCharacters: 0,
      totalWords: 0,
      chapterCount: 0,
      characterCount: 0,
      foreshadowingRecoveryRate: 0,
      consistencyScore: 0,
    },
  },
];

export default function LibraryPage() {
  const { _create } = useDocumentStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projects] = useState<ExtendedProject[]>(mockProjects);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Read file with encoding detection (UTF-8 first, then EUC-KR for Korean files)
  const readFileWithEncoding = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();

    // Try UTF-8 first
    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      const text = utf8Decoder.decode(buffer);
      // Check if it looks like valid Korean text (not garbled)
      if (!text.includes("�")) {
        return text;
      }
    } catch {
      // UTF-8 decoding failed
    }

    // Fallback to EUC-KR (common for old Korean files)
    try {
      const eucKrDecoder = new TextDecoder("euc-kr");
      return eucKrDecoder.decode(buffer);
    } catch {
      // Last resort: force UTF-8
      const fallbackDecoder = new TextDecoder("utf-8", { fatal: false });
      return fallbackDecoder.decode(buffer);
    }
  };

  // Import book from TXT/MD file
  const handleImportBook = async (file: File) => {
    console.log(
      "[Library Import] Reading file:",
      file.name,
      file.size,
      "bytes",
    );
    const rawText = await readFileWithEncoding(file);
    const title = file.name.replace(/\.(txt|md)$/i, "");

    // Smart text cleanup: remove hard line breaks within paragraphs
    // Old TXT files often have fixed-width line breaks (e.g., 80 chars)
    const cleanText = (text: string): string => {
      // Normalize line endings
      let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      // Detect paragraph breaks (2+ newlines, or newline followed by indent/space)
      // Replace single newlines within paragraphs with spaces
      cleaned = cleaned
        // First, mark real paragraph breaks (2+ newlines)
        .replace(/\n{2,}/g, "<<<PARA>>>")
        // Also treat lines ending with period/question/exclamation followed by newline as paragraph
        .replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
        // Remove remaining single newlines (hard wraps within paragraphs)
        .replace(/\n/g, " ")
        // Restore paragraph breaks
        .replace(/<<<PARA>>>/g, "\n\n")
        // Clean up multiple spaces
        .replace(/  +/g, " ")
        .trim();

      return cleaned;
    };

    const text = cleanText(rawText);

    // Convert plain text to HTML paragraphs
    const content = text
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");

    const { _create } = useDocumentStore.getState();
    const now = new Date().toISOString();
    const newProjectId = `project-import-${Date.now()}`;

    // Create project folder
    _create({
      id: newProjectId,
      projectId: newProjectId,
      type: "folder",
      title: title,
      content: "",
      synopsis: `${file.name}에서 가져온 책`,
      order: 0,
      metadata: {
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        keywords: [],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create the main document
    _create({
      id: `doc-${Date.now()}`,
      projectId: newProjectId,
      parentId: newProjectId,
      type: "text",
      title: "본문",
      content,
      synopsis: "",
      order: 0,
      metadata: {
        status: "draft",
        wordCount: text.length,
        includeInCompile: true,
        keywords: [],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    });

    console.log("[Library Import] Created project:", newProjectId);

    // Navigate to the new project's editor
    navigate(`/projects/${newProjectId}/editor`);
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

  const handleCreateProject = () => {
    const now = new Date().toISOString();
    const newProjectId = `project-${Date.now()}`;

    // 1. 프로젝트(폴더) 생성
    _create({
      id: newProjectId,
      projectId: newProjectId,
      type: "folder",
      title: "새 작품",
      content: "",
      synopsis: "",
      order: 0,
      metadata: {
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        keywords: ["auto-genre"],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // 2. 초기 챕터(문서) 생성
    _create({
      id: `doc-${Date.now()}`,
      projectId: newProjectId,
      parentId: newProjectId,
      type: "text",
      title: "1화",
      content: "",
      synopsis: "",
      order: 0,
      metadata: {
        status: "draft",
        wordCount: 0,
        includeInCompile: true,
        keywords: [],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // 3. 에디터로 이동
    navigate(`/projects/${newProjectId}/editor`);
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
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-sage-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            {/* Top Row: Brand & Mobile Menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/src/assets/main_logo.png"
                    alt="Sto-Link"
                    className="h-16 w-auto"
                  />
                </Link>
              </div>

              {/* Desktop Toolbar */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title..."
                    className="pl-9 h-9 w-[240px] bg-white border-stone-200 focus:border-sage-400 focus:ring-sage-200 transition-all text-sm rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Button */}
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

                {/* Sort Button */}
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

                {/* View Toggle */}
                <div className="flex items-center rounded-full border border-stone-200 bg-white p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-sage-200",
                      viewMode === "grid"
                        ? "bg-sage-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-sage-600",
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
                        : "text-muted-foreground hover:text-sage-600",
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

                {/* User Menu */}
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

            {/* Mobile Search - Row 2 */}
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
        {/* Page Title */}
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
              : "grid-cols-1",
          )}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Hidden file input for book import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md"
            className="hidden"
          />

          {/* Create New Book Card */}
          <motion.div variants={itemVariants} className="h-full min-h-[320px]">
            <CreateBookCard onClick={handleCreateProject} />
          </motion.div>

          {/* Import Book Card */}
          <motion.div variants={itemVariants} className="h-full min-h-[320px]">
            <ImportBookCard onClick={handleImportClick} />
          </motion.div>

          {/* Project List */}
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="h-full min-h-[320px]"
            >
              <BookCard
                title={project.title}
                author={project.author || "Author"}
                status={project.status}
                genre={project.genre}
                coverImage={project.coverImage}
                location={project.location}
                length={project.length}
                progress={project.progress}
                lastEdited={project.lastEditedText}
                onClick={() => navigate(`/projects/${project.id}/editor`)}
                onAction={(action) => console.log(action, project.title)}
              />
            </motion.div>
          ))}
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
