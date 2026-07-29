import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "../auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Activar cuenta",
  description: "Activa tu cuenta de Invensa.",
};

// Invitation acceptance. The /auth/callback route handles the code exchange
// before the user lands here — the session is already established.
export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Activar cuenta"
      heading="Crea tu contraseña"
      sub="Define una contraseña para entrar al sistema. La usará quien invited."
      footer={
        <span>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
