/**
 * useZenMode - Typing State Detection Hook
 *
 * Agent B: The Stylist - Motion Engineering
 * Tracks user typing to auto-recede surrounding UI for immersive writing
 *
 * Usage:
 * ```tsx
 * const { isTyping, handleTyping } = useZenMode(true);
 * // Pass handleTyping to Tiptap onUpdate callback
 * // Apply zenModeRecede animation variant based on isTyping state
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseZenModeOptions {
  /** Debounce delay in ms before restoring UI (default: 3000) */
  debounceDelay?: number;
}

export function useZenMode(
  isEnabled: boolean,
  options: UseZenModeOptions = {},
) {
  const { debounceDelay = 3000 } = options;

  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Call this function whenever user types in the editor
   * Will set isTyping to true and auto-restore after debounce delay
   */
  const handleTyping = useCallback(() => {
    if (!isEnabled) return;

    setIsTyping(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to restore UI
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, debounceDelay);
  }, [isEnabled, debounceDelay]);

  /**
   * Manual control to reset typing state
   */
  const resetTyping = useCallback(() => {
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset when disabled logic handled by derived state below

  return {
    /** Whether user is currently typing (UI should recede) */
    isTyping: isEnabled && isTyping,
    /** Call this in Tiptap onUpdate or similar typing event */
    handleTyping,
    /** Manually reset typing state */
    resetTyping,
  };
}
