import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "../auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta de Invensa.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      heading="¿Olvidaste tu contraseña?"
      sub="Te enviaremos un correo con un enlace para crear una nueva."
      footer={
        <span>
          ¿Ya la recordaste?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
