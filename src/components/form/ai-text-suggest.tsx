"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ExistingCategory,
  type ExistingUnit,
} from "@/app/actions/ai-product-text";
import { useSuggestProductFromText } from "@/lib/query/mutations";
import type { AiProductTextSuggestion } from "@/lib/schemas/ai-product-text";
import { cn } from "@/lib/utils";

type Props = {
  // Categories + units are passed so the AI prompt has them as context
  // (Hallmark: the IA suggests from what's actually available, not invented).
  categories: ExistingCategory[];
  units: ExistingUnit[];

  onApplyName: (name: string) => void;
  onApplyCategory: (categoryName: string) => void;
  onApplyUnit: (unitCode: string) => void;
  onApplyPriceBuy: (price: number) => void;
  onApplyPriceSale: (price: number) => void;
  onApplyInitialStock: (stock: number) => void;
};

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

type ApplyableField = Exclude<keyof AiProductTextSuggestion, "confidence">;

const FIELD_LABELS: Record<ApplyableField, string> = {
  name: "Nombre",
  categoryName: "Categoría",
  unitCode: "Unidad",
  priceBuy: "Precio compra",
  priceSale: "Precio venta",
  initialStock: "Inventario inicial",
};

function confidenceTone(c: number): "success" | "warning" | "muted" {
  if (c >= 0.7) return "success";
  if (c >= 0.4) return "warning";
  return "muted";
}

const TONE_CLASS: Record<"success" | "warning" | "muted", string> = {
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/20",
  muted: "bg-secondary text-secondary-foreground ring-1 ring-inset ring-border",
};

function describeConfidence(c: number): string {
  if (c >= 0.85) return "muy seguro";
  if (c >= 0.5) return "probable";
  if (c >= 0.2) return "poco seguro";
  return "no estoy seguro";
}

function formatField(field: ApplyableField, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "priceBuy" || field === "priceSale") {
    return esMXCurrency.format(Number(value));
  }
  if (field === "initialStock") {
    return `${value}`;
  }
  return String(value);
}

const APPLY_FIELDS: ApplyableField[] = [
  "name",
  "categoryName",
  "unitCode",
  "priceBuy",
  "priceSale",
  "initialStock",
];

export function AiTextSuggest({
  categories,
  units,
  onApplyName,
  onApplyCategory,
  onApplyUnit,
  onApplyPriceBuy,
  onApplyPriceSale,
  onApplyInitialStock,
}: Props) {
  const suggest = useSuggestProductFromText();
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState<AiProductTextSuggestion | null>(
    null,
  );
  const [open, setOpen] = useState(true);

  async function handleSuggest() {
    const trimmed = description.trim();
    if (trimmed.length < 3) {
      toast.error("Describe el producto con al menos unas palabras.");
      return;
    }
    const res = await suggest.mutateAsync({
      description: trimmed,
      categories,
      units,
    });
    if (res.ok) {
      setSuggestion(res.suggestion);
      const hasAny = APPLY_FIELDS.some(
        (f) => (res.suggestion[f] as unknown) !== null,
      );
      if (!hasAny) {
        toast.error("La IA no pudo inferir nada. Reformula la descripción.");
      }
    } else {
      toast.error(res.error);
    }
  }

  function applyField(field: ApplyableField) {
    if (!suggestion) return;
    const value = suggestion[field];
    if (value === null) return;
    switch (field) {
      case "name":
        onApplyName(String(value));
        break;
      case "categoryName":
        onApplyCategory(String(value));
        break;
      case "unitCode":
        onApplyUnit(String(value));
        break;
      case "priceBuy":
        onApplyPriceBuy(Number(value));
        break;
      case "priceSale":
        onApplyPriceSale(Number(value));
        break;
      case "initialStock":
        onApplyInitialStock(Number(value));
        break;
    }
    toast.success(`${FIELD_LABELS[field]} aplicado.`);
  }

  function applyAll() {
    if (!suggestion) return;
    let applied = 0;
    for (const field of APPLY_FIELDS) {
      const value = suggestion[field];
      if (value === null) continue;
      applyField(field);
      applied++;
    }
    if (applied > 0) {
      toast.success(
        `${applied} sugerencia${applied === 1 ? "" : "s"} aplicada${applied === 1 ? "" : "s"}. Revisa y completa el resto.`,
      );
    }
  }

  const isPending = suggest.isPending;
  const hasAnySuggestion = suggestion
    ? APPLY_FIELDS.some((f) => (suggestion[f] as unknown) !== null)
    : false;

  return (
    <div
      data-tour="product-ai-suggest"
      className="rounded-lg border border-border bg-card p-4"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <WandSparkles aria-hidden className="size-4 text-primary" />
          Describe el producto y la IA sugiere los campos
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Escribe una frase con lo que sabes: marca, presentación, precio de
            compra, precio de venta y cantidad que tienes. La IA sugiere los
            campos. Tú siempre puedes corregir.
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Ej. "Suavitel aroma bebé 1L, tengo 10 piezas, lo compro en 10 y lo vendo en 16"'
            rows={3}
            maxLength={500}
            disabled={isPending}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {description.length}/500
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleSuggest}
              disabled={isPending || description.trim().length < 3}
            >
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                  Sugiriendo…
                </>
              ) : (
                <>
                  <Sparkles aria-hidden className="size-3.5" />
                  Sugerir con IA
                </>
              )}
            </Button>
          </div>

          {suggestion ? (
            <div
              className="flex flex-col gap-2 rounded-md border border-border bg-background p-3"
              role="region"
              aria-label="Sugerencias de la IA"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Sugerencias
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    TONE_CLASS[confidenceTone(suggestion.confidence)],
                  )}
                >
                  {Math.round(suggestion.confidence * 100)}% ·{" "}
                  {describeConfidence(suggestion.confidence)}
                </Badge>
              </div>

              <dl className="flex flex-col divide-y divide-border">
                {APPLY_FIELDS.map((field) => {
                  const value = suggestion[field];
                  const isEmpty = value === null;
                  return (
                    <div
                      key={field}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                        {FIELD_LABELS[field]}
                      </dt>
                      <dd className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-right text-sm font-medium tabular-nums",
                            isEmpty
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {formatField(field, value)}
                        </span>
                        {!isEmpty ? (
                          <button
                            type="button"
                            onClick={() => applyField(field)}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                          >
                            Usar
                          </button>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              {hasAnySuggestion ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyAll}
                  className="self-end"
                >
                  Aplicar todo
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
