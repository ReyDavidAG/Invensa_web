/* Hallmark · locked system applied (Mostrador) · src/app/loading.tsx
 * Global loading screen. Shows while Next.js suspends the root segment during
 * route transitions / data fetches. Brand wordmark + tangerine spinner
 * on the warm cream paper.
 */

import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground text-base font-bold"
        >
          I
        </span>
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
