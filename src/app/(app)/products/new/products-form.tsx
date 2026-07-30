"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreatableCombobox,
  type CreatableOption,
} from "@/components/form/creatable-combobox";
import { ProductImageDropzone } from "@/components/form/product-image-dropzone";
import { AiPhotoImport } from "@/components/form/ai-photo-import";
import { FadeUp } from "@/components/motion/fade-up";
import {
  useCreateCategory,
  useCreateProduct,
  useCreateUnit,
} from "@/lib/query/mutations";
import { cn } from "@/lib/utils";
import {
  type ProductCreateFormValues,
  productCreateSchema,
} from "@/lib/schemas/products";
import type { AiProductParsed } from "@/lib/schemas/ai-product";

type ProductsFormProps = {
  categories: CreatableOption[];
  units: CreatableOption[];
};

export function NewProductForm({ categories, units }: ProductsFormProps) {
  const router = useRouter();
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [unitOptions, setUnitOptions] = useState(units);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [pendingNewItems, setPendingNewItems] = useState<{
    category?: string;
    unit?: string;
  } | null>(null);
  const [creatingItems, setCreatingItems] = useState(false);

  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();
  const createUnit = useCreateUnit();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      code: "",
      name: "",
      categoryId: "",
      unitId: "",
      priceSale: 0,
      priceBuy: 0,
      stockLowThreshold: 5,
      initialStock: 0,
      imageUrl: "",
    },
  });

  const isSubmitting = createProduct.isPending;
  const isCreatingTaxonomy = createCategory.isPending || createUnit.isPending;
  const isBusy = isSubmitting || isCreatingTaxonomy;

  // After a successful create the mutation holds the result; read it for
  // top-level error banner and per-field errors. Once ok=true we navigate
  // away and the form unmounts, so the effect below handles the transition.
  const result = createProduct.data;
  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;
  const submitError = result && !result.ok ? result.error : null;

  const categoryId = watch("categoryId") ?? "";
  const unitId = watch("unitId") ?? "";

  const onSubmit = handleSubmit(async (data) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null) continue;
      fd.set(k, String(v));
    }
    const res = await createProduct.mutateAsync(fd);
    if (res.ok) {
      toast.success("Producto creado");
      router.push(`/products/${res.id}`);
      return;
    }
    if (!res.fieldErrors) {
      toast.error(res.error);
    }
  });

  function applyAiResult(parsed: AiProductParsed) {
    if (parsed.name) setValue("name", parsed.name, { shouldValidate: true });
    if (parsed.code) setValue("code", parsed.code, { shouldValidate: true });
    if (parsed.priceSale !== null)
      setValue("priceSale", parsed.priceSale, { shouldValidate: true });
    if (parsed.priceBuy !== null)
      setValue("priceBuy", parsed.priceBuy, { shouldValidate: true });

    // Category: match exactly, otherwise queue for create confirmation.
    let matchedCategoryId: string | null = null;
    if (parsed.categoryName) {
      const match = categoryOptions.find(
        (c) => c.name.toLowerCase() === parsed.categoryName!.toLowerCase(),
      );
      if (match) {
        matchedCategoryId = match.id;
        setValue("categoryId", match.id, { shouldValidate: true });
      }
    }

    // Unit: same logic.
    let matchedUnitId: string | null = null;
    if (parsed.unitCode) {
      const match = unitOptions.find(
        (u) => u.code.toLowerCase() === parsed.unitCode!.toLowerCase(),
      );
      if (match) {
        matchedUnitId = match.id;
        setValue("unitId", match.id, { shouldValidate: true });
      }
    }

    // Queue missing items for the create-new confirmation dialog.
    const pending: { category?: string; unit?: string } = {};
    if (parsed.categoryName && !matchedCategoryId)
      pending.category = parsed.categoryName;
    if (parsed.unitCode && !matchedUnitId) pending.unit = parsed.unitCode;
    if (pending.category || pending.unit) {
      setPendingNewItems(pending);
      return; // Dialog will handle the rest; toast fires after dialog closes.
    }

    toast.success("Campos aplicados. Revisa y guarda.");
  }

  async function confirmCreateMissing() {
    if (!pendingNewItems) return;
    setCreatingItems(true);
    try {
      if (pendingNewItems.category) {
        const name = pendingNewItems.category;
        const res = await createCategory.mutateAsync(name);
        if (res.ok) {
          setCategoryOptions((prev) => [...prev, res.option]);
          setValue("categoryId", res.option.id, { shouldValidate: true });
        } else {
          toast.error(`No se pudo crear la categoría: ${res.error}`);
        }
      }
      if (pendingNewItems.unit) {
        const code = pendingNewItems.unit;
        const res = await createUnit.mutateAsync(code);
        if (res.ok) {
          setUnitOptions((prev) => [...prev, res.option]);
          setValue("unitId", res.option.id, { shouldValidate: true });
        } else {
          toast.error(`No se pudo crear la unidad: ${res.error}`);
        }
      }
      toast.success("Campos aplicados. Revisa y guarda.");
    } finally {
      setCreatingItems(false);
      setPendingNewItems(null);
    }
  }

  function skipCreatingMissing() {
    setPendingNewItems(null);
    toast.success(
      "Campos aplicados. Selecciona manualmente categoría/unidad si hace falta.",
    );
  }

  return (
    <>
      <FadeUp>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-6"
          noValidate
          aria-busy={isBusy}
        >
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
                Productos
              </Link>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
                Nuevo producto
              </h1>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiSheetOpen(true)}
              disabled={isBusy}
            >
              <Sparkles aria-hidden className="size-4 text-primary" />
              Importar con foto
            </Button>
          </div>

          <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

          {submitError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}

          <fieldset disabled={isBusy} className="contents">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column — image */}
              <Card data-tour="product-form-image">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    Imagen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductImageDropzone
                    onUploaded={(url) =>
                      setValue("imageUrl", url, { shouldValidate: true })
                    }
                    disabled={isBusy}
                  />
                  <Field
                    label="URL de imagen"
                    hint="Se llena al subir la imagen. Puedes pegar otra URL manualmente si ya tienes una."
                    error={
                      errors.imageUrl?.message ?? fieldErrors?.imageUrl?.[0]
                    }
                    className="mt-3"
                  >
                    <input
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://…"
                      {...register("imageUrl")}
                      className={inputClass}
                    />
                  </Field>
                </CardContent>
              </Card>

              {/* Right column — fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    Detalles
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Field
                    label="SKU"
                    error={errors.code?.message ?? fieldErrors?.code?.[0]}
                  >
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      placeholder="PZA-001"
                      {...register("code")}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Nombre"
                    error={errors.name?.message ?? fieldErrors?.name?.[0]}
                  >
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      placeholder="Fab Ultra 1L"
                      {...register("name")}
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Categoría"
                      error={
                        errors.categoryId?.message ??
                        fieldErrors?.categoryId?.[0]
                      }
                    >
                      <CreatableCombobox
                        value={categoryId}
                        onChange={(v) =>
                          setValue("categoryId", v, { shouldValidate: true })
                        }
                        options={categoryOptions}
                        onCreate={async (name) => {
                          try {
                            const result =
                              await createCategory.mutateAsync(name);
                            if (result.ok) {
                              setCategoryOptions((prev) => [
                                ...prev,
                                result.option,
                              ]);
                              toast.success(
                                `Categoría "${result.option.name}" creada`,
                              );
                            }
                            return result;
                          } catch (err) {
                            return {
                              ok: false,
                              error:
                                err instanceof Error
                                  ? err.message
                                  : "Error desconocido",
                            };
                          }
                        }}
                        placeholder="Selecciona o crea una categoría…"
                        createNoun="categoría"
                      />
                    </Field>

                    <Field
                      label="Unidad"
                      error={errors.unitId?.message ?? fieldErrors?.unitId?.[0]}
                    >
                      <CreatableCombobox
                        value={unitId}
                        onChange={(v) =>
                          setValue("unitId", v, { shouldValidate: true })
                        }
                        options={unitOptions}
                        onCreate={async (name) => {
                          try {
                            const result = await createUnit.mutateAsync(name);
                            if (result.ok) {
                              setUnitOptions((prev) => [
                                ...prev,
                                result.option,
                              ]);
                              toast.success(
                                `Unidad "${result.option.name}" creada`,
                              );
                            }
                            return result;
                          } catch (err) {
                            return {
                              ok: false,
                              error:
                                err instanceof Error
                                  ? err.message
                                  : "Error desconocido",
                            };
                          }
                        }}
                        placeholder="Selecciona o crea una unidad…"
                        createNoun="unidad"
                        renderSelected={(u) => (
                          <>
                            <span className="truncate">{u.name}</span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                              {u.code}
                            </span>
                          </>
                        )}
                        renderOption={(u) => (
                          <>
                            <span className="truncate">{u.name}</span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                              {u.code}
                            </span>
                          </>
                        )}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Precio compra (MXN)"
                      error={
                        errors.priceBuy?.message ?? fieldErrors?.priceBuy?.[0]
                      }
                    >
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        {...register("priceBuy")}
                        className={cn(inputClass, "font-mono tabular-nums")}
                      />
                    </Field>

                    <Field
                      label="Precio venta (MXN)"
                      error={
                        errors.priceSale?.message ?? fieldErrors?.priceSale?.[0]
                      }
                    >
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        {...register("priceSale")}
                        className={cn(inputClass, "font-mono tabular-nums")}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Umbral de stock bajo"
                    hint="Te avisamos cuando el stock quede en o por debajo de este número."
                    error={
                      errors.stockLowThreshold?.message ??
                      fieldErrors?.stockLowThreshold?.[0]
                    }
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register("stockLowThreshold")}
                      className={cn(inputClass, "font-mono tabular-nums")}
                    />
                  </Field>

                  <Field
                    label="Inventario inicial (opcional)"
                    hint="Si es mayor a 0, se registra automáticamente como una entrada."
                    error={
                      errors.initialStock?.message ??
                      fieldErrors?.initialStock?.[0]
                    }
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register("initialStock")}
                      className={cn(inputClass, "font-mono tabular-nums")}
                    />
                  </Field>

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button
                      render={<Link href="/products" />}
                      nativeButton={false}
                      type="button"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isBusy} data-tour="product-form-submit">
                      {isSubmitting ? (
                        <>
                          <Loader2
                            aria-hidden
                            className="size-4 animate-spin"
                          />
                          Guardando…
                        </>
                      ) : (
                        <>
                          <Save aria-hidden className="size-4" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </fieldset>
        </form>
      </FadeUp>

      <AiPhotoImport
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        onApply={applyAiResult}
      />

      <Dialog
        open={pendingNewItems !== null}
        onOpenChange={(open) => {
          if (!open) skipCreatingMissing();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear elementos nuevos</DialogTitle>
            <DialogDescription>
              La IA sugirió estos valores que aún no existen en tu catálogo.
              ¿Los creo para que el producto se guarde con ellos?
            </DialogDescription>
          </DialogHeader>
          <ul role="list" className="flex flex-col gap-2 text-sm">
            {pendingNewItems?.category ? (
              <li className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    Categoría
                  </span>
                  <span className="font-medium text-foreground">
                    {pendingNewItems.category}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  nueva
                </span>
              </li>
            ) : null}
            {pendingNewItems?.unit ? (
              <li className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    Unidad
                  </span>
                  <span className="font-medium text-foreground">
                    {pendingNewItems.unit}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  nueva
                </span>
              </li>
            ) : null}
          </ul>
          <DialogFooter className="gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={creatingItems}
                />
              }
            >
              Elegir manualmente
            </DialogClose>
            <Button
              type="button"
              onClick={confirmCreateMissing}
              disabled={creatingItems}
            >
              {creatingItems ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Creando…
                </>
              ) : (
                "Crear y aplicar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const errorId = error ? `${label}-error` : undefined;
  const hintId = hint ? `${label}-hint` : undefined;
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && !error ? (
        <span id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 disabled:cursor-not-allowed";
