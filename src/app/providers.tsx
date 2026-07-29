"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

import { QueryProvider } from "@/lib/query/client";

/** Client-only providers. Theme + global toaster + React Query. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast:
                "border border-border bg-card text-card-foreground rounded-lg shadow-sm",
              title: "text-sm font-medium",
              description: "text-xs text-muted-foreground",
              success: "border-success/40",
              error: "border-destructive/40",
            },
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  );
}
