"use client";

/* Hallmark · locked system applied · src/app/(app)/sales/[id]/print-button.tsx
 * Tiny client wrapper around `window.print()`. Lives outside the Server
 * Component so the `onClick` doesn't cross the RSC boundary.
 */

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer aria-hidden className="size-4" />
      Imprimir
    </Button>
  );
}