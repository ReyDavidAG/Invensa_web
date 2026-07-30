import { Loader2 } from "lucide-react";

// Suspense fallback shown by Next.js while a route segment's page.tsx is
// rendering on the server. Kept dependency-light so it streams immediately.
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="flex min-h-[40vh] w-full items-center justify-center"
    >
      <Loader2
        aria-hidden
        className="size-6 animate-spin text-muted-foreground"
      />
    </div>
  );
}

export default RouteLoading;
