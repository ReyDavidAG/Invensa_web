"use client";

/* Hallmark · locked system applied (Taller) · src/components/form/bulk-photo-assign-dialog.tsx
 * Assign the same uploaded image to N selected products. Reuses the R2
 * presigned-URL flow from the single-product dropzone (no per-product
 * preview, no per-product remove — the same file applies to all).
 */

import {
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { useRequestProductImageUpload } from "@/lib/query/mutations";
import { resizeImage } from "@/lib/image/resize";
import { cn } from "@/lib/utils";

type Props = {
  productIds: string[];
  productNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function BulkPhotoAssignDialog({
  productIds,
  productNames,
  open,
  onOpenChange,
  onCompleted,
}: Props) {
  const requestUpload = useRequestProductImageUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const count = productIds.length;
  const isPending = requestUpload.isPending;

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(picked: File) {
    setError(null);
    if (!ALLOWED_MIME.has(picked.type)) {
      setError("Tipo de imagen no soportado. Usa JPG, PNG o WebP.");
      return;
    }
    // Resize client-side so the Server Action body stays under 1 MB.
    let toUse = picked;
    try {
      toUse = await resizeImage(picked);
    } catch (e) {
      console.warn("[bulk-photo-assign-dialog] resize failed", e);
    }
    if (toUse.size > MAX_BYTES) {
      setError("La imagen pesa más de 5 MB incluso después de comprimir.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(toUse);
    setPreview(URL.createObjectURL(toUse));
  }

  async function assign() {
    if (!file || count === 0) return;
    // Validate dimensions client-side.
    const dims = await readDimensions(file);
    if (!dims || dims.width < 320 || dims.height < 320) {
      setError("La imagen es demasiado pequeña (mínimo 320×320).");
      return;
    }
    // The bulk flow uses the first selected product's id as the R2 key
    // prefix. All products share the same image URL.
    const firstId = productIds[0]!;
    try {
      const fd = new FormData();
      fd.set("image", file);
      fd.set("productId", firstId);
      const presign = await requestUpload.mutateAsync(fd);
      if (!presign.ok) {
        setError(presign.error);
        toast.error(presign.error);
        return;
      }
      // PUT to R2 with progress (XHR for progress reporting).
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });
      // Apply the same URL to all selected products via a direct fetch
      // — but our project uses Server Actions exclusively. Trigger the
      // dedicated bulk photo action via a route handler would be over-
      // engineered; instead, we round-trip through the existing
      // single-image presign URL and call a small inline batch via the
      // bulk server action exposed through the same `useBulkSetProductImage`
      // hook. The cleanest path: import the action directly.
      const { bulkSetProductImageAction } = await import(
        "@/app/actions/products"
      );
      const res = await bulkSetProductImageAction(
        productIds,
        presign.publicUrl,
      );
      if (res.ok) {
        toast.success(`Imagen aplicada a ${res.updated} productos`);
        onCompleted?.();
        onOpenChange(false);
        reset();
      } else {
        setError(res.error ?? "No se pudo aplicar la imagen.");
        toast.error(res.error ?? "No se pudo aplicar la imagen.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      toast.error("No se pudo subir la imagen.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar foto</DialogTitle>
          <DialogDescription>
            {count === 1
              ? `Se aplicará a 1 producto`
              : `Se aplicará a ${count} productos`}
            {count <= 5 ? `: ${productNames.join(", ")}` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Vista previa"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground/50">
                <ImageIcon className="size-8" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
            >
              <ImagePlus aria-hidden className="size-3.5" />
              {file ? "Cambiar" : "Elegir imagen"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={assign}
              disabled={!file || isPending || count === 0}
            >
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                  Subiendo…
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-3.5" />
                  Aplicar a {count}
                </>
              )}
            </Button>
            {file ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={isPending}
              >
                <X aria-hidden className="size-3.5" />
                Quitar
              </Button>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WebP hasta 5 MB. Mínimo 320×320.
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="sr-only"
          />
        </div>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}