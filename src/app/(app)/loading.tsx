import { Loader2 } from "lucide-react";

export default function AppShellLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="flex min-h-svh w-full bg-background"
    >
      {/* Sidebar skeleton */}
      <aside
        aria-hidden
        className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col"
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          <div className="h-6 w-6 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-1.5 p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md bg-muted/60"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </aside>

      {/* Main skeleton */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar skeleton */}
        <header
          aria-hidden
          className="flex h-14 items-center justify-between gap-3 border-b border-sidebar-border bg-background/95 px-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2
              aria-hidden
              className="size-6 animate-spin animate-spin-slow text-primary"
            />
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </div>
        </main>
      </div>
    </div>
  );
}
