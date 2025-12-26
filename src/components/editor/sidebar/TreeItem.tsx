import { ChevronRight, ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeIcon } from "./NodeIcon";
import { ContextMenu } from "./ContextMenu";
import { TreeLines } from "./TreeLines";
import { useTreeItem } from "./hooks/useTreeItem";
import { buildTreeItemMenuItems } from "./treeItemMenu";
import { type ChapterNode, statusColors, formatCharCount } from "./types";

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

/**
 * 트리 아이템 컴포넌트
 * 리팩토링: useTreeItem 훅으로 상태 관리, 서브컴포넌트로 UI 분리
 */
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
  const tree = useTreeItem({ node, onRename });
  const isSelected = node.id === selectedId;

  // 싱글 클릭 핸들러
  const handleClick = () => {
    if (tree.isRenaming) return;
    if (tree.isPart) {
      tree.toggleExpand();
    } else {
      onSelect?.(node.id);
    }
  };

  // 더블 클릭 = 이름 변경
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    tree.setIsRenaming(true);
  };

  // 메뉴 아이템 빌드
  const menuItems = buildTreeItemMenuItems({
    node,
    hasChildren: tree.hasChildren,
    onAddChild,
    onRename: () => tree.setIsRenaming(true),
    onDuplicate,
    onConvertType,
    onDelete,
  });

  return (
    <div className="relative">
      <TreeLines level={level} isLast={isLast} parentLines={parentLines} />

      {/* Item row */}
      <div
        ref={tree.itemRef}
        className={cn(
          "relative flex items-center gap-1.5 py-1 pr-2 rounded-md cursor-pointer group select-none transition-colors duration-100",
          "hover:bg-stone-50",
          isSelected && "bg-sage-50"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={tree.handleContextMenu}
        onMouseEnter={tree.handleMouseEnter}
        onMouseLeave={tree.handleMouseLeave}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-sage-500 rounded-r" />
        )}

        {/* Status indicator */}
        <StatusIndicator status={node.status} />

        {/* Expand/Collapse */}
        <ExpandButton
          hasChildren={tree.hasChildren}
          isExpanded={tree.isExpanded}
          onToggle={(e) => {
            e.stopPropagation();
            tree.toggleExpand();
          }}
        />

        {/* Icon */}
        <div className="shrink-0">
          <NodeIcon node={node} isExpanded={tree.isExpanded} />
        </div>

        {/* Title */}
        <TitleSection
          node={node}
          isSelected={isSelected}
          isRenaming={tree.isRenaming}
          renameValue={tree.renameValue}
          renameInputRef={tree.renameInputRef}
          isPart={tree.isPart}
          onRenameChange={tree.setRenameValue}
          onRenameSubmit={tree.handleRenameSubmit}
          onRenameCancel={tree.cancelRename}
        />

        {/* Action buttons */}
        <ActionButtons
          isPart={tree.isPart}
          nodeId={node.id}
          onAddChild={onAddChild}
          onMenuClick={tree.handleMenuButtonClick}
        />
      </div>

      {/* Context Menu */}
      {tree.showMenu && (
        <ContextMenu
          items={menuItems}
          position={tree.menuPosition}
          onClose={() => tree.setShowMenu(false)}
        />
      )}

      {/* Children (재귀) */}
      {tree.hasChildren && tree.isExpanded && (
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

// --- 서브 컴포넌트들 ---

interface StatusIndicatorProps {
  status?: ChapterNode["status"];
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  if (!status) return null;

  const statusLabels: Record<string, string> = {
    todo: "구상 중",
    inProgress: "집필 중",
    done: "탈고 완료",
    revised: "퇴고 완료",
  };

  return (
    <div
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-1 ring-white",
        statusColors[status]
      )}
      title={statusLabels[status] || ""}
    />
  );
}

interface ExpandButtonProps {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

function ExpandButton({
  hasChildren,
  isExpanded,
  onToggle,
}: ExpandButtonProps) {
  if (!hasChildren) {
    return <span className="w-[18px] shrink-0" />;
  }

  return (
    <button
      onClick={onToggle}
      className="p-0.5 hover:bg-stone-200 rounded transition-colors shrink-0"
    >
      {isExpanded ? (
        <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
      )}
    </button>
  );
}

interface TitleSectionProps {
  node: ChapterNode;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement>;
  isPart: boolean;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

function TitleSection({
  node,
  isSelected,
  isRenaming,
  renameValue,
  renameInputRef,
  isPart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: TitleSectionProps) {
  if (isRenaming) {
    return (
      <div className="flex-1 min-w-0 pr-6">
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSubmit();
            if (e.key === "Escape") onRenameCancel();
          }}
          className="w-full text-sm bg-white border border-sage-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-sage-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 pr-6">
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
        {!isPart && (node.characterCount || 0) > 0 && (
          <span className="text-[10px] text-stone-400 shrink-0 tabular-nums">
            {formatCharCount(node.characterCount!)}
          </span>
        )}
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  isPart: boolean;
  nodeId: string;
  onAddChild?: (parentId: string) => void;
  onMenuClick: (e: React.MouseEvent) => void;
}

function ActionButtons({
  isPart,
  nodeId,
  onAddChild,
  onMenuClick,
}: ActionButtonsProps) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {isPart && onAddChild && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(nodeId);
          }}
          className="p-1 hover:bg-sage-100 rounded transition-colors"
          title="추가"
        >
          <Plus className="h-3.5 w-3.5 text-sage-600" />
        </button>
      )}
      <button
        onClick={onMenuClick}
        className="p-1 hover:bg-stone-200 rounded transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5 text-stone-500" />
      </button>
    </div>
  );
}
