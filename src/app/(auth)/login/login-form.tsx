"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/input-form-field";
import { PasswordFormField } from "@/components/form/password-form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { ErrorBanner } from "../auth-shell";

import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

export function LoginForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const fd = new FormData();
    fd.append("email", data.email);
    fd.append("password", data.password);
    const result = await loginAction(null, fd);
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
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="ejemplo@correo.com"
          inputMode="email"
        />

        <PasswordFormField
          name="password"
          autoComplete="current-password"
        />

        <SubmitButton
          loading={form.formState.isSubmitting}
          loadingLabel="Verificando…"
          className="mt-2 w-full"
        >
          Iniciar sesión
        </SubmitButton>
      </form>
    </Form>
  );
}
