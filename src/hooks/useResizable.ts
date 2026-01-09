import { useState, useCallback, useEffect } from "react";

interface UseResizableProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: "left" | "right";
  onResizeEnd?: (width: number) => void;
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  direction,
  onResizeEnd,
}: UseResizableProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onResizeEnd?.(width);
    }
  }, [isResizing, width, onResizeEnd]);

  const resize = useCallback(
    (mouseEvent: MouseEvent) => {
      if (isResizing) {
        let newWidth = width;
        if (direction === "right") {
          // Left Sidebar: Width = Mouse X (simplified)
          // We assume the sidebar is on the left edge of the screen
          newWidth = mouseEvent.clientX;
        } else {
          // Right Sidebar: Width = Window Width - Mouse X
          newWidth = window.innerWidth - mouseEvent.clientX;
        }

        if (newWidth < minWidth) {
          newWidth = minWidth;
        } else if (newWidth > maxWidth) {
          newWidth = maxWidth;
        }

        setWidth(newWidth);
      }
    },
    [isResizing, direction, minWidth, maxWidth, width],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      // Prevent text selection while resizing
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resize, stopResizing]);

  return { width, startResizing, isResizing, setWidth };
}
