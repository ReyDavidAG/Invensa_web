"use client";

import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSendLowStockAlert } from "@/lib/query/mutations";

export function LowStockAlertTrigger({
  lowStockCount,
}: {
  lowStockCount: number;
}) {
  const send = useSendLowStockAlert();

  async function onClick() {
    const res = await send.mutateAsync();
    if (res.ok) {
      if (res.rows === 0) {
        toast.success("Sin productos críticos. No se envió ningún correo.");
      } else {
        toast.success(
          `Alerta enviada: ${res.rows} producto${res.rows === 1 ? "" : "s"} → ${res.recipients} destinatario${res.recipients === 1 ? "" : "s"}.`,
        );
      }
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <BellRing aria-hidden className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Alerta de stock bajo
          </span>
          <span className="text-xs text-muted-foreground">
            {lowStockCount > 0
              ? `${lowStockCount} producto${lowStockCount === 1 ? "" : "s"} crítico${lowStockCount === 1 ? "" : "s"}. Se envía todos los días a las 9am.`
              : "Sin productos críticos. El correo diario de las 9am sale vacío."}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={send.isPending}
      >
        {send.isPending ? (
          <>
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <BellRing aria-hidden className="size-3.5" />
            Enviar ahora
          </>
        )}
      </Button>
    </Card>
  );
}
