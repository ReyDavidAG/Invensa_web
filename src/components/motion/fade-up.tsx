"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type FadeUpProps = HTMLAttributes<HTMLDivElement> & {
  /** Stagger delay in ms. Renders as `animation-delay`. */
  delay?: number;
  /** Optional style merged after the generated animation-delay. */
  style?: CSSProperties;
};

/**
 * Fade-up entrance animation backed by the existing CSS keyframe in
 * `globals.css` (`.animate-fade-up`). Replaces the motion/react wrapper.
 * Honours `prefers-reduced-motion` via the global CSS rule (no JS needed).
 */
export const FadeUp = forwardRef<HTMLDivElement, FadeUpProps>(
  function FadeUp({ children, className, delay, style, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn("animate-fade-up", className)}
        style={
          delay
            ? { animationDelay: `${delay}ms`, ...style }
            : style
        }
        {...rest}
      >
        {children}
      </div>
    );
  },
);
