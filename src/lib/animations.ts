/**
 * Framer Motion Animation Variants Library
 *
 * Agent B: The Stylist - Motion Engineering
 * Reusable animation patterns for StoLink's "Warm & Soft" identity
 *
 * All transitions use organic easing: cubic-bezier(0.19, 1, 0.22, 1)
 */

import type { Variants, Transition } from "framer-motion";

// ============================================================
// Easing Constants
// ============================================================

export const EASE_ORGANIC = [0.19, 1, 0.22, 1] as const;

// ============================================================
// Generic Transitions
// ============================================================

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInUpTransition: Transition = {
  duration: 0.3,
  ease: EASE_ORGANIC,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInTransition: Transition = {
  duration: 0.4,
  ease: EASE_ORGANIC,
};

// ============================================================
// Spatial Animations (Layout Shifts)
// ============================================================

export const slideInFromRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const slideInFromLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

export const slideTransition: Transition = {
  type: "spring",
  damping: 20,
  stiffness: 300,
};

// ============================================================
// Stagger Animations (Lists, Cards)
// ============================================================

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

// ============================================================
// Zen Mode (EditorPage Specific)
// ============================================================

/**
 * Zen Mode: Auto-recede surrounding UI when user types
 * Usage: Apply to toolbar and sidebars
 */
export const zenModeRecede: Variants = {
  normal: { opacity: 1, filter: "blur(0px)" },
  receded: { opacity: 0.5, filter: "blur(4px)" },
};

export const zenModeTransition: Transition = {
  duration: 0.5,
  ease: EASE_ORGANIC,
};

// ============================================================
// Modal & Overlay Animations
// ============================================================

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export const modalTransition: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 350,
};

// ============================================================
// Micro-Interactions (Buttons, Icons)
// ============================================================

/**
 * Standard button hover/tap animations
 * Usage: <motion.button whileHover="hover" whileTap="tap" variants={buttonInteraction}>
 */
export const buttonInteraction: Variants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export const buttonTransition: Transition = {
  duration: 0.2,
  ease: EASE_ORGANIC,
};

/**
 * Subtle icon pulse for notifications/updates
 */
export const iconPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

// ============================================================
// Loading States (Skeleton, Spinner)
// ============================================================

/**
 * Skeleton shimmer animation (CSS-based alternative in Tailwind: animate-shimmer)
 */
export const skeletonShimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

/**
 * Cross-fade transition between loading skeleton and actual content
 */
export const contentCrossFade: Variants = {
  loading: { opacity: 0 },
  loaded: { opacity: 1 },
};

export const crossFadeTransition: Transition = {
  duration: 0.4,
  ease: EASE_ORGANIC,
};

// ============================================================
// Paper Metaphor (EditorPage Canvas)
// ============================================================

/**
 * "Paper on Desk" entry animation
 * Subtle lift effect when editor canvas appears
 */
export const paperEntry: Variants = {
  initial: { opacity: 0, y: 10, boxShadow: "0 1px 2px rgba(0,0,0,0)" },
  animate: {
    opacity: 1,
    y: 0,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
};

export const paperTransition: Transition = {
  duration: 0.5,
  ease: EASE_ORGANIC,
};
