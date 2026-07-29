"use client";

/* Hallmark · locked system applied (Taller) · src/components/motion/fade-up.tsx
 * Reusable entrance animation primitive. Wraps children in a motion.div
 * with the design-system motion tokens (--dur-slow 240ms, --ease-out).
 *
 * Use as the page-level fade-up. Per-element motion (delays, staggers) is
 * done by composing multiple FadeUp instances with custom `transition.delay`.
 */

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

const DEFAULT_TRANSITION = {
  duration: 0.24,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const FadeUp = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function FadeUp({ children, transition, ...rest }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...DEFAULT_TRANSITION, ...transition }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);