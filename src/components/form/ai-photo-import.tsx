"use client";

import { Camera, ImageIcon, Loader2, Save, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useParseProductPhoto } from "@/lib/query/mutations";
import { resizeImage } from "@/lib/image/resize";
import type { AiProductParsed } from "@/lib/schemas/ai-product";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (parsed: AiProductParsed) => void;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  code: "Código",
  unitCode: "Unidad",
  priceSale: "Precio venta",
  priceBuy: "Precio compra",
  categoryName: "Categoría",
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

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "priceSale" || field === "priceBuy") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }
  return String(value);
}

export function AiPhotoImport({ open, onOpenChange, onApply }: Props) {
  const parsePhoto = useParseProductPhoto();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<AiProductParsed | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Reset transient state when the sheet closes.
  useEffect(() => {
    if (open) return;
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setParsed(null);
  }, [open, imagePreview]);

  async function handleFile(file: File) {
    // Resize client-side to keep the Server Action body under 1 MB.
    let toAnalyze = file;
    try {
      toAnalyze = await resizeImage(file);
    } catch (e) {
      console.warn("[ai-photo-import] resize failed", e);
    }
    setImageFile(toAnalyze);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(toAnalyze));
    setParsed(null);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset both inputs so picking the same file twice fires onChange.
    e.target.value = "";
  }

  async function analyze() {
    if (!imageFile) return;
    const fd = new FormData();
    fd.set("image", imageFile);
    const res = await parsePhoto.mutateAsync(fd);
    if (res.ok) {
      setParsed(res.parsed);
      toast.success("Foto analizada. Revisa los campos.");
    } else {
      toast.error(res.error);
    }
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setParsed(null);
  }

  function applyToForm() {
    if (!parsed) return;
    onApply(parsed);
    onOpenChange(false);
  }

  const isPending = parsePhoto.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="inline-flex items-center gap-2">
            <Sparkles aria-hidden className="size-4 text-primary" />
            Importar con foto
          </SheetTitle>
          <SheetDescription>
            Toma o sube una foto del empaque. La IA intentará llenar los campos
            para que solo los revises.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6">
          {/* Image picker + preview */}
          <div className="flex flex-col gap-3">
            {imagePreview ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                  aria-label="Quitar imagen"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                <ImageIcon
                  aria-hidden
                  className="size-8 text-muted-foreground/60"
                />
                <span className="font-medium text-foreground">
                  Sube una foto del empaque
                </span>
                <span className="text-xs">JPG, PNG o WebP — hasta 5 MB</span>
              </div>
            )}
            {/* Two file inputs: gallery (no capture) and camera (capture=environment).
                Same handler — they only differ in which OS picker they open. */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onInputChange}
              className="sr-only"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={onInputChange}
              className="sr-only"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isPending}
              >
                <ImageIcon aria-hidden className="size-3.5" />
                {imageFile ? "Cambiar foto" : "Elegir foto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isPending}
              >
                <Camera aria-hidden className="size-3.5" />
                Tomar foto
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={analyze}
                disabled={!imageFile || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 aria-hidden className="size-3.5 animate-spin" />
                    Analizando…
                  </>
                ) : (
                  <>
                    <Sparkles aria-hidden className="size-3.5" />
                    Analizar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Parsed fields */}
          {parsed ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Resultado
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    TONE_CLASS[confidenceTone(parsed.confidence)],
                  )}
                >
                  {Math.round(parsed.confidence * 100)}% confianza
                </Badge>
              </div>
              <dl className="flex flex-col divide-y divide-border">
                {Object.entries(FIELD_LABELS).map(([field, label]) => {
                  const value = (parsed as Record<string, unknown>)[field];
                  const isEmpty = value === null || value === undefined;
                  return (
                    <div
                      key={field}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd
                        className={cn(
                          "text-right text-sm font-medium tabular-nums",
                          isEmpty ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {formatValue(field, value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ) : null}

          {/* Apply button */}
          {parsed ? (
            <Button
              type="button"
              onClick={applyToForm}
              size="lg"
              className="w-full"
            >
              <Save aria-hidden className="size-4" />
              Aplicar al formulario
            </Button>
          ) : null}

          <p className="text-xs text-muted-foreground">
            La foto no se guarda. Solo se usa para extraer los datos del
            producto; tú decides qué imagen sube después.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
