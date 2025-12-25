import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeIcon } from "./NodeIcon";
import { ContextMenu, type MenuItemType } from "./ContextMenu";
import { type ChapterNode, statusColors, formatCharCount } from "./types";

interface TreeItemProps {
  node: ChapterNode;
  level?: number;
  selectedId?: string;
  isLast?: boolean;
  parentLines?: boolean[];
  onSelect?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function TreeItem({
  node,
  level = 0,
  selectedId,
  isLast = false,
  parentLines = [],
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onDuplicate,
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const [isHovered, setIsHovered] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const hasChildren = (node.children?.length || 0) > 0;
  const isPart = node.type === "part";
  const isSelected = node.id === selectedId;

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // F2 단축키 = 커서가 올라간(hover) 항목에서 이름 변경
  useEffect(() => {
    if (!isHovered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && !isRenaming) {
        e.preventDefault();
        setIsRenaming(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, isRenaming]);

  // 싱글 클릭 = 선택 (Part는 펼치기/접기)
  const handleClick = () => {
    if (isRenaming) return;
    if (isPart) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect?.(node.id);
    }
  };

  // 더블 클릭 = 이름 변경
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  // 우클릭 = 객체 컨텍스트 메뉴
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // ... 버튼 클릭
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.top });
    setShowMenu(true);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== node.title) {
      onRename?.(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  // 객체 컨텍스트 메뉴 (파일 위 우클릭)
  const objectMenuItems: MenuItemType[] = [
    {
      icon: Pencil,
      label: "이름 변경",
      shortcut: "F2",
      onClick: () => setIsRenaming(true),
    },
    {
      icon: Copy,
      label: "복제",
      shortcut: "⌘D",
      onClick: () => onDuplicate?.(node.id),
    },
    { type: "divider" },
    {
      icon: Trash2,
      label: "휴지통으로 이동",
      danger: true,
      onClick: () => onDelete?.(node.id),
    },
  ];

  return (
    <div className="relative">
      {/* Tree lines - 세로선 (부모 레벨들) */}
      {parentLines.map((showLine, idx) =>
        showLine ? (
          <div
            key={idx}
            className="absolute top-0 bottom-0 w-px bg-stone-300"
            style={{ left: `${idx * 16 + 11}px` }}
          />
        ) : null,
      )}

      {/* Tree lines - 현재 레벨 연결 */}
      {level > 0 && (
        <>
          {/* 세로선 (현재) */}
          {!isLast && (
            <div
              className="absolute top-0 bottom-0 w-px bg-stone-300"
              style={{ left: `${(level - 1) * 16 + 11}px` }}
            />
          )}
          {/* 가로선 */}
          <div
            className="absolute w-3 border-t border-stone-300"
            style={{
              left: `${(level - 1) * 16 + 11}px`,
              top: "14px",
            }}
          />
          {isLast && (
            <div
              className="absolute w-px bg-stone-300"
              style={{
                left: `${(level - 1) * 16 + 11}px`,
                top: "0",
                height: "14px",
              }}
            />
          )}
        </>
      )}

      {/* Item row */}
      <div
        ref={itemRef}
        className={cn(
          "relative flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer group select-none transition-colors duration-100",
          "hover:bg-stone-50",
          isSelected && "bg-sage-50",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-sage-500 rounded-r" />
        )}

        {/* Status indicator - 상태 점 */}
        {node.status && (
          <div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-1 ring-white",
              statusColors[node.status],
            )}
            title={
              node.status === "todo"
                ? "구상 중"
                : node.status === "inProgress"
                  ? "집필 중"
                  : node.status === "done"
                    ? "탈고 완료"
                    : node.status === "revised"
                      ? "퇴고 완료"
                      : ""
            }
          />
        )}

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-stone-200 rounded transition-colors shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
            )}
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {/* Icon */}
        <div className="shrink-0">
          <NodeIcon node={node} isExpanded={isExpanded} />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 pr-6">
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
              className="w-full text-sm bg-white border border-sage-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-sage-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  isSelected ? "font-medium text-sage-900" : "text-stone-700",
                  node.isPlot && "italic text-stone-500",
                )}
              >
                {node.title}
              </span>
              {/* Character count */}
              {!isPart && (node.characterCount || 0) > 0 && (
                <span className="text-[10px] text-stone-400 shrink-0 tabular-nums">
                  {formatCharCount(node.characterCount!)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons (hover) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPart && onAddChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.id);
              }}
              className="p-1 hover:bg-sage-100 rounded transition-colors"
              title="추가"
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" />
            </button>
          )}
          <button
            onClick={handleMenuButtonClick}
            className="p-1 hover:bg-stone-200 rounded transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Object Context Menu */}
      {showMenu && (
        <ContextMenu
          items={objectMenuItems}
          position={menuPosition}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child, idx) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              isLast={idx === (node.children?.length || 0) - 1}
              parentLines={[...parentLines, !isLast]}
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
