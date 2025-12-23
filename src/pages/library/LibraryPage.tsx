import { useState } from "react";
import { Search, LayoutGrid, List, Filter, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/common/Footer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard, type ProjectStatus } from "@/components/library/BookCard";
import { CreateBookCard } from "@/components/library/CreateBookCard";
import { useUIStore } from "@/stores";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// Extended Mock data for UI demo
interface ExtendedProject extends Project {
  status: ProjectStatus;
  coverImage?: string;
  location?: string;
  length?: string;
  progress: number;
  lastEditedText: string;
  genre: string; // Made required for spec compliance
}

const mockProjects: ExtendedProject[] = [
  {
    id: "1",
    title: "The Midnight Echo",
    userId: "1",
    description: "",
    createdAt: "",
    updatedAt: "",
    genre: "Mystery",
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
    genre: "Sci-Fi",
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
    genre: "Sci-Fi",
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
    genre: "Other",
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
  const { setCreateProjectModalOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projects] = useState<ExtendedProject[]>(mockProjects);
  const navigate = useNavigate();

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                <div className="flex items-center">
                  <img
                    src="/src/assets/main_logo.png"
                    alt="Sto-Link"
                    className="h-16 w-auto"
                  />
                </div>
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
          {/* Create New Book Card */}
          <motion.div variants={itemVariants} className="h-full min-h-[320px]">
            <CreateBookCard onClick={() => setCreateProjectModalOpen(true)} />
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
              No results found
            </h3>
            <p className="text-stone-500">Try adjusting your search terms.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
