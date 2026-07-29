"use client";

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
