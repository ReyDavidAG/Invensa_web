import type { Metadata } from "next";
import Link from "next/link";

import { getSupabaseServer } from "@/lib/supabase/server";
import { AuthShell, ErrorBanner } from "../auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Crea una contraseña nueva para tu cuenta de Invensa.",
};

export default async function ResetPasswordPage() {
  // The /auth/callback route exchanges the recovery code into a session cookie.
  // If the user landed here without one, the link is expired.
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <AuthShell
        eyebrow="Nueva contraseña"
        heading="El enlace expiró"
        sub="Solicita uno nuevo desde la pantalla de recuperación."
        footer={
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Solicitar uno nuevo
          </Link>
        }
      >
        <ErrorBanner message="El enlace ya no es válido o tu sesión expiró." />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Nueva contraseña"
      heading="Define una contraseña nueva"
      sub="Elige una contraseña que puedas recordar. Mínimo 8 caracteres."
      footer={
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline font-medium"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
