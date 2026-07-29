"use client";

/* Hallmark · locked system applied · src/lib/query/client.tsx
 * React Query client + provider. One QueryClient per browser session,
 * configured to retry once on transient network failures and to never
 * retry on 4xx-shaped server-action errors (those are deterministic —
 * the user already typed something wrong).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
