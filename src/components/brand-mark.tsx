import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Cobalt rounded square + bold "I" in the body font (Inter via Geist).
// Matches the icon used in loading.tsx, the sidebar header, and the login
// shell. The favicon (src/app/icon.svg) and PWA icon (public/icon.svg)
// bake the same visual as paths so they render without a font dependency.
//
// Default size is size-9 (36px) to fit the sidebar header. Pass `size-N`
// via className to scale (loading uses size-10, login uses size-8).
export function BrandMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-bold text-primary-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      I
    </span>
  );
}