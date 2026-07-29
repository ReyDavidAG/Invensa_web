"use client";

/* Hallmark · locked system applied · src/components/form/inventory-movement-dialog.tsx
 * Dialog for registering a manual inventory movement (entrada / salida /
 * ajuste). Lives behind the "+ Movimiento" button on the product detail page.
 *
 * Single quantity field — the action interprets it semantically:
 *   in / out    → positive magnitude (row.quantity)
 *   adjustment  → signed delta (row.quantity_adj)
 *
 * The parent owns the open state. On success the parent should close the
 * dialog and the Server Action revalidates the relevant routes.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { useCreateInventoryMovement } from "@/lib/query/mutations";
import {
  type InventoryMovementCreateFormValues,
  inventoryMovementCreateSchema,
} from "@/lib/schemas/inventory";

type Props = {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MOVEMENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: "in", label: "Entrada", hint: "+ stock" },
  { value: "out", label: "Salida", hint: "− stock" },
  { value: "adjustment", label: "Ajuste", hint: "signo libre" },
];

export function InventoryMovementDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: Props) {
  const createMovement = useCreateInventoryMovement();

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
      productId,
      movementType: "in",
      quantity: 0,
      note: "",
    },
  });

  const movementType = watch("movementType");

  // Reset the form every time the dialog re-opens.
  useEffect(() => {
    if (open) {
      reset({ productId, movementType: "in", quantity: 0, note: "" });
    }
  }, [open, productId, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null) continue;
      fd.set(k, String(v));
    }
    const res = await createMovement.mutateAsync(fd);
    if (res.ok) {
      toast.success("Movimiento registrado");
      onOpenChange(false);
      return;
    }
    if (!res.fieldErrors) toast.error(res.error);
  });

  const isPending = createMovement.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
          noValidate
          aria-busy={isPending}
        >
          <input type="hidden" {...register("productId")} />
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
              <Label htmlFor="movement-qty">
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
                id="movement-qty"
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
              <Label htmlFor="movement-note">Nota (opcional)</Label>
              <Input
                id="movement-note"
                type="text"
                maxLength={250}
                placeholder="Ej. Compra a proveedor X"
                {...register("note")}
              />
              {errors.note?.message ? (
                <span className="text-xs text-destructive">
                  {errors.note.message}
                </span>
              ) : null}
            </div>
          </fieldset>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-4" />
                  Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}