"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/input-form-field";
import { PasswordFormField } from "@/components/form/password-form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { ErrorBanner } from "../auth-shell";

import { registerAction } from "@/app/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";

export function RegisterForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    fd.append("password", data.password);
    fd.append("confirmPassword", data.confirmPassword);
    const result = await registerAction(null, fd);
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

        <InputFormField
          name="fullName"
          label="Tu nombre"
          autoComplete="name"
          placeholder="¿Cómo te llamas?"
        />

        <PasswordFormField
          name="password"
          label="Contraseña nueva"
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
          Activar mi cuenta
        </SubmitButton>
      </form>
    </Form>
  );
}
