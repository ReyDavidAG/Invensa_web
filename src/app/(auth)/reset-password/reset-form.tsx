"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { PasswordFormField } from "@/components/form/password-form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { ErrorBanner } from "../auth-shell";

import { resetPasswordAction } from "@/app/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";

export function ResetForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    const fd = new FormData();
    fd.append("password", data.password);
    fd.append("confirmPassword", data.confirmPassword);
    const result = await resetPasswordAction(null, fd);
    if (result && !result.ok) {
      setServerError(result.error);
    }
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        {serverError ? <ErrorBanner message={serverError} /> : null}

        <PasswordFormField
          name="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          description="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        />

        <PasswordFormField
          name="confirmPassword"
          label="Confirma la contraseña"
          autoComplete="new-password"
        />

        <SubmitButton
          loading={form.formState.isSubmitting}
          loadingLabel="Guardando…"
          className="mt-2 w-full"
        >
          Guardar contraseña
        </SubmitButton>
      </form>
    </Form>
  );
}
