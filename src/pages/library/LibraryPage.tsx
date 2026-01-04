import { useState, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  User,
  LogOut,
  FileText,
  Plus,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/common/Footer";
import { InteractiveLightOverlay } from "@/components/effects";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard } from "@/components/library/BookCard";
import { CreateBookModal } from "@/components/library/CreateBookModal";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
// TODO: useDuplicateProject는 현재 임시로 넣었고 추후 Duplicate기능이 사라지면 없애야함
import {
  useProjects,
  useDeleteProject,
  useDuplicateProject,
  useUpdateProject,
} from "@/hooks/useProjects";
import { projectService } from "@/services/projectService";
import {
  documentService,
  mapBackendToFrontend,
} from "@/services/documentService";

import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { getApiData } from "@/utils/apiUtils";
import { useUpdateProjectStatus } from "@/hooks/useUpdateProjectStatus";
import type { ProjectStatusType } from "@/components/library/StatusChip";
import { manuscriptService } from "@/services/manuscriptService";
import { useManuscriptJobStore } from "@/stores/useManuscriptJobStore";
import { useManuscriptPolling } from "@/hooks/useManuscriptPolling";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LibraryPage() {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 새로운 상태 변수들 ==========
  // 새 작품 만들기 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // 편집(삭제) 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  // 선택된 책 ID 목록
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  // 삭제 확인 모달 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 일괄 삭제 진행 중 상태
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // ========== 정렬 상태 ==========
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title">(
    "updatedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ========== Rename 모달 상태 ==========
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // ========== 개별 삭제 확인 모달 상태 ==========
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ========== 표지 변경 상태 ==========
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUpdateTargetId, setCoverUpdateTargetId] = useState<string | null>(
    null
  );

  const {
    data: projectsData,
    isLoading,
    error,
  } = useProjects({ sort: sortBy, order: sortOrder });
  const { mutate: deleteProject, mutateAsync: deleteProjectAsync } =
    useDeleteProject();
  const { mutate: updateProjectStatus } = useUpdateProjectStatus();
  const { mutate: duplicateProject } = useDuplicateProject();
  const { mutate: updateProject } = useUpdateProject();

  // ========== 원고 비동기 처리 ==========
  const setJob = useManuscriptJobStore((state) => state.setJob);
  useManuscriptPolling(); // 전역 폴링 시작

  // ========== Query Client ==========
  const queryClient = useQueryClient();

  const projects = projectsData?.projects || [];

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========== 편집 모드 핸들러 ==========
  // 편집 모드 토글
  const handleToggleEditMode = () => {
    if (isEditMode) {
      // 편집 모드 종료 시 선택 초기화
      setSelectedBooks([]);
    }
    setIsEditMode(!isEditMode);
  };

  // 책 선택/해제 토글
  const toggleBookSelection = (id: string) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  // 일괄 삭제 실행
  const handleBatchDelete = async () => {
    setIsDeletingBatch(true);
    const failedIds: string[] = [];

    try {
      // 순차적으로 삭제
      for (const id of selectedBooks) {
        try {
          await deleteProjectAsync(id);
        } catch (err) {
          console.error(`[LibraryPage] Failed to delete project ${id}:`, err);
          failedIds.push(id);
        }
      }

      // 삭제 완료 후 상태 초기화
      setSelectedBooks([]);
      setIsEditMode(false);
      setShowDeleteConfirm(false);

      if (failedIds.length > 0) {
        toast({
          title: "삭제 실패",
          description: `${failedIds.length}개의 프로젝트 삭제에 실패했습니다.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[LibraryPage] Batch delete failed:", error);
      toast({
        title: "오류 발생",
        description: "프로젝트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = (projectId: string, status: ProjectStatusType) => {
    updateProjectStatus({ projectId, status });
  };

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const { _create } = useDocumentStore.getState();

      // 1. Create Project
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

      // 2. Create default chapter (folder)
      const chapterResponse = await documentService.create(projectId, {
        type: "folder",
        title: "챕터 1",
      });
      const chapterData = getApiData(
        chapterResponse,
        "Failed to create default chapter"
      );
      const chapterId = chapterData.id;

      // Add chapter to local store
      _create(mapBackendToFrontend(chapterData));

      // 3. Create default section (text document)
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
        _create(mapBackendToFrontend(sectionData));
      } catch {
        // Section creation failure is not critical
        console.warn("[LibraryPage] Section creation failed, continuing...");
      }

      // 4. 프로젝트 목록 갱신 후 에디터로 이동
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/projects/${projectId}/editor`);
    } catch (error) {
      console.error("[LibraryPage] Create project failed:", error);
      toast({
        title: "작품 생성 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
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

  const handleImportBook = async (file: File) => {
    const rawText = await readFileWithEncoding(file);
    const title = file.name.replace(/\.(txt|md)$/i, "");

    try {
      // 1. 프로젝트 생성
      const projectResponse = await projectService.create({
        title: title,
        genre: "other",
        description: `${file.name}에서 가져온 책`,
      });

      const projectId = projectResponse.data?.id;
      if (!projectId) throw new Error("Failed to create project");

      // 2. 원고 업로드 (비동기 처리 시작)
      const uploadResponse = await manuscriptService.upload(
        projectId,
        rawText,
        file.name
      );

      const jobData = uploadResponse.data;
      if (!jobData?.jobId) {
        throw new Error("Failed to start manuscript processing");
      }

      // 3. Job을 store에 등록 (폴링 시작)
      setJob(projectId, {
        jobId: jobData.jobId,
        status: jobData.status,
        progress: 0,
        message: jobData.message || "원고 업로드 시작...",
        startedAt: Date.now(),
      });

      // 4. 프로젝트 목록 갱신 (새 프로젝트가 보이도록)
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // 5. 라이브러리에서 확인할 수 있도록 알림
      toast({
        title: "원고 처리 시작",
        description: `"${title}" 원고 처리가 시작되었습니다.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Import failed:", error);

      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        toast({
          title: "저장 용량 부족",
          description:
            "브라우저 저장 공간을 정리하거나 더 작은 파일로 시도해주세요.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "가져오기 실패",
          description:
            error instanceof Error ? error.message : "알 수 없는 오류",
          variant: "destructive",
        });
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

  // 표지 변경 핸들러
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && coverUpdateTargetId) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "이미지 크기는 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateProject({
          id: coverUpdateTargetId,
          payload: { coverImage: base64String },
        });
        setCoverUpdateTargetId(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
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
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border shadow-sm">
        {/* Ver.1: SVG 동적 광원 효과 */}
        <InteractiveLightOverlay />
        <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/main_logo.png"
                  alt="Sto-Link"
                  className="h-16 w-auto"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="제목으로 검색..."
                    className="pl-9 h-9 w-[240px] bg-white border-input focus:border-mocha-400 focus:ring-mocha-200 transition-all text-sm rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 bg-white border-input text-muted-foreground"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">필터</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>장르</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>
                      전체
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>판타지</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>로맨스</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>SF</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>상태</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>
                      전체
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>집필중</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>완료</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 bg-white border-input text-muted-foreground"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">정렬</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("updatedAt");
                        setSortOrder("desc");
                      }}
                      className={sortBy === "updatedAt" ? "bg-mocha-50" : ""}
                    >
                      최근 수정순
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("createdAt");
                        setSortOrder("desc");
                      }}
                      className={sortBy === "createdAt" ? "bg-mocha-50" : ""}
                    >
                      생성일순
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("title");
                        setSortOrder("asc");
                      }}
                      className={sortBy === "title" ? "bg-mocha-50" : ""}
                    >
                      이름순
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 편집 모드 버튼 */}
                <Button
                  variant={isEditMode ? "destructive" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 gap-2",
                    !isEditMode && "bg-white border-input text-muted-foreground"
                  )}
                  onClick={handleToggleEditMode}
                >
                  {isEditMode ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">취소</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">편집</span>
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-mocha-200",
                    viewMode === "grid"
                      ? "bg-mocha-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-mocha-600"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-mocha-200",
                    viewMode === "list"
                      ? "bg-mocha-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-mocha-600"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>

                <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-full bg-mocha-100 hover:bg-mocha-200"
                    >
                      <User className="h-4 w-4 text-mocha-700" />
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
                placeholder="제목으로 검색..."
                className="pl-9 h-10 w-full bg-white border-input focus:bg-white transition-all text-sm"
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
          <h2 className="text-2xl font-heading font-bold text-foreground inline-block brush-underline pb-1">
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
          {/* 숨겨진 파일 입력 (기존 원고 불러오기용) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md"
            className="hidden"
          />

          {/* 숨겨진 표지 이미지 입력 */}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/*"
            className="hidden"
          />

          {/* CreateBookCard, ImportBookCard 제거됨 - 하단 플로팅 버튼으로 대체 */}

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                variants={itemVariants}
                className="h-full min-h-[320px]"
              >
                <div className="bg-white rounded-xl border border-input p-6 h-full animate-pulse">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </motion.div>
            ))
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-400">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                프로젝트를 불러오는데 실패했습니다
              </h3>
              <p className="text-muted-foreground">
                잠시 후 다시 시도해주세요.
              </p>
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
                  projectId={project.id}
                  title={project.title}
                  author={project.author || "Author"}
                  status={
                    project.status === "completed" ? "Complete" : "Writing"
                  }
                  genre={project.genre}
                  coverImage={project.coverImage}
                  location={`Chapter ${project.stats?.chapterCount || 0}`}
                  length={`${project.stats?.totalWords || 0} W`}
                  progress={0}
                  lastEdited={new Date(project.updatedAt).toLocaleDateString()}
                  onClick={() => navigate(`/projects/${project.id}/editor`)}
                  onAction={(action) => {
                    if (action === "delete") {
                      // AlertDialog로 삭제 확인
                      setSingleDeleteTarget({
                        id: project.id,
                        title: project.title,
                      });
                    } else if (action === "rename") {
                      // Rename 모달 열기
                      setRenameTarget({ id: project.id, title: project.title });
                      setNewTitle(project.title);
                      setRenameModalOpen(true);
                    } else if (action === "duplicate") {
                      // 프로젝트 복제
                      duplicateProject(project.id);
                    } else if (action === "change_cover") {
                      // 표지 변경
                      setCoverUpdateTargetId(project.id);
                      coverInputRef.current?.click();
                    }
                  }}
                  onStatusChange={(status) =>
                    handleStatusChange(project.id, status)
                  }
                  isEditMode={isEditMode}
                  isSelected={selectedBooks.includes(project.id)}
                  onSelect={() => toggleBookSelection(project.id)}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {filteredProjects.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-cloud-50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              검색 결과가 없습니다
            </h3>
            <p className="text-stone-500">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* Empty State - No Projects at all */}
        {projects.length === 0 && !isLoading && (
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
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5" />새 작품 만들기
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* ========== 새 작품 만들기 플로팅 버튼 ========== */}
      {!isEditMode && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Button
            size="lg"
            className="gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-6"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5" />새 작품 만들기
          </Button>
        </motion.div>
      )}

      {/* ========== 일괄 삭제 플로팅 바 ========== */}
      <AnimatePresence>
        {isEditMode && selectedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
              <span className="font-medium">
                {selectedBooks.length}개 선택됨
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2 font-semibold"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 새 작품 만들기 모달 ========== */}
      <CreateBookModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateBlank={handleCreateProject}
        onImport={handleImportClick}
        isCreating={isCreatingProject}
      />

      {/* ========== 삭제 확인 모달 ========== */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedBooks.length}개의 작품이 영구적으로 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBatch}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isDeletingBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingBatch ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== 제목 수정(Rename) 모달 ========== */}
      <AlertDialog
        open={renameModalOpen && !!renameTarget}
        onOpenChange={setRenameModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제목 변경</AlertDialogTitle>
            <AlertDialogDescription>
              새로운 제목을 입력하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="새 제목"
              className="w-full"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRenameModalOpen(false);
                setRenameTarget(null);
                setNewTitle("");
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (renameTarget && newTitle.trim()) {
                  updateProject({
                    id: renameTarget.id,
                    payload: { title: newTitle.trim() },
                  });
                  setRenameModalOpen(false);
                  setRenameTarget(null);
                  setNewTitle("");
                }
              }}
              disabled={!newTitle.trim() || newTitle === renameTarget?.title}
            >
              변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== 개별 삭제 확인 모달 ========== */}
      <AlertDialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{singleDeleteTarget?.title}"이(가) 영구적으로 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (singleDeleteTarget) {
                  deleteProject(singleDeleteTarget.id);
                  setSingleDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
