"use client";

/* Hallmark · locked system applied · src/app/(app)/products/[id]/inventory-movement-button.tsx
 * Trigger for the inventory-movement dialog. Visible to both admin and
 * employee (RLS allows both to insert movements, with created_by = auth.uid).
 */

import { ArrowDownUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { InventoryMovementDialog } from "@/components/form/inventory-movement-dialog";

type Props = {
  productId: string;
  productName: string;
};

export function InventoryMovementButton({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <ArrowDownUp aria-hidden className="size-4" />
        Movimiento
      </Button>
      <InventoryMovementDialog
        productId={productId}
        productName={productName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}