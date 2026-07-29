import { Compass, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass aria-hidden className="size-10" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            404 · No encontrado
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Esta página no existe
          </h1>
          <p className="text-sm text-muted-foreground">
            La ruta que buscas no existe o fue movida. Verifica la URL o vuelve
            al inicio.
          </p>
        </div>

        <div aria-hidden className="h-px w-12 rounded-full bg-primary" />

        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Home aria-hidden className="size-4" />
          Volver al inicio
        </Link>

        <p className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
          ¿Necesitas ayuda? Pídele a la hermana que te comparta el enlace.
        </p>
      </div>
    </main>
  );
}
