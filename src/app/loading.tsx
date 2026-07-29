import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6"
    >
      <div className="flex items-center gap-3">
        <BrandMark className="size-10" />
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Invensa
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2
          aria-hidden
          className="size-4 animate-spin text-primary animate-spin-slow"
        />
        <span>Cargando…</span>
      </div>
    </div>
  );
}