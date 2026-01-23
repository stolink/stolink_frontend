import { Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft } from "lucide-react";
import { ActivityBar } from "./ActivityBar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ProjectAnalysisListener } from "@/components/common/ProjectAnalysisListener";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useEditorStore, useAnalysisBufferStore } from "@/stores";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@stolink/ui";
import { Input } from "@stolink/ui";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ProjectLayout - Header-First Layout (Dashboard Style)
 *
 * Structure:
 * - Header (Top, Full Width): Home/Back navigation, Project Title, Global Actions
 * - Body (Bottom): ActivityBar (Left) + Main Content (Right)
 */
export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: project } = useProject(id || "", { enabled: !!id });
  const { mutate: updateProject } = useUpdateProject();
  const { saveStatus, lastSavedAt } = useEditorStore();
  const {
    isAnalyzing,
    currentJobType,
    progress: analysisProgress,
  } = useAnalysisBufferStore();

  // Check Demo Mode
  const isDemo = location.pathname.includes("/demo");
  const projectTitle = project?.title || "제목 없음";

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(projectTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project?.title) {
      // eslint-disable-next-line
      setEditedTitle(project.title);
    }
  }, [project?.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  if (!id) {
    return null;
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== projectTitle) {
      updateProject({
        id,
        payload: { title: editedTitle.trim() },
      });
    } else {
      setEditedTitle(projectTitle);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(projectTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground min-w-[1024px]">
      <ProjectAnalysisListener />
      {/* Global Header - Fixed Top */}
      {!isDemo && (
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 shadow-sm z-20 relative">
          <div className="flex items-center gap-2 flex-1 min-w-0 relative h-full">
            {/* Analysis/Image Progress Bar (Centered in Nav Area) */}
            <AnimatePresence>
              {isAnalyzing &&
                (currentJobType === "analysis" ||
                  currentJobType === "image") && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-48 h-1 bg-primary/10 rounded-full overflow-hidden border border-primary/5 shadow-sm"
                    >
                      <motion.div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(164,119,100,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisProgress}%` }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 120,
                        }}
                      />
                    </motion.div>
                  </div>
                )}
            </AnimatePresence>

            {/* Home / Back to Library Button */}
            <Button
              intent="ghost"
              size="sm"
              onClick={() => navigate("/library")}
              className="group gap-1.5 pl-2 pr-3 hover:bg-muted text-muted-foreground hover:text-primary transition-colors h-9 relative z-10"
              title="서재로 돌아가기"
            >
              <ChevronLeft className="w-4 h-4 opacity-70 group-hover:-translate-x-0.5 transition-transform" />
              <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium hidden sm:inline-block">
                서재
              </span>
            </Button>

            <div className="w-px h-4 bg-border mx-2 shrink-0" />

            {/* Editable Project Title */}
            <div className="flex flex-col justify-center min-w-0">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm font-bold px-2 min-w-[200px]"
                />
              ) : (
                <h1
                  className="text-sm font-bold text-foreground hover:bg-accent/50 rounded px-2 py-0.5 cursor-pointer transition-colors truncate leading-tight"
                  onClick={() => setIsEditingTitle(true)}
                  title="클릭하여 제목 수정"
                >
                  {projectTitle}
                </h1>
              )}

              <div className="flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground leading-none">
                {saveStatus === "saved" && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <span className="text-green-600/80 font-medium">
                      저장됨
                    </span>
                  </>
                )}
                {saveStatus === "saving" && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-600/80 font-medium">
                      저장 중...
                    </span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-600/80 font-medium">
                      편집 중
                    </span>
                  </>
                )}
                {lastSavedAt && saveStatus === "saved" && (
                  <span className="text-muted-foreground/50 ml-1">
                    {new Date(lastSavedAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Area - Placeholder for Global Actions */}
          <div className="flex items-center gap-2">
            {/* Future: User Profile, Notifications etc. */}
          </div>
        </header>
      )}

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Activity Bar - Sidebar */}
        <ActivityBar projectId={id} />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden w-full relative bg-background">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
