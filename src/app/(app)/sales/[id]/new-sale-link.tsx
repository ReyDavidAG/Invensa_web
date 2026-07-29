"use client";

/* Hallmark · locked system applied · src/app/(app)/sales/[id]/new-sale-link.tsx
 * Client wrapper around the "Registrar otra venta" navigation. Lives in
 * a Client Component so the Button's render+Link pattern doesn't cross the
 * RSC boundary (which triggers Next 16 / Turbopack to flag Link's internal
 * onClick as a non-serializable Client Component prop).
 */

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function NewSaleLink() {
  return (
    <Button render={<Link href="/sales/new" />} nativeButton={false}>
      Registrar otra venta
      <ChevronRight aria-hidden className="size-4" />
    </Button>
  );
}