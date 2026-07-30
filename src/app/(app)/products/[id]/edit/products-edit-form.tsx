"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreatableCombobox,
  type CreatableOption,
} from "@/components/form/creatable-combobox";
import { ProductImageDropzone } from "@/components/form/product-image-dropzone";
import { FadeUp } from "@/components/motion/fade-up";
import {
  useCreateCategory,
  useCreateUnit,
  useUpdateProduct,
} from "@/lib/query/mutations";
import { cn } from "@/lib/utils";
import {
  type ProductUpdateFormValues,
  productUpdateSchema,
} from "@/lib/schemas/products";

type EditProductFormProps = {
  productId: string;
  defaults: ProductUpdateFormValues;
  categories: CreatableOption[];
  units: CreatableOption[];
};

export function EditProductForm({
  productId,
  defaults,
  categories,
  units,
}: EditProductFormProps) {
  const router = useRouter();
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [unitOptions, setUnitOptions] = useState(units);

  const updateProduct = useUpdateProduct(productId);
  const createCategory = useCreateCategory();
  const createUnit = useCreateUnit();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductUpdateFormValues>({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: defaults,
  });

  const isSubmitting = updateProduct.isPending;
  const isCreatingTaxonomy = createCategory.isPending || createUnit.isPending;
  const isBusy = isSubmitting || isCreatingTaxonomy;

  const result = updateProduct.data;
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
    const res = await updateProduct.mutateAsync(fd);
    if (res.ok) {
      toast.success("Cambios guardados");
      router.push(`/products/${productId}`);
      return;
    }
    if (!res.fieldErrors) {
      toast.error(res.error);
    }
  });

  return (
    <FadeUp>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-6"
        noValidate
        aria-busy={isBusy}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:items-start sm:justify-between">
          <div>
            <Link
              href={`/products/${productId}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
              Detalle del producto
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Editar producto
            </h1>
          </div>
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
                  defaultUrl={defaults.imageUrl ?? undefined}
                  productId={productId}
                  onUploaded={(url) =>
                    setValue("imageUrl", url, { shouldValidate: true })
                  }
                  disabled={isBusy}
                />
                <Field
                  label="URL de imagen"
                  hint="Se llena al subir la imagen. Puedes pegar otra URL manualmente si ya tienes una."
                  error={errors.imageUrl?.message ?? fieldErrors?.imageUrl?.[0]}
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
                    {...register("name")}
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Categoría"
                    error={
                      errors.categoryId?.message ?? fieldErrors?.categoryId?.[0]
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
                          const result = await createCategory.mutateAsync(name);
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
                            setUnitOptions((prev) => [...prev, result.option]);
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

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button
                    render={<Link href={`/products/${productId}`} />}
                    nativeButton={false}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isBusy} data-tour="product-form-submit">
                    {isSubmitting ? (
                      <>
                        <Loader2 aria-hidden className="size-4 animate-spin" />
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
