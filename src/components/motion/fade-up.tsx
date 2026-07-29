"use client";

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
