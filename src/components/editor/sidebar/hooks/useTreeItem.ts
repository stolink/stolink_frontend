import { useState, useRef, useEffect, type MouseEvent } from "react";

interface UseTreeItemProps {
  initialTitle: string;
  nodeId: string;
  isFolder: boolean; // chapter = 폴더 역할
  onSelect?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  forceExpanded?: boolean; // 외부에서 모두 접기/펼치기 제어
}

export function useTreeItem({
  initialTitle,
  nodeId,
  isFolder,
  onSelect,
  onRename,
  forceExpanded,
}: UseTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(initialTitle);
  const [isHovered, setIsHovered] = useState(false);

  const renameInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // forceExpanded가 변경되면 해당 값으로 동기화
  // 초기값으로 forceExpanded 사용, 이후 변경 시에만 동기화
  if (forceExpanded !== undefined && forceExpanded !== isExpanded) {
    setIsExpanded(forceExpanded);
  }

  // Rename input focus effect
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // F2 shortcut effect
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

  const handleClick = () => {
    if (isRenaming) return;
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect?.(nodeId);
    }
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== initialTitle) {
      onRename?.(nodeId, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(initialTitle);
    }
  };

  const toggleExpand = (e: MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return {
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
  };
}
