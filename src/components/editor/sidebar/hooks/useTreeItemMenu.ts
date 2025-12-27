import { useState, type MouseEvent } from "react";
import { FolderPlus, FilePlus, Pencil, Trash2 } from "lucide-react";
import type { MenuItemType } from "../ContextMenu";
import type { ChapterNode } from "../types";

interface UseTreeItemMenuProps {
  node: ChapterNode;
  hasChildren: boolean;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
  onDelete?: (id: string) => void;
  setIsRenaming: (isRenaming: boolean) => void;
}

export function useTreeItemMenu({
  node,
  onAddChild,
  onDelete,
  setIsRenaming,
}: UseTreeItemMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMenuButtonClick = (e: MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.top });
    setShowMenu(true);
  };

  const menuItems: MenuItemType[] = [
    {
      icon: FolderPlus,
      label: "새 폴더 만들기",
      onClick: () => onAddChild?.(node.id, "chapter"),
    },
    {
      icon: FilePlus,
      label: "새 섹션 만들기",
      onClick: () => onAddChild?.(node.id, "section"),
    },
    { type: "divider" },
    {
      icon: Pencil,
      label: "이름 변경",
      shortcut: "F2",
      onClick: () => setIsRenaming(true),
    },
    { type: "divider" },
    {
      icon: Trash2,
      label: "휴지통으로 이동",
      danger: true,
      onClick: () => onDelete?.(node.id),
    },
  ];

  return {
    showMenu,
    setShowMenu,
    menuPosition,
    menuItems,
    handleContextMenu,
    handleMenuButtonClick,
  };
}
