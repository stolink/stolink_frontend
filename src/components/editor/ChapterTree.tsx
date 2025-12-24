import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ChapterNode {
  id: string;
  title: string;
  type: "part" | "chapter" | "section";
  characterCount?: number;
  isPlot?: boolean;
  children?: ChapterNode[];
}

interface ChapterTreeProps {
  chapters?: ChapterNode[];
  selectedChapterId?: string;
  onSelectChapter?: (chapterId: string) => void;
  onAddChapter?: (title: string, parentId?: string) => void;
}

// 기본 Mock 데이터 (프로젝트 에디터용)
const defaultChapters: ChapterNode[] = [
  {
    id: "part-1",
    title: "1부: 여정의 시작",
    type: "part",
    children: [
      {
        id: "chapter-1-1",
        title: "1.1 운명의 밤",
        type: "chapter",
        characterCount: 2340,
      },
      {
        id: "chapter-1-2",
        title: "1.2 첫 만남",
        type: "chapter",
        characterCount: 1890,
      },
      {
        id: "chapter-1-3",
        title: "1.3 시련",
        type: "chapter",
        characterCount: 0,
        isPlot: true,
      },
    ],
  },
  {
    id: "part-2",
    title: "2부: 성장",
    type: "part",
    children: [
      {
        id: "chapter-2-1",
        title: "2.1 수련",
        type: "chapter",
        characterCount: 3200,
      },
    ],
  },
];

interface ChapterTreeItemProps {
  node: ChapterNode;
  level?: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

function ChapterTreeItem({
  node,
  level = 0,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onDuplicate,
}: ChapterTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const hasChildren = (node.children?.length || 0) > 0;
  const isPart = node.type === "part";
  const isSelected = node.id === selectedId;

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = () => {
    if (!isPart && onSelect && !isRenaming) {
      onSelect(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 기본 브라우저 컨텍스트 메뉴 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    setMenuPosition({ x: e.clientX, y: e.clientY }); // 마우스 위치에 메뉴 표시
    setShowMenu(true);
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.bottom });
    setShowMenu(true);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== node.title) {
      onRename?.(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  // 스크리브너 스타일 컨텍스트 메뉴 액션
  const menuActions = [
    // 그룹 1: 생성
    {
      label: "새 문서",
      icon: "📄",
      action: () => {
        setShowMenu(false);
        onAddChild?.(node.id);
      },
      group: "create",
    },
    {
      label: "새 폴더",
      icon: "📁",
      action: () => {
        setShowMenu(false); /* TODO: onAddFolder */
      },
      group: "create",
    },
    { type: "divider" as const },

    // 그룹 2: 편집
    {
      label: "이름 변경",
      icon: "✏️",
      shortcut: "Enter",
      action: () => {
        setShowMenu(false);
        setIsRenaming(true);
      },
      group: "edit",
    },
    {
      label: "복제",
      icon: "📋",
      shortcut: "⌘D",
      action: () => {
        setShowMenu(false);
        onDuplicate?.(node.id);
      },
      group: "edit",
    },
    { type: "divider" as const },

    // 그룹 3: 정렬/이동
    {
      label: "위로 이동",
      icon: "⬆️",
      action: () => {
        setShowMenu(false); /* TODO: onMoveUp */
      },
      group: "move",
    },
    {
      label: "아래로 이동",
      icon: "⬇️",
      action: () => {
        setShowMenu(false); /* TODO: onMoveDown */
      },
      group: "move",
    },
    { type: "divider" as const },

    // 그룹 4: 변환
    ...(isPart
      ? []
      : [
          {
            label: "폴더로 변환",
            icon: "📂",
            action: () => {
              setShowMenu(false); /* TODO: onConvertToFolder */
            },
            group: "convert",
          },
        ]),
    ...(!isPart
      ? []
      : [
          {
            label: "문서로 변환",
            icon: "📄",
            action: () => {
              setShowMenu(false); /* TODO: onConvertToDoc */
            },
            group: "convert",
          },
        ]),
    { type: "divider" as const },

    // 그룹 5: 삭제
    {
      label: "휴지통으로 이동",
      icon: "🗑️",
      action: () => {
        setShowMenu(false);
        onDelete?.(node.id);
      },
      danger: true,
      group: "delete",
    },
  ].filter((item) => item.type === "divider" || item.action);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 px-2 py-1 rounded-md cursor-pointer group select-none",
          "hover:bg-paper-hover transition-all duration-200 ease-organic",
          isSelected
            ? "bg-sage-100 text-sage-900 font-medium shadow-sm"
            : "text-ink",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse */}
        <div className="flex-shrink-0 mt-0.5">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-stone-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isPart ? (
            <Folder className="h-4 w-4 text-sage-500" />
          ) : node.type === "chapter" ? (
            <FileText className="h-4 w-4 text-amber-500" />
          ) : (
            <FileText className="h-4 w-4 text-stone-400" />
          )}
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setRenameValue(node.title);
                }
              }}
              className="text-sm bg-white border border-sage-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-sage-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "text-sm leading-snug break-words",
                node.isPlot && "text-muted-foreground italic",
              )}
            >
              {node.isPlot && (
                <span className="text-xs text-sage-500 mr-1">[플롯]</span>
              )}
              {node.title}
            </span>
          )}

          {/* Character count */}
          {!isPart && (node.characterCount || 0) > 0 && !isRenaming && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {node.characterCount?.toLocaleString()}자
            </span>
          )}
        </div>

        {/* Add child button for parts */}
        {isPart && onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-sage-100 rounded shrink-0 self-start transition-opacity"
            title="챕터 추가"
          >
            <Plus className="h-3 w-3 text-sage-500" />
          </button>
        )}

        {/* More menu button */}
        <button
          onClick={handleMenuButtonClick}
          className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-stone-200 rounded shrink-0 self-start transition-opacity"
        >
          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Context Menu Dropdown */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border py-1 min-w-[180px] animate-in fade-in zoom-in-95"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            {menuActions.map((item, idx) =>
              item.type === "divider" ? (
                <div key={idx} className="h-px bg-stone-200 my-1" />
              ) : (
                <button
                  key={idx}
                  onClick={item.action}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-stone-50 transition-colors text-left",
                    item.danger && "text-red-500 hover:bg-red-50",
                  )}
                >
                  <span className="w-5">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-muted-foreground">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
        </>
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <ChapterTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChapterTree({
  chapters: initialChapters = defaultChapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
}: ChapterTreeProps) {
  // Use prop directly instead of state to avoid infinite loop
  const chapters = initialChapters;
  const [isAdding, setIsAdding] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingToParent, setAddingToParent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;

    // Only call the parent callback - let the store handle creation
    // The new chapter will come back via the chapters prop
    onAddChapter?.(newChapterTitle.trim(), addingToParent || undefined);

    // Reset form
    setNewChapterTitle("");
    setIsAdding(false);
    setAddingToParent(null);
  };

  const handleStartAddChild = (parentId: string) => {
    setAddingToParent(parentId);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setNewChapterTitle("");
    setIsAdding(false);
    setAddingToParent(null);
  };

  // 빈 공간 우클릭 메뉴 상태
  const [showEmptyMenu, setShowEmptyMenu] = useState(false);
  const [emptyMenuPosition, setEmptyMenuPosition] = useState({ x: 0, y: 0 });

  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    // 이미 아이템에서 처리된 이벤트는 무시
    if (e.defaultPrevented) return;

    e.preventDefault();
    setEmptyMenuPosition({ x: e.clientX, y: e.clientY });
    setShowEmptyMenu(true);
  };

  const emptyMenuActions = [
    {
      label: "새 문서",
      icon: "📄",
      action: () => {
        setShowEmptyMenu(false);
        setIsAdding(true);
      },
    },
    {
      label: "새 폴더",
      icon: "📁",
      action: () => {
        setShowEmptyMenu(false); /* TODO: onAddFolder */
      },
    },
    { type: "divider" as const },
    {
      label: "전체 펼치기",
      icon: "⬇️",
      action: () => {
        setShowEmptyMenu(false); /* TODO: expandAll */
      },
    },
    {
      label: "전체 접기",
      icon: "⬆️",
      action: () => {
        setShowEmptyMenu(false); /* TODO: collapseAll */
      },
    },
  ];

  return (
    <div
      className="flex-1 flex flex-col space-y-1"
      onContextMenu={handleEmptyContextMenu}
    >
      {chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-stone-300" />
          </div>
          <p className="text-sm font-medium text-stone-600 mb-1">
            챕터가 비어있습니다
          </p>
          <p className="text-xs text-stone-400 mb-4">
            새로운 챕터를 만들어 이야기를 시작하세요.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />첫 챕터 만들기
          </Button>
        </div>
      ) : (
        chapters.map((node) => (
          <ChapterTreeItem
            key={node.id}
            node={node}
            selectedId={selectedChapterId}
            onSelect={onSelectChapter}
            onAddChild={handleStartAddChild}
          />
        ))
      )}

      {/* Inline Add Form */}
      {chapters.length > 0 /* 목록이 있을 때만 하단 추가 버튼 표시 */ &&
        (isAdding ? (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-sage-50 rounded-md border border-sage-200 mt-1">
            <FileText className="h-4 w-4 text-sage-400 shrink-0" />
            <Input
              ref={inputRef}
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddChapter();
                if (e.key === "Escape") handleCancel();
              }}
              placeholder="새 챕터 제목..."
              className="h-7 text-sm border-0 bg-transparent focus-visible:ring-0 px-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={handleAddChapter}
              disabled={!newChapterTitle.trim()}
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground mt-1 hover:text-sage-600 hover:bg-sage-50"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />새 챕터 추가
          </Button>
        ))}

      {/* 빈 공간 컨텍스트 메뉴 */}
      {showEmptyMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmptyMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border py-1 min-w-[160px] animate-in fade-in zoom-in-95"
            style={{ left: emptyMenuPosition.x, top: emptyMenuPosition.y }}
          >
            {emptyMenuActions.map((item, idx) =>
              item.type === "divider" ? (
                <div key={idx} className="h-px bg-stone-200 my-1" />
              ) : (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-stone-50 transition-colors text-left"
                >
                  <span className="w-5">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
