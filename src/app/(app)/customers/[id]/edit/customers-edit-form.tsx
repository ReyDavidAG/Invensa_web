"use client";

/* Hallmark · locked system applied (Taller) · src/app/(app)/customers/[id]/edit/customers-edit-form.tsx
 * Edit-customer form. RHF + zodResolver + useUpdateCustomer mutation.
 * Pre-populated with the client's current values. Disabled while submitting.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";
import { useUpdateCustomer } from "@/lib/query/mutations";
import {
  type CustomerUpdateFormValues,
  customerUpdateSchema,
} from "@/lib/schemas/customers";
import { cn } from "@/lib/utils";

export function EditCustomerForm({
  customerId,
  defaults,
}: {
  customerId: string;
  defaults: CustomerUpdateFormValues;
}) {
  const router = useRouter();
  const updateCustomer = useUpdateCustomer(customerId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerUpdateFormValues>({
    resolver: zodResolver(customerUpdateSchema),
    defaultValues: defaults,
  });

  const result = updateCustomer.data;
  const submitError = result && !result.ok ? result.error : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;
  const isBusy = updateCustomer.isPending;

  const onSubmit = handleSubmit(async (data) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null) continue;
      fd.set(k, String(v));
    }
    const res = await updateCustomer.mutateAsync(fd);
    if (res.ok) {
      toast.success("Cambios guardados");
      router.push(`/customers/${customerId}`);
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
      <div>
        <Link
          href={`/customers/${customerId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          Detalle del cliente
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Editar cliente
        </h1>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Datos del cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              label="Nombre"
              required
              error={errors.name?.message ?? fieldErrors?.name?.[0]}
            >
              <input
                type="text"
                inputMode="text"
                autoComplete="name"
                {...register("name")}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Teléfono"
                error={errors.phone?.message ?? fieldErrors?.phone?.[0]}
              >
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  className={cn(inputClass, "font-mono tabular-nums")}
                />
              </Field>

              <Field
                label="Email"
                error={errors.email?.message ?? fieldErrors?.email?.[0]}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  {...register("email")}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Dirección"
              error={errors.address?.message ?? fieldErrors?.address?.[0]}
            >
              <input
                type="text"
                inputMode="text"
                autoComplete="street-address"
                {...register("address")}
                className={inputClass}
              />
            </Field>

            <Field
              label="Notas"
              error={errors.notes?.message ?? fieldErrors?.notes?.[0]}
            >
              <textarea
                rows={3}
                autoComplete="off"
                {...register("notes")}
                className={cn(inputClass, "min-h-24 py-2 leading-relaxed")}
              />
            </Field>

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                render={<Link href={`/customers/${customerId}`} />}
                nativeButton={false}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? (
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
      </fieldset>
    </form>
    </FadeUp>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">
        {label}
        {required ? (
          <span aria-label="obligatorio" className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 disabled:cursor-not-allowed";
