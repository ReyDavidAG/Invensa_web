"use client";

/* Hallmark · locked system applied (Taller) · src/app/(app)/error.tsx
 * In-app error boundary. Catches errors thrown inside any (app)/* page
 * segment (including page.tsx + layout.tsx for that route). Keeps the
 * shell intact so the user can navigate elsewhere.
 */

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Invensa] app error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-destructive/30 bg-card px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden className="size-8" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            500 · Algo salió mal
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            No pudimos cargar esta vista
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Reintenta. Si el problema sigue, vuelve al inicio o avísale a la
            hermana con el código de abajo.
          </p>
        </div>

        {error.digest ? (
          <p className="font-mono text-xs tabular-nums text-muted-foreground/70">
            Código: {error.digest}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <RotateCcw aria-hidden className="size-4" />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Home aria-hidden className="size-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
