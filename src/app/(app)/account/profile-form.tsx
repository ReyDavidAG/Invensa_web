"use client";

/* Hallmark · locked system applied (Taller) · src/app/(app)/account/profile-form.tsx
 * Edit-name form for the /account page. RHF + zodResolver + useUpdateProfile.
 * Every control disables while the mutation is in flight; field-level
 * errors come from RHF (client validation) and from the server response
 * (re-validated against the same schema).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateProfile } from "@/lib/query/mutations";
import {
  type ProfileUpdateFormValues,
  profileUpdateSchema,
} from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

export function ProfileForm({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { fullName },
  });

  // Reset the form when the server-side fullName changes (e.g. after a
  // successful save). Keeps the form in sync with the canonical value.
  useEffect(() => {
    reset({ fullName });
  }, [fullName, reset]);

  const result = updateProfile.data;
  const submitError = result && !result.ok ? result.error : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;
  const isBusy = updateProfile.isPending;

  const onSubmit = handleSubmit(async (data) => {
    const fd = new FormData();
    fd.set("fullName", String(data.fullName ?? ""));
    const res = await updateProfile.mutateAsync(fd);
    if (res.ok) {
      toast.success("Nombre actualizado");
      // Don't reset here — the useEffect on fullName change will sync it.
      return;
    }
    if (!res.fieldErrors) {
      toast.error(res.error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Editar nombre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-busy={isBusy}
          className="flex flex-col gap-4"
        >
          {submitError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}

          <fieldset disabled={isBusy} className="flex flex-col gap-4">
            <Field
              label="Nombre completo"
              hint="Aparece en el dropdown del avatar y en el saludo del dashboard."
              error={errors.fullName?.message ?? fieldErrors?.fullName?.[0]}
            >
              <input
                type="text"
                inputMode="text"
                autoComplete="name"
                placeholder="Carolina Aguilar"
                {...register("fullName")}
                className={inputClass}
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className={cn(inputClass, "cursor-not-allowed opacity-60")}
              />
              <p className="text-xs text-muted-foreground">
                El correo no se puede cambiar desde aquí.
              </p>
            </Field>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || !isDirty}
                onClick={() => reset({ fullName })}
              >
                Descartar cambios
              </Button>
              <Button type="submit" disabled={isBusy || !isDirty}>
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
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && !error ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 disabled:cursor-not-allowed";
