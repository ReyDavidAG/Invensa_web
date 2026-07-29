import { Compass, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass aria-hidden className="size-8" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            404 · No encontrado
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Esta página no existe
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            La ruta dentro de la app no coincide con nada registrado. Verifica
            el enlace o vuelve al inicio desde el menú lateral.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Home aria-hidden className="size-4" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
