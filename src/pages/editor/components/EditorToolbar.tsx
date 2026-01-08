import {
  PanelLeft,
  PanelRight,
  BookOpen,
  ChevronRight,
  Layout,
  List,
  TableProperties,
  Columns,
  Maximize2,
  Settings,
  Eye,
  Type,
  History,
  Download,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EditorSettingsPanel } from "@/components/editor/settings/EditorSettingsPanel";

import { motion } from "framer-motion";

interface EditorToolbarProps {
  // Sidebar
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;

  // Title
  currentFolderTitle: string;
  currentSectionTitle: string;
  sectionPath: Array<{ id: string; title: string }>;
  isEditingTitle: boolean;
  editedTitle: string;
  onEditedTitleChange: (title: string) => void;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onCancelEditTitle: () => void;
  isDemo: boolean;
  selectedSectionId: string | null; // Character count
  characterCount: number;

  // View mode
  viewMode: "editor" | "scrivenings" | "outline";
  onViewModeChange: (
    newMode: "editor" | "scrivenings" | "outline",
    currentMode: "editor" | "scrivenings" | "outline",
  ) => void;

  // Split view
  splitViewEnabled: boolean;
  onToggleSplitView: () => void;

  // Focus mode
  onToggleFocusMode: () => void;

  // Typewriter mode
  isTypewriterMode: boolean;
  onToggleTypewriterMode: () => void;

  // Right sidebar
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;

  // Preview
  onShowReader?: () => void;

  // Snapshot
  onToggleSnapshot?: () => void;

  // Export
  onExport?: () => void;

  // Analysis Status
  analysisStatus: "idle" | "analyzing" | "completed" | "error";
  analysisProgress?: number;
  onTriggerAnalysis?: () => void;
  onResetAnalysis?: () => void;
  // Pagination removed for infinite scroll
}

/**
 * 에디터 상단 툴바 컴포넌트
 * EditorPage에서 추출하여 복잡도 감소
 */
export function EditorToolbar({
  isSidebarVisible,
  onToggleSidebar,
  currentFolderTitle,
  currentSectionTitle,
  sectionPath,
  isEditingTitle,
  editedTitle,
  onEditedTitleChange,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  isDemo,
  selectedSectionId,
  characterCount,
  viewMode,
  onViewModeChange,
  splitViewEnabled,
  onToggleSplitView,
  onToggleFocusMode,
  isTypewriterMode,
  onToggleTypewriterMode,
  rightSidebarOpen,
  onToggleRightSidebar,
  onShowReader,
  onToggleSnapshot,
  onExport,
  analysisStatus,
  analysisProgress,
  onTriggerAnalysis,
  onResetAnalysis,
  // page, setPage, totalPages removed
}: EditorToolbarProps) {
  return (
    <div className="!h-9 min-h-[36px] max-h-[36px] border-b border-border flex items-center justify-between px-3 shrink-0 bg-card overflow-hidden">
      <div className="flex items-center gap-3">
        {!isSidebarVisible && (
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-accent rounded-lg text-muted-foreground transition-colors mr-2"
            title="사이드바 열기"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumb Style Title */}
        <TitleBreadcrumb
          currentFolderTitle={currentFolderTitle}
          currentSectionTitle={currentSectionTitle}
          sectionPath={sectionPath}
          isEditingTitle={isEditingTitle}
          editedTitle={editedTitle}
          onEditedTitleChange={onEditedTitleChange}
          onStartEditTitle={onStartEditTitle}
          onSaveTitle={onSaveTitle}
          onCancelEditTitle={onCancelEditTitle}
          isDemo={isDemo}
          selectedSectionId={selectedSectionId}
        />

        {characterCount > 0 && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full transition-colors text-muted-foreground bg-secondary",
            )}
          >
            {characterCount.toLocaleString()}자
          </span>
        )}

        {/* Manual Analysis Trigger */}
        {onTriggerAnalysis && (
          <button
            onClick={onTriggerAnalysis}
            disabled={analysisStatus === "analyzing"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              analysisStatus === "analyzing"
                ? "bg-primary/10 text-primary cursor-not-allowed"
                : "bg-primary/5 hover:bg-primary/10 text-primary hover:scale-105",
            )}
            title="AI 분석 실행"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>분석</span>
          </button>
        )}

        {/* Status Indicators (Reduced visibility as button shows status) */}
        {analysisStatus === "analyzing" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-primary animate-pulse font-medium">
              분석중...
            </span>
            {onResetAnalysis && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetAnalysis();
                }}
                className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                title="분석 강제 종료 (상태 초기화)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {analysisStatus === "completed" && (
          <span className="text-xs text-green-500 font-medium">분석 완료</span>
        )}
        {analysisStatus === "error" && (
          <span className="text-xs text-destructive font-medium">
            분석 실패
          </span>
        )}

        {/* Pagination Controls Removed */}
      </div>

      <div className="flex items-center gap-2">
        <ViewModeButtons
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center gap-1">
          {onShowReader && (
            <button
              onClick={onShowReader}
              className="px-3 py-1 bg-secondary hover:bg-accent text-foreground rounded-lg transition-all border border-border hover:border-primary/30 flex items-center gap-1 font-medium text-xs shadow-sm"
              title="미리보기 (작품을 읽기 모드로 확인)"
            >
              <Eye className="w-3.5 h-3.5" />
              미리보기
            </button>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={onToggleSplitView}
            className={cn(
              "p-1 rounded-lg transition-colors",
              splitViewEnabled
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-muted-foreground",
            )}
            title="분할 화면"
          >
            <Columns className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTypewriterMode}
            className={cn(
              "p-1 rounded-lg transition-colors",
              isTypewriterMode
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-muted-foreground",
            )}
            title="타자기 모드 (커서를 화면 중앙에 고정)"
          >
            <Type className="w-4 h-4" />
          </button>

          {onToggleSnapshot && (
            <button
              onClick={onToggleSnapshot}
              className="p-1 rounded-lg transition-colors hover:bg-accent text-muted-foreground"
              title="스냅샷 (문서 버전 관리)"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="p-1 rounded-lg transition-colors hover:bg-accent text-muted-foreground"
              title="내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleFocusMode}
            className="p-1 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            title="집중 모드"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Editor Settings Sheet - 톱니바퀴 아이콘 */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-1 rounded-lg transition-colors hover:bg-accent text-muted-foreground"
              title="에디터 설정"
            >
              <Settings className="w-4 h-4" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[400px] sm:w-[450px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>에디터 설정</SheetTitle>
            </SheetHeader>
            <EditorSettingsPanel className="mt-4" />
          </SheetContent>
        </Sheet>

        {/* Right Sidebar Toggle - 패널 아이콘 */}
        <button
          onClick={onToggleRightSidebar}
          className={cn(
            "p-1 rounded-lg transition-colors",
            rightSidebarOpen
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent text-muted-foreground",
          )}
          title="복선/AI 사이드바"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

      {/* Analysis Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none z-50">
        {(analysisStatus === "analyzing" || analysisStatus === "completed") && (
          <motion.div
            className={cn(
              "h-full shadow-[0_0_8px_rgba(var(--primary),0.5)]",
              analysisStatus === "completed" ? "bg-green-500" : "bg-primary",
            )}
            initial={{ width: 0, opacity: 1 }}
            animate={{
              width: `${analysisProgress || 0}%`,
              opacity: analysisStatus === "completed" ? [1, 1, 0] : 1,
            }}
            transition={{
              width: { duration: 0.5, ease: "easeInOut" },
              opacity: { duration: 0.5, delay: 2 },
            }}
          />
        )}
      </div>
    </div>
  );
}

// --- 서브 컴포넌트들 ---

interface TitleBreadcrumbProps {
  currentFolderTitle: string;
  currentSectionTitle: string;
  sectionPath: Array<{ id: string; title: string }>;
  isEditingTitle: boolean;
  editedTitle: string;
  onEditedTitleChange: (title: string) => void;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onCancelEditTitle: () => void;
  isDemo: boolean;
  selectedSectionId: string | null;
}

function TitleBreadcrumb({
  currentFolderTitle,
  currentSectionTitle,
  sectionPath,
  isEditingTitle,
  editedTitle,
  onEditedTitleChange,
  onStartEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  isDemo,
  selectedSectionId,
}: TitleBreadcrumbProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveTitle();
    }
    if (e.key === "Escape") {
      onCancelEditTitle();
    }
  };

  // Use sectionPath if available, otherwise fallback to old breadcrumb
  const usePath = sectionPath.length > 0;

  return (
    <div className="flex items-center gap-2 text-sm overflow-hidden bg-secondary/50 px-3 py-1 rounded-full border border-border/50 shadow-sm max-w-xl">
      <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      {usePath ? (
        // Full path breadcrumb (루트 > 챕터 > 섹션 > 하위섹션)
        <div className="flex items-center gap-1 overflow-hidden">
          {sectionPath.map((item, index) => {
            const isLast = index === sectionPath.length - 1;
            return (
              <div key={item.id} className="flex items-center gap-1 shrink-0">
                {isLast && isEditingTitle ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => onEditedTitleChange(e.target.value)}
                    onBlur={onSaveTitle}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="font-bold text-foreground bg-transparent focus:outline-none min-w-[150px]"
                  />
                ) : (
                  <button
                    onClick={() => {
                      if (isLast && !isDemo && selectedSectionId) {
                        onStartEditTitle();
                      }
                    }}
                    className={cn(
                      "truncate max-w-[150px] transition-colors",
                      isLast
                        ? "font-bold text-foreground hover:text-primary"
                        : "font-medium text-muted-foreground",
                    )}
                    title={
                      isLast && !isDemo ? "클릭하여 제목 편집" : item.title
                    }
                  >
                    {item.title}
                  </button>
                )}
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback: old 2-level breadcrumb
        <>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-medium truncate max-w-[120px]">
              {currentFolderTitle || "챕터"}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <div className="flex items-center gap-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => onEditedTitleChange(e.target.value)}
                onBlur={onSaveTitle}
                onKeyDown={handleKeyDown}
                autoFocus
                className="font-bold text-foreground bg-transparent focus:outline-none min-w-[150px]"
              />
            ) : (
              <button
                onClick={() => {
                  if (!isDemo && selectedSectionId) {
                    onStartEditTitle();
                  }
                }}
                className="font-bold text-foreground truncate max-w-[200px] hover:text-primary transition-colors"
                title={isDemo ? "데모 모드" : "클릭하여 제목 편집"}
              >
                {currentSectionTitle || "섹션을 선택하세요"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface ViewModeButtonsProps {
  viewMode: "editor" | "scrivenings" | "outline";
  onViewModeChange: (
    newMode: "editor" | "scrivenings" | "outline",
    currentMode: "editor" | "scrivenings" | "outline",
  ) => void;
}

function ViewModeButtons({ viewMode, onViewModeChange }: ViewModeButtonsProps) {
  const modes = [
    { mode: "editor" as const, icon: Layout, label: "단일" },
    { mode: "scrivenings" as const, icon: List, label: "통합" },
    { mode: "outline" as const, icon: TableProperties, label: "개요" },
  ];

  return (
    <div className="flex bg-secondary/80 p-0.5 rounded-lg border border-border shadow-inner">
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode, viewMode)}
          title={label}
          className={cn(
            "flex items-center justify-center p-1 rounded-md transition-all duration-200",
            viewMode === mode
              ? "bg-card text-primary shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50",
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
