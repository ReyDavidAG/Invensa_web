"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-MX">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(0.97 0.012 80)",
          color: "oklch(0.22 0.008 70)",
          fontFamily:
            "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "5rem",
              height: "5rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "1rem",
              background: "oklch(0.55 0.215 28 / 0.10)",
              color: "oklch(0.55 0.215 28)",
            }}
          >
            <AlertTriangle size={40} aria-hidden />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <p
              style={{
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "oklch(0.52 0.008 75)",
                margin: 0,
              }}
            >
              Error crítico
            </p>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              La app no responde
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "oklch(0.52 0.008 75)",
                margin: 0,
              }}
            >
              Algo rompió la app a nivel raíz. Recarga la página. Si sigue,
              avísale a la hermana.
            </p>
          </div>

          {error.digest ? (
            <p
              style={{
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "oklch(0.52 0.008 75)",
                margin: 0,
              }}
            >
              Código: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: "2.75rem",
              padding: "0 1.25rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "oklch(0.55 0.16 250)",
              color: "oklch(0.99 0.005 80)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
