import {
  PanelLeft,
  BookOpen,
  ChevronRight,
  Layout,
  List,
  TableProperties,
  LayoutGrid,
  Columns,
  Maximize2,
  Settings,
  Eye,
  Type,
  History,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  selectedSectionId: string | null;

  // Character count
  characterCount: number;

  // View mode
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  onViewModeChange: (
    newMode: "editor" | "scrivenings" | "outline" | "corkboard",
    currentMode: "editor" | "scrivenings" | "outline" | "corkboard"
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
}: EditorToolbarProps) {
  return (
    <div className="h-12 border-b flex items-center justify-between px-4 shrink-0 bg-white z-10">
      <div className="flex items-center gap-3">
        {!isSidebarVisible && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors mr-2"
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
          <span className="text-xs text-stone-400">
            ({characterCount.toLocaleString()}자)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ViewModeButtons
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        <div className="h-4 w-px bg-stone-200 mx-1" />

        <div className="flex items-center gap-1">
          {onShowReader && (
            <button
              onClick={onShowReader}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg transition-all border border-stone-300 hover:border-stone-400 flex items-center gap-1.5 font-medium text-xs shadow-sm"
              title="미리보기 (작품을 읽기 모드로 확인)"
            >
              <Eye className="w-3.5 h-3.5" />
              미리보기
            </button>
          )}

          <div className="h-4 w-px bg-stone-200 mx-1" />

          <button
            onClick={onToggleSplitView}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              splitViewEnabled
                ? "bg-sage-100 text-sage-700"
                : "hover:bg-stone-100 text-stone-500"
            )}
            title="분할 화면"
          >
            <Columns className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTypewriterMode}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isTypewriterMode
                ? "bg-sage-100 text-sage-700"
                : "hover:bg-stone-100 text-stone-500"
            )}
            title="타자기 모드 (커서를 화면 중앙에 고정)"
          >
            <Type className="w-4 h-4" />
          </button>

          {onToggleSnapshot && (
            <button
              onClick={onToggleSnapshot}
              className="p-1.5 rounded-lg transition-colors hover:bg-stone-100 text-stone-500"
              title="스냅샷 (문서 버전 관리)"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="p-1.5 rounded-lg transition-colors hover:bg-stone-100 text-stone-500"
              title="내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleFocusMode}
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
            title="집중 모드"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-stone-200 mx-1" />
        <button
          onClick={onToggleRightSidebar}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            rightSidebarOpen
              ? "bg-sage-100 text-sage-700"
              : "hover:bg-stone-100 text-stone-500"
          )}
        >
          <Settings className="w-4 h-4" />
        </button>
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
    <div className="flex items-center gap-2 text-sm overflow-hidden bg-stone-50/50 px-3 py-1.5 rounded-full border border-stone-200/50 shadow-sm max-w-xl">
      <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />

      {usePath ? (
        // Full path breadcrumb (루트 > 챕터 > 섹션 > 하위섹션)
        <div className="flex items-center gap-1.5 overflow-hidden">
          {sectionPath.map((item, index) => {
            const isLast = index === sectionPath.length - 1;
            return (
              <div key={item.id} className="flex items-center gap-1.5 shrink-0">
                {isLast && isEditingTitle ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => onEditedTitleChange(e.target.value)}
                    onBlur={onSaveTitle}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="font-bold text-stone-800 bg-transparent focus:outline-none min-w-[150px]"
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
                        ? "font-bold text-stone-800 hover:text-sage-700"
                        : "font-medium text-stone-500"
                    )}
                    title={
                      isLast && !isDemo ? "클릭하여 제목 편집" : item.title
                    }
                  >
                    {item.title}
                  </button>
                )}
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback: old 2-level breadcrumb
        <>
          <div className="flex items-center gap-1.5 text-stone-400">
            <span className="font-medium truncate max-w-[120px]">
              {currentFolderTitle || "챕터"}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => onEditedTitleChange(e.target.value)}
                onBlur={onSaveTitle}
                onKeyDown={handleKeyDown}
                autoFocus
                className="font-bold text-stone-800 bg-transparent focus:outline-none min-w-[150px]"
              />
            ) : (
              <button
                onClick={() => {
                  if (!isDemo && selectedSectionId) {
                    onStartEditTitle();
                  }
                }}
                className="font-bold text-stone-800 truncate max-w-[200px] hover:text-sage-700 transition-colors"
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
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  onViewModeChange: (
    newMode: "editor" | "scrivenings" | "outline" | "corkboard",
    currentMode: "editor" | "scrivenings" | "outline" | "corkboard"
  ) => void;
}

function ViewModeButtons({ viewMode, onViewModeChange }: ViewModeButtonsProps) {
  const modes = [
    { mode: "editor" as const, icon: Layout, label: "단일" },
    { mode: "scrivenings" as const, icon: List, label: "통합" },
    { mode: "outline" as const, icon: TableProperties, label: "개요" },
    { mode: "corkboard" as const, icon: LayoutGrid, label: "카드" },
  ];

  return (
    <div className="flex bg-stone-100/80 p-1 rounded-xl border border-stone-200 shadow-inner">
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode, viewMode)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold",
            viewMode === mode
              ? "bg-white text-sage-600 shadow-sm ring-1 ring-black/5"
              : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
