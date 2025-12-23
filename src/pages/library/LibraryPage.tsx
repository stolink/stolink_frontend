import { useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard, type ProjectStatus } from "@/components/library/BookCard";
import { CreateBookCard } from "@/components/library/CreateBookCard";
import { useUIStore } from "@/stores";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Extended Mock data for UI demo
interface ExtendedProject extends Project {
  status: ProjectStatus | "writing" | "completed"; // Compatible types
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
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop", // Abstract dark wave
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
  const { setCreateProjectModalOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projects] = useState<ExtendedProject[]>(mockProjects);
  const navigate = useNavigate();

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-outfit text-3xl font-bold text-stone-900 tracking-tight">
                  My Library
                </h1>
                <p className="text-stone-500 mt-1">
                  Manage your novels, drafts, and outlines.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="h-10 px-4 gap-2 bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 font-medium min-w-[160px] justify-between"
                  >
                    <span>Recent Activity</span>
                    <svg
                      width="10"
                      height="6"
                      viewBox="0 0 10 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="flex items-center rounded-md border border-stone-200 bg-stone-50 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded p-1.5 transition-all",
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-stone-900"
                        : "text-stone-400 hover:text-stone-600",
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "rounded p-1.5 transition-all",
                      viewMode === "list"
                        ? "bg-white shadow-sm text-stone-900"
                        : "text-stone-400 hover:text-stone-600",
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative max-w-2xl mx-auto w-full -mt-16 invisible sm:visible">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  placeholder="Search library..."
                  className="pl-12 h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-sage-400 transition-all text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 pb-24">
        <div
          className={cn(
            "grid gap-8",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1",
          )}
        >
          {/* Create New Book Card */}
          <div className="h-full min-h-[420px]">
            <CreateBookCard onClick={() => setCreateProjectModalOpen(true)} />
          </div>

          {/* Project List */}
          {filteredProjects.map((project) => (
            <div key={project.id} className="h-full min-h-[420px]">
              <BookCard
                title={project.title}
                author={project.author || "Author"}
                status={project.status as ProjectStatus}
                coverImage={project.coverImage}
                location={project.location}
                length={project.length}
                progress={project.progress}
                lastEdited={project.lastEditedText}
                onClick={() => navigate(`/projects/${project.id}/editor`)}
              />
            </div>
          ))}
        </div>

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
      <footer className="border-t border-stone-100 py-8 mt-auto bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-stone-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">Sto-Link</span>
            <span>•</span>
            <span>v2.4.0</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-stone-600">
              Privacy
            </a>
            <a href="#" className="hover:text-stone-600">
              Terms
            </a>
            <a href="#" className="hover:text-stone-600">
              Help
            </a>
            <span>© 2023 Sto-Link Platform. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
