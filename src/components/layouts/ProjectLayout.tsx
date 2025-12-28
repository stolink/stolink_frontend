import { useState, useMemo } from "react";
import {
  NavLink,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  PenLine,
  BookOpen,
  BarChart3,
  Download,
  Settings,
  User,
  LogOut,
  Eye,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore, useEditorStore } from "@/stores";
import { BookReaderModal } from "@/components/common/BookReaderModal";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import type { Document } from "@/types/document";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
// 로고 이미지를 import하여 번들링 호환성 확보
import mainLogo from "@/assets/main_logo.png";

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isFocusMode, saveStatus } = useEditorStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReader, setShowReader] = useState(false);

  // Project data
  const { data: project } = useProject(id || "");
  const updateProject = useUpdateProject();

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // 에디터 페이지이고 집중 모드일 때 헤더 숨김
  const isEditorPage = location.pathname.includes("/editor");
  const shouldHideHeader = isEditorPage && isFocusMode;

  // ============================================================
  // 미리보기용 로컬 데이터 가져오기 (실시간 반영)
  // useDocumentStore를 사용하여 Ctrl+S 없이도 편집 중인 내용 표시
  // ============================================================
  const allDocuments = useDocumentStore((state) => state.documents);
  const localDocuments = useMemo(
    () => Object.values(allDocuments).filter((doc) => doc.projectId === id),
    [allDocuments, id],
  );

  /**
   * Document 배열을 BookReaderModal의 Chapter 형식으로 변환
   * - type이 'text'인 문서만 필터링 (폴더 제외)
   * - order 순서대로 정렬
   * - id, title, content 필드만 추출
   */
  const previewChapters = useMemo(() => {
    return (localDocuments ?? [])
      .filter((doc): doc is Document => doc?.type === "text")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content ?? "",
      }));
  }, [localDocuments]);

  // 현재 프로젝트 제목 (첫 번째 폴더 또는 기본값)
  const projectTitle = useMemo(() => {
    const folder = localDocuments?.find(
      (doc: Document) => doc.type === "folder",
    );
    return folder?.title || "내 작품";
  }, [localDocuments]);

  const navItems = [
    { to: `/projects/${id}/editor`, label: "에디터", icon: PenLine },
    { to: `/projects/${id}/studio`, label: "스튜디오", icon: Clapperboard },
    { to: `/projects/${id}/world`, label: "설정집", icon: BookOpen },
    { to: `/projects/${id}/stats`, label: "통계", icon: BarChart3 },
    { to: `/projects/${id}/export`, label: "파일", icon: Download },
    { to: `/projects/${id}/settings`, label: "관리", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen bg-paper">
      {/* Header */}
      {!shouldHideHeader && (
        <header className="h-14 border-b bg-paper flex items-center justify-between px-4 shrink-0 z-20 relative">
          {/* Left: Navigation & Title */}
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/library")}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-stone-100 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span className="text-sm font-medium">서재</span>
              </button>
              <div className="h-6 w-px bg-stone-200" />
              <img src={mainLogo} alt="Sto-Link" className="h-12 w-auto" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => {
                      if (
                        editedTitle.trim() &&
                        editedTitle !== project?.title &&
                        id
                      ) {
                        updateProject.mutate({
                          id,
                          payload: { title: editedTitle.trim() },
                        });
                      }
                      setIsEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (
                          editedTitle.trim() &&
                          editedTitle !== project?.title &&
                          id
                        ) {
                          updateProject.mutate({
                            id,
                            payload: { title: editedTitle.trim() },
                          });
                        }
                        setIsEditingTitle(false);
                      }
                      if (e.key === "Escape") {
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="font-heading font-semibold text-sm text-foreground bg-transparent border-b border-sage-400 focus:outline-none min-w-[120px]"
                  />
                ) : (
                  <button
                    onClick={() => {
                      if (project?.title) {
                        setEditedTitle(project.title);
                        setIsEditingTitle(true);
                      }
                    }}
                    className="font-heading font-semibold text-sm text-foreground hover:text-sage-600 transition-colors cursor-pointer"
                    title="클릭하여 제목 편집"
                  >
                    {project?.title || "프로젝트"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    saveStatus === "saved" && "bg-green-500",
                    saveStatus === "saving" && "bg-yellow-500 animate-pulse",
                    saveStatus === "unsaved" && "bg-amber-500",
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {saveStatus === "saved" && "저장 완료"}
                  {saveStatus === "saving" && "저장 중..."}
                  {saveStatus === "unsaved" && "편집 중"}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center p-1 bg-stone-100/50 rounded-lg border border-transparent">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={item.to.includes("world") ? "world-tab" : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white text-sage-600 shadow-sm border-stone-200"
                      : "text-muted-foreground hover:text-foreground hover:bg-stone-200/50",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-3 min-w-[240px] justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowReader(true)}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden lg:inline">미리보기</span>
            </Button>

            {/* User Menu Dropdown Trigger (Avatar) */}
            <div className="relative pl-2 border-l border-stone-200">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full border-2 border-white bg-sage-200 flex items-center justify-center text-xs font-medium text-sage-700 hover:ring-2 hover:ring-sage-200 transition-all focus:outline-none focus:ring-2 focus:ring-sage-400"
              >
                {user?.nickname?.[0] || "ME"}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border z-50 py-2 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b">
                      <p className="font-medium text-sm">
                        {user?.nickname || "작가님"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    <div className="py-1">
                      <NavLink
                        to="/library"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-stone-50 transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />내 서재
                      </NavLink>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-stone-50 transition-colors">
                        <User className="h-4 w-4" />
                        프로필 설정
                      </button>
                    </div>
                    <div className="border-t pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Book Reader Modal - 로컬 데이터 실시간 반영 */}
      <BookReaderModal
        isOpen={showReader}
        onClose={() => setShowReader(false)}
        chapters={previewChapters}
        bookTitle={projectTitle}
      />
    </div>
  );
}
