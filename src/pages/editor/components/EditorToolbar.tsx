import {
  PanelLeft,
  BookOpen,
  ChevronRight,
  Layout,
  List,
  TableProperties,
  Columns,
  Maximize2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  // Sidebar
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;

  // Title
  currentFolderTitle: string;
  currentSectionTitle: string;
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
    mode: "editor" | "scrivenings" | "outline" | "corkboard"
  ) => void;

  // Split view
  splitViewEnabled: boolean;
  onToggleSplitView: () => void;

  // Focus mode
  onToggleFocusMode: () => void;

  // Right sidebar
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
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
  rightSidebarOpen,
  onToggleRightSidebar,
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

  return (
    <div className="flex items-center gap-2 text-sm overflow-hidden bg-stone-50/50 px-3 py-1.5 rounded-full border border-stone-200/50 shadow-sm">
      <div className="flex items-center gap-1.5 text-stone-400">
        <BookOpen className="w-3.5 h-3.5" />
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
    </div>
  );
}

interface ViewModeButtonsProps {
  viewMode: "editor" | "scrivenings" | "outline" | "corkboard";
  onViewModeChange: (
    mode: "editor" | "scrivenings" | "outline" | "corkboard"
  ) => void;
}

function ViewModeButtons({ viewMode, onViewModeChange }: ViewModeButtonsProps) {
  const modes = [
    { mode: "editor" as const, icon: Layout, label: "단일" },
    { mode: "scrivenings" as const, icon: List, label: "통합" },
    { mode: "outline" as const, icon: TableProperties, label: "개요" },
  ];

  return (
    <div className="flex bg-stone-100/80 p-1 rounded-xl border border-stone-200 shadow-inner">
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
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
