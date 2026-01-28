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
import { BookCardSkeleton } from "@/components/library/BookCardSkeleton";
import { InteractiveLightOverlay } from "@/components/effects";
import { prefetchEditor } from "@/utils/routePrefetch";

import { Button } from "@stolink/ui";
import { Input } from "@stolink/ui";
import { BookCard } from "@/components/library/BookCard";
import { CreateBookModal } from "@/components/library/CreateBookModal";
import { CloneProjectDialog } from "@/components/library/CloneProjectDialog";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
// TODO: useDuplicateProject는 현재 임시로 넣었고 추후 Duplicate기능이 사라지면 없애야함
import {
  useProjects,
  useDeleteProject,
  useUpdateProject,
} from "@/hooks/useProjects";
import { projectService } from "@/services/projectService";
import { useLogout } from "@/hooks/useAuth";
import {
  documentService,
  mapBackendToFrontend,
} from "@/services/documentService";

import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import { getApiData } from "@/utils/apiUtils";
import { compressImage, resolveImageUrl } from "@/utils/imageUtils";
import { useUpdateProjectStatus } from "@/hooks/useUpdateProjectStatus";
import type { ProjectStatusType } from "@/components/library/StatusChip";
import type { Project } from "@/types/project";
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
  const { user } = useAuthStore();
  const { mutate: performLogout } = useLogout();
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
    "updatedAt",
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
    null,
  );

  // ========== 프로젝트 복제 상태 ==========
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<Project | null>(null);

  const {
    data: projectsData,
    isLoading,
    error,
  } = useProjects({ sort: sortBy, order: sortOrder });
  const { mutate: deleteProject, mutateAsync: deleteProjectAsync } =
    useDeleteProject();
  const { mutate: updateProjectStatus } = useUpdateProjectStatus();
  const { mutateAsync: updateProject } = useUpdateProject();

  // ========== 원고 비동기 처리 ==========
  const setJob = useManuscriptJobStore((state) => state.setJob);
  useManuscriptPolling(); // 전역 폴링 시작

  // ========== Query Client ==========
  const queryClient = useQueryClient();

  const projects = projectsData?.projects || [];

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
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
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
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
    // 로그인 상태 확인
    if (!user?.id) {
      toast({
        title: "로그인 필요",
        description: "작품을 생성하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

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
        "Failed to create project",
      );
      const projectId = projectData.id;

      // 2. Create default chapter (folder)
      const chapterResponse = await documentService.create(projectId, {
        type: "folder",
        title: "챕터 1",
      });
      const chapterData = getApiData(
        chapterResponse,
        "Failed to create default chapter",
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
          "Failed to create section",
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
        file.name,
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
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "이미지 크기는 10MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }

      try {
        const compressedBase64 = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 1200,
          quality: 0.8,
        });

        await updateProject({
          id: coverUpdateTargetId,
          payload: { coverImage: compressedBase64 },
        });
        setCoverUpdateTargetId(null);

        toast({
          title: "표지 변경 완료",
          description: "표지가 성공적으로 변경되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("Cover compression failed:", error);
        toast({
          title: "이미지 처리 실패",
          description: "이미지를 처리하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
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
    <div className="min-h-screen bg-paper selection:bg-mocha-100 selection:text-mocha-900">
      <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-xl border-b border-cloud-200/80 shadow-sm">
        {/* Ver.1: SVG 동적 광원 효과 */}
        <InteractiveLightOverlay />
        <div className="max-w-7xl mx-auto px-6 py-5 relative z-10">
          <div className="flex flex-col gap-5">
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-espresso-400" />
                  <Input
                    placeholder="작품명 검색..."
                    className="pl-9 h-9 w-[240px] bg-cloud-50 border-cloud-200 focus:border-mocha-400 focus:ring-1 focus:ring-mocha-200 hover:bg-cloud-100 transition-all text-sm rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="h-9 gap-2 text-espresso-500 hover:text-mocha-700 hover:bg-mocha-50 border border-cloud-200"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs font-medium">
                        필터
                      </span>
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
                      intent="ghost"
                      size="sm"
                      className="h-9 gap-2 text-espresso-500 hover:text-mocha-700 hover:bg-mocha-50 border border-cloud-200"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs font-medium">
                        정렬
                      </span>
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

                <Button
                  intent={isEditMode ? "destructive" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 gap-2",
                    !isEditMode &&
                      "text-espresso-500 hover:text-mocha-700 hover:bg-mocha-50 border border-cloud-200",
                  )}
                  onClick={handleToggleEditMode}
                >
                  {isEditMode ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs font-medium">
                        취소
                      </span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs font-medium">
                        편집
                      </span>
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-1.5 transition-all duration-200 outline-none",
                    viewMode === "grid"
                      ? "bg-mocha-500 text-white shadow-sm"
                      : "text-espresso-400 hover:text-mocha-600 hover:bg-mocha-50",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg p-1.5 transition-all duration-200 outline-none",
                    viewMode === "list"
                      ? "bg-mocha-500 text-white shadow-sm"
                      : "text-espresso-400 hover:text-mocha-600 hover:bg-mocha-50",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>

                <div className="h-6 w-px bg-cloud-200 mx-1 hidden sm:block"></div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="h-10 w-10 rounded-full bg-mocha-500 hover:bg-mocha-600 shadow-md hover:shadow-lg transition-all"
                    >
                      <User className="h-4.5 w-4.5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 p-2 bg-white border border-cloud-200 shadow-lg rounded-xl"
                  >
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-mocha-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-espresso-900">
                            내 계정
                          </p>
                          <p className="text-xs text-espresso-500 truncate max-w-[140px]">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2 bg-cloud-200" />
                    <DropdownMenuItem
                      onClick={() => {
                        performLogout();
                      }}
                      className="px-3 py-2.5 rounded-lg text-status-error hover:bg-red-50 focus:bg-red-50 focus:text-status-error cursor-pointer font-medium"
                    >
                      <LogOut className="mr-2.5 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="relative w-full lg:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-espresso-400" />
              <Input
                placeholder="작품명 검색..."
                className="pl-9 h-10 w-full bg-cloud-50 border-cloud-200 focus:border-mocha-400 focus:ring-1 focus:ring-mocha-200 transition-all text-sm rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-espresso-900 inline-block tracking-tight">
            서재
          </h2>
          {!isLoading && projects.length > 0 && (
            <p className="mt-2 text-espresso-500 text-sm">
              {projects.length}권의 작품이 당신을 기다리고 있어요
            </p>
          )}
        </motion.div>

        <motion.div
          className={cn(
            "grid gap-6 lg:gap-8",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-3xl",
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
            Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="h-full min-h-[320px]"
              >
                <BookCardSkeleton />
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
                onMouseEnter={prefetchEditor}
              >
                <BookCard
                  projectId={project.id}
                  title={project.title}
                  author={project.author || user?.nickname || "Author"}
                  status={
                    project.status === "completed" ? "Complete" : "Writing"
                  }
                  genre={project.genre}
                  coverImage={resolveImageUrl(project.coverImage)}
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
                    } else if (action === "clone") {
                      // 프로젝트 복제
                      setCloneTarget(project);
                      setCloneDialogOpen(true);
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
            <p className="text-espresso-500">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* Empty State - No Projects at all */}
        {projects.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-24 lg:py-32 text-center"
          >
            <div className="relative mb-8">
              <div className="w-28 h-28 bg-mocha-100 rounded-full flex items-center justify-center shadow-paper-floating">
                <FileText className="h-14 w-14 text-mocha-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center border-4 border-paper">
                <Plus className="h-5 w-5 text-sage-600" />
              </div>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-espresso-900 mb-3">
              아직 작품이 없어요
            </h3>
            <p className="text-espresso-500 mb-8 max-w-md leading-relaxed">
              첫 작품을 만들어 당신만의 이야기를 시작해보세요.
              <br />
              복선 관리, AI 분석 등 StoLink의 모든 기능을 경험할 수 있습니다.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="gap-2.5 px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-5 h-5" />새 작품 만들기
              </Button>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* ========== 새 작품 만들기 플로팅 버튼 ========== */}
      {!isEditMode && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 200,
            delay: 0.3,
          }}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Button
            size="lg"
            className="gap-3 bg-mocha-500 hover:bg-mocha-600 text-white shadow-[0_8px_30px_rgba(212,120,90,0.4)] hover:shadow-[0_12px_40px_rgba(212,120,90,0.5)] transition-all duration-300 rounded-full px-8 py-7 text-base font-bold border-none"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />새 작품 만들기
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
            <div className="bg-paper border border-cloud-200 text-espresso-700 px-6 py-3 rounded-full shadow-xl backdrop-blur-sm flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedBooks.length}개 선택됨
              </span>
              <div className="w-px h-5 bg-cloud-200" />
              <Button
                intent="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 gap-2 font-semibold"
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
              className="w-full bg-cloud-50 border-cloud-200 focus:border-mocha-400 focus:ring-1 focus:ring-mocha-200 rounded-lg"
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

      {/* ========== 프로젝트 복제 다이얼로그 ========== */}
      {cloneTarget && (
        <CloneProjectDialog
          project={cloneTarget}
          open={cloneDialogOpen}
          onOpenChange={setCloneDialogOpen}
        />
      )}
    </div>
  );
}
