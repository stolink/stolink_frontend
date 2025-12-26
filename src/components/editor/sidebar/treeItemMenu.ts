import {
  FolderPlus,
  FilePlus,
  Pencil,
  Copy,
  Folder,
  FileText,
  Trash2,
} from "lucide-react";
import type { ChapterNode } from "./types";
import type { MenuItemType } from "./ContextMenu";

interface BuildMenuItemsOptions {
  node: ChapterNode;
  hasChildren: boolean;
  onAddChild?: (parentId: string, type?: "chapter" | "section") => void;
  onRename?: () => void;
  onDuplicate?: (id: string) => void;
  onConvertType?: (id: string, type: "chapter" | "section") => void;
  onDelete?: (id: string) => void;
}

/**
 * TreeItem 컨텍스트 메뉴 아이템 생성
 */
export function buildTreeItemMenuItems({
  node,
  hasChildren,
  onAddChild,
  onRename,
  onDuplicate,
  onConvertType,
  onDelete,
}: BuildMenuItemsOptions): MenuItemType[] {
  const baseItems: MenuItemType[] = [
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
      onClick: () => onRename?.(),
    },
    {
      icon: Copy,
      label: "복제",
      shortcut: "⌘D",
      onClick: () => onDuplicate?.(node.id),
    },
  ];

  // 타입 변환 메뉴
  const convertItems: MenuItemType[] = [];

  if (node.type === "section") {
    convertItems.push({
      icon: Folder,
      label: "폴더로 변환",
      onClick: () => onConvertType?.(node.id, "chapter"),
    });
  }

  if (node.type === "chapter" || node.type === "part") {
    convertItems.push({
      icon: FileText,
      label: "파일로 변환",
      onClick: () => {
        if (hasChildren) {
          alert("하위 항목이 있는 폴더는 파일로 변환할 수 없습니다.");
          return;
        }
        onConvertType?.(node.id, "section");
      },
    });
  }

  const deleteItem: MenuItemType[] = [
    { type: "divider" },
    {
      icon: Trash2,
      label: "휴지통으로 이동",
      danger: true,
      onClick: () => onDelete?.(node.id),
    },
  ];

  return [...baseItems, ...convertItems, ...deleteItem];
}
