"use client";

/* Hallmark · locked system applied · src/components/form/product-image-dropzone.tsx
 * Drag/drop or click to upload a product image directly to Cloudflare R2.
 *
 * Flow:
 *   1. Client validates file (MIME, size, dimensions) and shows a local preview.
 *   2. Calls requestProductImageUploadAction to get a presigned PUT URL.
 *   3. PUTs the file straight to R2 with XMLHttpRequest (for upload progress).
 *   4. Calls onUploaded(publicUrl, key) so the parent form can persist it.
 *
 * The component never talks to Supabase. The parent decides when to save the
 * imageUrl into products.image_url (typically on form submit).
 */

import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRequestProductImageUpload } from "@/lib/query/mutations";
import { cn } from "@/lib/utils";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_DIMENSION = 320; // px
const PROGRESS_FLASH_MS = 1200;

type DropzoneStatus = "idle" | "requesting" | "uploading" | "done" | "error";

type Props = {
  /** Existing image URL when editing a product. */
  defaultUrl?: string;
  /** Product id; omitted on /new (uses a tmp/ prefix in R2). */
  productId?: string;
  /** Fires after a successful PUT. Parent persists this URL on form save. */
  onUploaded: (publicUrl: string) => void;
  /** Fires when the user removes the staged/committed image. */
  onCleared?: () => void;
  /** Disables interaction while the parent form is submitting. */
  disabled?: boolean;
};

export function ProductImageDropzone({
  defaultUrl,
  productId,
  onUploaded,
  onCleared,
  disabled = false,
}: Props) {
  const [committedUrl, setCommittedUrl] = useState<string | null>(
    defaultUrl ?? null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<DropzoneStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const presign = useRequestProductImageUpload();
  // Keep latest onUploaded in a ref so the async upload closure always calls
  // the most recent callback without re-running on prop identity changes.
  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const displayedUrl = previewUrl ?? committedUrl;
  const isBusy =
    status === "requesting" || status === "uploading" || disabled;

  function clearLocalPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function reset() {
    clearLocalPreview();
    setProgress(0);
    setStatus("idle");
    setErrorMsg(null);
  }

  function handleClearCommitted() {
    setCommittedUrl(null);
    reset();
    onCleared?.();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setErrorMsg(null);

    if (!ALLOWED_MIME.has(file.type)) {
      const msg = "Tipo de imagen no soportado. Usa JPG, PNG o WebP.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = "La imagen pesa más de 5 MB.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const dims = await readImageDimensions(file);
    if (!dims || dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
      const msg = `La imagen es demasiado pequeña (mínimo ${MIN_DIMENSION}×${MIN_DIMENSION}).`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // Show preview immediately while we request the presigned URL.
    const objectUrl = URL.createObjectURL(file);
    clearLocalPreview();
    setPreviewUrl(objectUrl);
    setStatus("requesting");
    setProgress(0);

    try {
      const fd = new FormData();
      fd.set("contentType", file.type);
      fd.set("contentLength", String(file.size));
      fd.set("filename", file.name);
      if (productId) fd.set("productId", productId);

      const presignRes = await presign.mutateAsync(fd);
      if (!presignRes.ok) {
        clearLocalPreview();
        setErrorMsg(presignRes.error);
        setStatus("error");
        toast.error(presignRes.error);
        return;
      }

      setStatus("uploading");
      await uploadWithProgress(presignRes.uploadUrl, file, file.type, (pct) =>
        setProgress(pct),
      );

      // Promote blob preview to committed URL.
      clearLocalPreview();
      setCommittedUrl(presignRes.publicUrl);
      setStatus("done");
      onUploadedRef.current(presignRes.publicUrl);
      toast.success("Imagen lista");

      // Reset progress bar after a short flash so it doesn't linger forever.
      window.setTimeout(() => {
        setProgress(0);
        setStatus("idle");
      }, PROGRESS_FLASH_MS);
    } catch (err) {
      clearLocalPreview();
      const msg =
        err instanceof Error
          ? err.message
          : "No pudimos subir la imagen. Intenta de nuevo.";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="product-image-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 text-center text-sm text-muted-foreground transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {displayedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayedUrl}
            alt="Vista previa del producto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4">
            <ImageIcon
              aria-hidden
              className="size-8 text-muted-foreground/60"
            />
            <span className="font-medium text-foreground">
              Arrastra una imagen aquí
            </span>
            <span className="text-xs">
              o haz click para elegir — JPG, PNG o WebP, hasta 5 MB
            </span>
          </div>
        )}

        {status === "requesting" || status === "uploading" ? (
          <div
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 text-foreground"
          >
            <Loader2 aria-hidden className="size-6 animate-spin" />
            <span className="text-xs">
              {status === "requesting"
                ? "Preparando subida…"
                : `Subiendo… ${progress}%`}
            </span>
            {status === "uploading" ? (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-1.5 w-2/3 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <input
          ref={inputRef}
          id="product-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onInputChange}
          disabled={disabled}
          className="sr-only"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openPicker}
          disabled={isBusy}
        >
          <Upload aria-hidden className="size-3.5" />
          {displayedUrl ? "Reemplazar" : "Subir imagen"}
        </Button>
        {displayedUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearCommitted}
            disabled={isBusy}
          >
            {status === "uploading" || status === "requesting" ? (
              <RefreshCw aria-hidden className="size-3.5" />
            ) : (
              <X aria-hidden className="size-3.5" />
            )}
            Quitar
          </Button>
        ) : null}
        {errorMsg ? (
          <span
            role="alert"
            className="text-xs text-destructive"
          >
            {errorMsg}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
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

function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}