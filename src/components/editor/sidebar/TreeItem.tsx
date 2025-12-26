import { ChevronRight, ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeIcon } from "./NodeIcon";
import { ContextMenu } from "./ContextMenu";
import { type ChapterNode, statusColors, formatCharCount } from "./types";
import { useTreeItem } from "./hooks/useTreeItem";
import { useTreeItemMenu } from "./hooks/useTreeItemMenu";
import { TreeLines } from "./TreeLines";

interface TreeItemProps {
  node: ChapterNode;
  level?: number;
  selectedId?: string;
  isLast?: boolean;
  parentLines?: boolean[];
  onSelect?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onConvertType?: (id: string, type: "chapter" | "section") => void;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
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
  onConvertType,
}: TreeItemProps) {
  const hasChildren = (node.children?.length || 0) > 0;
  const isPart = node.type === "part";
  const isSelected = node.id === selectedId;

  // 1. 기본 상태 및 동작 훅
  const {
    isExpanded,
    setIsExpanded,
    isRenaming,
    setIsRenaming,
    renameValue,
    setRenameValue,
    isHovered,
    setIsHovered,
    renameInputRef,
    itemRef,
    handleClick,
    handleDoubleClick,
    handleRenameSubmit,
    handleRenameKeyDown,
    toggleExpand,
  } = useTreeItem({
    initialTitle: node.title,
    nodeId: node.id,
    isPart,
    onSelect,
    onRename,
  });

  // 2. 컨텍스트 메뉴 훅
  const {
    showMenu,
    setShowMenu,
    menuPosition,
    menuItems,
    handleContextMenu,
    handleMenuButtonClick,
  } = useTreeItemMenu({
    node,
    hasChildren,
    onAddChild,
    onDuplicate,
    onConvertType,
    onDelete,
    setIsRenaming,
  });

  return (
    <div className="relative">
      {/* 트리 연결선 컴포넌트 */}
      <TreeLines level={level} isLast={isLast} parentLines={parentLines} />

      {/* Item row */}
      <div
        ref={itemRef}
        className={cn(
          "relative flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer group select-none transition-colors duration-100",
          "hover:bg-stone-50",
          isSelected && "bg-sage-50"
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

        {/* Status indicator */}
        {node.status && (
          <div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-1 ring-white",
              statusColors[node.status]
            )}
            title={getStatusTitle(node.status)}
          />
        )}

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
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
              onKeyDown={handleRenameKeyDown}
              className="w-full text-sm bg-white border border-sage-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-sage-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  isSelected ? "font-medium text-sage-900" : "text-stone-700",
                  node.isPlot && "italic text-stone-500"
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
          items={menuItems}
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
              onConvertType={onConvertType}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 헬퍼 함수
function getStatusTitle(status: string) {
  switch (status) {
    case "todo":
      return "구상 중";
    case "inProgress":
      return "집필 중";
    case "done":
      return "탈고 완료";
    case "revised":
      return "퇴고 완료";
    default:
      return "";
  }
}
