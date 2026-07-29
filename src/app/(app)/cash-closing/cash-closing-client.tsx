"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeUp } from "@/components/motion/fade-up";
import { useCloseCash } from "@/lib/query/mutations";
import {
  cashClosingCloseSchema,
  type CashClosingCloseInput,
  type CashClosingRow,
} from "@/lib/schemas/cash-closing";
import { cn } from "@/lib/utils";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

function formatDiff(n: number | null): {
  label: string;
  tone: "success" | "warning" | "destructive";
} {
  if (n === null) return { label: "—", tone: "muted" as never };
  if (n === 0) return { label: "Cuadra", tone: "success" };
  const abs = Math.abs(n);
  if (abs <= 5) return { label: esMXCurrency.format(n), tone: "warning" };
  return { label: esMXCurrency.format(n), tone: "destructive" };
}

export function CashClosingClient({
  date,
  initialRow,
  initialExpected,
}: {
  date: string;
  initialRow: CashClosingRow | null;
  initialExpected: number;
}) {
  const close = useCloseCash();
  const [row, setRow] = useState<CashClosingRow | null>(initialRow);

  // Recompute expected live as sales come in (poll every 30s while open).
  const [expected, setExpected] = useState<number>(
    Number(initialRow?.expected_cash ?? initialExpected),
  );
  useEffect(() => {
    if (row?.status === "closed") return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/cash-closing/today`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { expected: number };
        setExpected(data.expected);
      } catch {
        // ignore — keep last value
      }
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [row?.status]);

  const isClosed = row?.status === "closed";
  const diffTone = formatDiff(row?.diff ?? null);

  const form = useForm<CashClosingCloseInput>({
    resolver: zodResolver(cashClosingCloseSchema),
    defaultValues: { countedCash: 0, notes: "" },
  });

  async function onSubmit(values: CashClosingCloseInput) {
    const fd = new FormData();
    fd.set("countedCash", String(values.countedCash));
    fd.set("notes", values.notes ?? "");
    const res = await close.mutateAsync(fd);
    if (res.ok) {
      setRow(res.row);
      toast.success(`Cierre del ${date} registrado`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <FadeUp className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Cierre de caja
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Status banner */}
      <Card
        className={cn(
          "flex items-center gap-3 p-4",
          isClosed
            ? diffTone.tone === "success"
              ? "border-success/30 bg-success/5"
              : diffTone.tone === "warning"
                ? "border-warning/30 bg-warning/5"
                : "border-destructive/30 bg-destructive/5"
            : "border-border bg-card",
        )}
      >
        {isClosed ? (
          diffTone.tone === "success" ? (
            <CheckCircle2
              aria-hidden
              className="size-5 shrink-0 text-success"
            />
          ) : (
            <AlertTriangle
              aria-hidden
              className={cn(
                "size-5 shrink-0",
                diffTone.tone === "warning"
                  ? "text-warning"
                  : "text-destructive",
              )}
            />
          )
        ) : (
          <CircleDollarSign
            aria-hidden
            className="size-5 shrink-0 text-muted-foreground"
          />
        )}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">
            {isClosed ? "Caja cerrada" : "Caja abierta"}
          </span>
          <span className="text-xs text-muted-foreground">
            {isClosed && row?.closed_at
              ? `Cerrada el ${new Date(row.closed_at).toLocaleString("es-MX")}`
              : "Aún no se ha cerrado el día"}
          </span>
        </div>
        {isClosed ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
              diffTone.tone === "success" &&
                "bg-success/15 text-success ring-1 ring-inset ring-success/30",
              diffTone.tone === "warning" &&
                "bg-warning/15 text-warning ring-1 ring-inset ring-warning/30",
              diffTone.tone === "destructive" &&
                "bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/30",
            )}
          >
            {diffTone.label}
          </span>
        ) : null}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Esperado en caja
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {esMXCurrency.format(expected)}
          </span>
          <span className="text-xs text-muted-foreground">
            Suma de ventas en efectivo hoy
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contado en caja
          </span>
          <span
            className={cn(
              "font-mono text-2xl font-bold tabular-nums",
              isClosed ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {row?.counted_cash != null
              ? esMXCurrency.format(Number(row.counted_cash))
              : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            Lo que realmente hay en el cajón
          </span>
        </Card>
      </div>

      {/* Close form or read-only summary */}
      {isClosed ? (
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold text-foreground">
            Detalle del cierre
          </h2>
          <dl className="flex flex-col divide-y divide-border text-sm">
            <div className="flex items-baseline justify-between py-2">
              <dt className="text-muted-foreground">Esperado</dt>
              <dd className="font-mono tabular-nums">
                {esMXCurrency.format(Number(row.expected_cash))}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <dt className="text-muted-foreground">Contado</dt>
              <dd className="font-mono tabular-nums">
                {esMXCurrency.format(Number(row.counted_cash))}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <dt className="text-muted-foreground">Diferencia</dt>
              <dd
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  diffTone.tone === "success" && "text-success",
                  diffTone.tone === "warning" && "text-warning",
                  diffTone.tone === "destructive" && "text-destructive",
                )}
              >
                {diffTone.label}
              </dd>
            </div>
            {row.notes ? (
              <div className="flex flex-col gap-1 py-2">
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="whitespace-pre-wrap text-foreground">
                  {row.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Banknote aria-hidden className="size-4 text-primary" />
            Cerrar caja
          </h2>
          <p className="text-xs text-muted-foreground">
            Cuenta el dinero en el cajón y anota el total. La diferencia con lo
            esperado te indica si falta o sobra dinero.
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="countedCash"
                className="text-xs font-medium text-foreground"
              >
                Total contado en caja
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="countedCash"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-12 pl-7 pr-4 font-mono tabular-nums text-base"
                  {...form.register("countedCash", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.countedCash ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.countedCash.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notes"
                className="text-xs font-medium text-foreground"
              >
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Ej. Se prestaron $50 para gastos menores"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                {...form.register("notes")}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={close.isPending}
              className="h-12 w-full text-base font-semibold"
            >
              {close.isPending ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-5" />
                  Cerrar caja del día
                </>
              )}
            </Button>
          </form>
        </Card>
      )}
    </FadeUp>
  );
}
