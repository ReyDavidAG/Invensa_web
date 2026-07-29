"use client";

/* Hallmark · locked system applied (Taller) · src/components/form/bulk-inventory-movement-dialog.tsx
 * Apply the same inventory movement to N selected products. Reuses the
 * existing schema, RHF, and Combobox pattern from the single-product
 * version. Submits via bulkCreateInventoryMovementsAction.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  type ComboboxOption,
} from "@/components/form/combobox";
import { useBulkCreateInventoryMovements } from "@/lib/query/mutations";
import {
  type InventoryMovementCreateFormValues,
  inventoryMovementCreateSchema,
} from "@/lib/schemas/inventory";
import { cn } from "@/lib/utils";

type Props = {
  productIds: string[];
  productNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MOVEMENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: "in", label: "Entrada", hint: "+ stock" },
  { value: "out", label: "Salida", hint: "− stock" },
  { value: "adjustment", label: "Ajuste", hint: "signo libre" },
];

export function BulkInventoryMovementDialog({
  productIds,
  productNames,
  open,
  onOpenChange,
}: Props) {
  const bulkCreate = useBulkCreateInventoryMovements();
  const isPending = bulkCreate.isPending;
  const count = productIds.length;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryMovementCreateFormValues>({
    resolver: zodResolver(inventoryMovementCreateSchema),
    defaultValues: {
      // productId is required by the schema but irrelevant for bulk.
      productId: productIds[0] ?? "",
      movementType: "in",
      quantity: 0,
      note: "",
    },
  });

  const movementType = watch("movementType");

  useEffect(() => {
    if (open) {
      reset({
        productId: productIds[0] ?? "",
        movementType: "in",
        quantity: 0,
        note: "",
      });
    }
  }, [open, productIds, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (count === 0) return;
    const fd = new FormData();
    fd.set("productIds", JSON.stringify(productIds));
    fd.set("movementType", data.movementType);
    fd.set("quantity", String(data.quantity));
    fd.set("note", data.note ?? "");
    const res = await bulkCreate.mutateAsync(fd);
    const failed = res.results.filter((r) => !r.ok).length;
    if (failed === 0) {
      toast.success(`Movimiento aplicado a ${count} productos`);
    } else {
      toast.error(
        `Aplicado a ${count - failed} productos. ${failed} fallaron.`,
      );
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            {count === 1
              ? `1 producto seleccionado`
              : `${count} productos seleccionados`}
            {count <= 5 ? `: ${productNames.join(", ")}` : null}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
          noValidate
          aria-busy={isPending}
        >
          <fieldset disabled={isPending} className="contents">
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Combobox
                ariaLabel="Tipo de movimiento"
                value={movementType}
                onChange={(v) =>
                  setValue(
                    "movementType",
                    v as "in" | "out" | "adjustment",
                    { shouldValidate: true },
                  )
                }
                options={MOVEMENT_TYPE_OPTIONS}
                placeholder="Selecciona un tipo…"
              />
              {errors.movementType?.message ? (
                <span className="text-xs text-destructive">
                  {errors.movementType.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-movement-qty">
                Cantidad
                {movementType === "out" ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    resta stock
                  </span>
                ) : movementType === "adjustment" ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    usa signo: + suma, - resta
                  </span>
                ) : null}
              </Label>
              <Input
                id="bulk-movement-qty"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={movementType === "adjustment" ? undefined : "0"}
                {...register("quantity")}
                className="font-mono tabular-nums"
              />
              {errors.quantity?.message ? (
                <span className="text-xs text-destructive">
                  {errors.quantity.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-movement-note">Nota (opcional)</Label>
              <Input
                id="bulk-movement-note"
                type="text"
                maxLength={250}
                placeholder="Ej. Conteo físico de fin de mes"
                {...register("note")}
              />
            </div>
          </fieldset>
          <DialogFooter className="gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className={cn(count === 0 && "opacity-50")}
                />
              }
            >
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={isPending || count === 0}>
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Aplicando…
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-4" />
                  Aplicar a {count}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}