"use client";

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
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
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
