"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/input-form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { ErrorBanner } from "../auth-shell";

import { forgotPasswordAction } from "@/app/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/auth";

export function ForgotForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    const fd = new FormData();
    fd.append("email", data.email);
    const result = await forgotPasswordAction(null, fd);
    if (result && !result.ok) {
      setServerError(result.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-4"
      >
        <p className="text-sm font-semibold text-foreground">
          Revisa tu bandeja
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Si la dirección está registrada, te enviamos un correo con un enlace
          para crear una contraseña nueva. Tarda unos segundos.
        </p>
      </div>
    );
  }

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
          description="Te enviaremos un enlace para crear una contraseña nueva."
        />

        <div data-tour="forgot-submit">
          <SubmitButton
            loading={form.formState.isSubmitting}
            loadingLabel="Enviando…"
            className="mt-2 w-full"
        >
          Enviar enlace
        </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
