"use client";

/* Hallmark · locked system applied (Taller) · src/app/error.tsx
 * Root error boundary. Catches runtime errors thrown inside the root
 * layout (Providers/Toaster) — for everything inside (app), the
 * (app)/error.tsx boundary kicks in instead.
 *
 * Two CTAs: reintentar (calls reset() to re-render the segment) and
 * volver al inicio (links to /dashboard, which is auth-gated by proxy.ts).
 */

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for Sentry / observability when added later.
    console.error("[Invensa] root error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="grid size-20 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden className="size-10" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            500 · Algo salió mal
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Encontramos un error
          </h1>
          <p className="text-sm text-muted-foreground">
            La página no se pudo cargar por un error inesperado. Reintenta o
            vuelve al inicio. Si el problema sigue, comparte el código de abajo
            con la hermana.
          </p>
        </div>

        {error.digest ? (
          <p className="font-mono text-xs tabular-nums text-muted-foreground/70">
            Código: {error.digest}
          </p>
        ) : null}

        <div aria-hidden className="h-px w-12 rounded-full bg-primary" />

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
    </main>
  );
}
