import { Outlet, useParams, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { ActivityBar } from "./ActivityBar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useProject } from "@/hooks/useProjects";
import { useEditorStore } from "@/stores";

/**
 * ProjectLayout - VS Code + Linear 스타일 레이아웃
 *
 * 구조:
 * - Global Header: 프로젝트 정보, 저장 상태 (모든 페이지 공통)
 * - ActivityBar: 페이지 간 전환 (좌측 세로)
 * - Page Content: 각 페이지별 콘텐츠
 */
export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: project } = useProject(id || "", { enabled: !!id });
  const { saveStatus, lastSavedAt } = useEditorStore();

  if (!id) {
    return null;
  }

  // 데모 모드 체크 (경로에 demo 포함 시)
  const isDemo = location.pathname.includes("/demo");
  const projectTitle = project?.title || "제목 없음";

  return (
    <div className="flex flex-col h-screen bg-paper min-w-[1024px]">
      {/* Global Header - 모든 페이지 공통 */}
      {!isDemo && (
        <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sage-600" />
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-stone-900">
                {projectTitle}
              </h1>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  {saveStatus === "saved" && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-green-600 font-medium">저장됨</span>
                    </>
                  )}
                  {saveStatus === "saving" && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-blue-600 font-medium">저장 중...</span>
                    </>
                  )}
                  {saveStatus === "unsaved" && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-amber-600 font-medium">편집 중</span>
                    </>
                  )}
                  {lastSavedAt && saveStatus === "saved" && (
                    <span className="text-stone-400">
                      • {new Date(lastSavedAt).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 우측 영역 (필요시 추가 액션 버튼) */}
          <div className="flex items-center gap-2">
            {/* 공유, 설정 등 글로벌 액션 */}
          </div>
        </header>
      )}

      {/* Content Area - ActivityBar + Pages */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar (좌측 세로 아이콘 바) */}
        <ActivityBar projectId={id} />

        {/* 메인 콘텐츠 (각 페이지가 자체 레이아웃 관리) */}
        <main className="flex-1 overflow-hidden w-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
