"use client";

import {
  CheckCircle2,
  CircleAlert,
  FileUp,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { BulkTemplateButton } from "@/components/form/bulk-template-button";
import {
  useBulkCreateProducts,
  usePreviewBulkTaxonomy,
} from "@/lib/query/mutations";
import { parseCsv } from "@/lib/csv/parser";
import {
  BULK_CSV_COLUMNS,
  bulkCsvRowSchema,
  type BulkCsvColumn,
} from "@/lib/schemas/bulk-product";
import type { BulkCreateProductsResult } from "@/app/actions/bulk-products";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Step = "paste" | "preview" | "result";

type ParsedRow =
  | { ok: true; index: number; row: Record<string, unknown> }
  | { ok: false; index: number; raw: string[]; error: string };

const PLACEHOLDER = `${BULK_CSV_COLUMNS.join(",")}
PZA-001,Fab Ultra 1L,Limpieza,L,40,89,12,5
PZA-002,Pinol 1L,Limpieza,L,35,75,8,5`;

export function BulkProductImport({ open, onOpenChange }: Props) {
  const router = useRouter();
  const bulkCreate = useBulkCreateProducts();
  const previewTaxonomy = usePreviewBulkTaxonomy();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>("paste");
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<BulkCreateProductsResult | null>(null);
  const [taxonomyPreview, setTaxonomyPreview] = useState<{
    newCategories: Set<string>;
    newUnits: Set<string>;
  } | null>(null);

  // Re-derive parsed rows whenever the user edits the CSV text.
  const liveParsed = useMemo(() => parsePreview(csvText), [csvText]);
  const validRows = useMemo(
    () => liveParsed.filter((r): r is Extract<ParsedRow, { ok: true }> => r.ok),
    [liveParsed],
  );
  const invalidCount = liveParsed.length - validRows.length;

  function reset() {
    setStep("paste");
    setCsvText("");
    setParsedRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setCsvText(text);
      toast.success(`Archivo "${file.name}" cargado.`);
    });
  }

  async function goPreview() {
    setParsedRows(liveParsed);
    setStep("preview");
    // Ask the server which categories/units already exist so the preview
    // can flag new ones. Non-blocking — fall back to empty on error.
    try {
      const fd = new FormData();
      fd.set(
        "rows",
        JSON.stringify(
          liveParsed.flatMap((r) =>
            r.ok
              ? [{ categoryName: r.row.categoryName, unitCode: r.row.unitCode }]
              : [],
          ),
        ),
      );
      const res = await previewTaxonomy.mutateAsync(fd);
      if (res.ok) {
        setTaxonomyPreview({
          newCategories: new Set(
            res.categories.new.map((n) => n.toLowerCase()),
          ),
          newUnits: new Set(res.units.new.map((u) => u.toLowerCase())),
        });
      }
    } catch {
      setTaxonomyPreview(null);
    }
  }

  async function submit() {
    const fd = new FormData();
    fd.set("rows", JSON.stringify(validRows.map((r) => r.row)));
    const res = await bulkCreate.mutateAsync(fd);
    setResult(res);
    setStep("result");
    if (res.created > 0) {
      toast.success(`${res.created} producto(s) creado(s).`);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importación masiva</DialogTitle>
          <DialogDescription>
            Pega filas CSV o sube un archivo. Las filas válidas se crean
            directamente; las que fallan se reportan con el motivo.
          </DialogDescription>
        </DialogHeader>

        {step === "paste" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="bulk-csv">Filas CSV (incluye encabezado)</Label>
              <div className="flex items-center gap-1">
                <BulkTemplateButton />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bulkCreate.isPending}
                >
                  <FileUp aria-hidden className="size-3.5" />
                  Subir .csv
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                className="sr-only"
              />
            </div>
            <textarea
              id="bulk-csv"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={10}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <p className="text-xs text-muted-foreground">
              {liveParsed.length === 0
                ? "Pega al menos una fila debajo del encabezado."
                : `${validRows.length} fila(s) válida(s)${
                    invalidCount > 0 ? `, ${invalidCount} con error` : ""
                  }.`}
            </p>
            <DialogFooter className="gap-2">
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bulkCreate.isPending}
                  />
                }
              >
                Cancelar
              </DialogClose>
              <Button
                type="button"
                onClick={goPreview}
                disabled={validRows.length === 0}
              >
                Revisar {validRows.length} fila(s)
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "preview" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Revisa antes de crear. Las filas en rojo no se crearán.
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setStep("paste")}
                disabled={bulkCreate.isPending}
              >
                Volver
              </Button>
            </div>
            <div className="max-h-80 overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/50">
                  <tr className="border-b border-border">
                    {BULK_CSV_COLUMNS.map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-2 py-2 text-left font-medium text-muted-foreground"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((r) => {
                    if (r.ok) {
                      const row = r.row as Record<string, unknown>;
                      return (
                        <tr
                          key={r.index}
                          className="bg-background hover:bg-muted/30"
                        >
                          {BULK_CSV_COLUMNS.map((col) => {
                            const key = colKey(col);
                            const isNewTaxonomy =
                              (key === "categoryName" &&
                                taxonomyPreview?.newCategories.has(
                                  String(row[key] ?? "").toLowerCase(),
                                )) ||
                              (key === "unitCode" &&
                                taxonomyPreview?.newUnits.has(
                                  String(row[key] ?? "").toLowerCase(),
                                ));
                            return (
                              <td
                                key={col}
                                className="px-2 py-1.5 font-mono tabular-nums"
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {formatCell(key, row[key])}
                                  {isNewTaxonomy ? (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full bg-warning/15 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-warning ring-1 ring-inset ring-warning/20"
                                    >
                                      + nueva
                                    </Badge>
                                  ) : null}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }
                    return (
                      <tr key={r.index} className="bg-destructive/5">
                        {BULK_CSV_COLUMNS.map((col, i) => (
                          <td
                            key={col}
                            className={cn(
                              "px-2 py-1.5 font-mono tabular-nums",
                              i === 0
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {i === 0
                              ? r.raw[0] || `Fila ${r.index + 2}`
                              : r.raw[i] || ""}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("paste")}
                disabled={bulkCreate.isPending}
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={validRows.length === 0 || bulkCreate.isPending}
              >
                {bulkCreate.isPending ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Creando…
                  </>
                ) : (
                  <>
                    <Save aria-hidden className="size-4" />
                    Crear {validRows.length} producto(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <Badge
                variant="outline"
                className="rounded-full bg-success/10 px-3 py-1 text-success ring-1 ring-inset ring-success/20"
              >
                <CheckCircle2 aria-hidden className="mr-1 size-3" />
                {result.created} creado(s)
              </Badge>
              {result.failed > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full bg-destructive/10 px-3 py-1 text-destructive ring-1 ring-inset ring-destructive/20"
                >
                  <XCircle aria-hidden className="mr-1 size-3" />
                  {result.failed} con error
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground"
                >
                  <CircleAlert aria-hidden className="mr-1 size-3" />
                  Sin errores
                </Badge>
              )}
            </div>
            <div className="max-h-72 overflow-auto rounded-md border border-border">
              <ul role="list" className="divide-y divide-border">
                {result.rows.map((r, i) => (
                  <li
                    key={`${r.code}-${i}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs",
                      r.ok ? "" : "bg-destructive/5",
                    )}
                  >
                    {r.ok ? (
                      <CheckCircle2
                        aria-hidden
                        className="size-4 shrink-0 text-success"
                      />
                    ) : (
                      <XCircle
                        aria-hidden
                        className="size-4 shrink-0 text-destructive"
                      />
                    )}
                    <span className="font-mono tabular-nums">
                      {r.ok ? r.code : r.code}
                    </span>
                    <span
                      className={cn(
                        "ml-auto text-right",
                        r.ok ? "text-muted-foreground" : "text-destructive",
                      )}
                    >
                      {r.ok ? "creado" : r.error}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={reset}>
                Importar más
              </Button>
              <DialogClose
                render={
                  <Button type="button" disabled={bulkCreate.isPending} />
                }
              >
                Cerrar
              </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function parsePreview(text: string): ParsedRow[] {
  if (!text.trim()) return [];
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  // First row is the header. Validate it matches the expected columns.
  const [header, ...dataRows] = rows;
  const headerMatches =
    header.length === BULK_CSV_COLUMNS.length &&
    header.every(
      (cell, i) =>
        normaliseHeader(cell) === normaliseHeader(BULK_CSV_COLUMNS[i]),
    );
  if (!headerMatches) {
    // Be lenient: still try to parse as data, but mark all rows as invalid with a clear error.
    return dataRows.map((raw, idx) => ({
      ok: false,
      index: idx,
      raw,
      error: "Encabezado inválido. Debe ser: " + BULK_CSV_COLUMNS.join(", "),
    }));
  }
  return dataRows.map((raw, idx) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < BULK_CSV_COLUMNS.length; i += 1) {
      obj[colKey(BULK_CSV_COLUMNS[i])] = raw[i] ?? "";
    }
    const parsed = bulkCsvRowSchema.safeParse(obj);
    if (parsed.success) {
      return {
        ok: true,
        index: idx,
        row: parsed.data as unknown as Record<string, unknown>,
      };
    }
    const first = parsed.error.issues[0];
    return {
      ok: false,
      index: idx,
      raw,
      error: first
        ? `${first.path.join(".") || "fila"}: ${first.message}`
        : "Datos inválidos",
    };
  });
}

function colKey(col: BulkCsvColumn): string {
  switch (col) {
    case "Código":
      return "code";
    case "Nombre":
      return "name";
    case "Categoría":
      return "categoryName";
    case "Unidad":
      return "unitCode";
    case "Precio compra":
      return "priceBuy";
    case "Precio venta":
      return "priceSale";
    case "Stock inicial":
      return "initialStock";
    case "Umbral":
      return "stockLowThreshold";
    default:
      return "";
  }
}

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "priceBuy" || key === "priceSale") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }
  return String(value);
}

function normaliseHeader(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
