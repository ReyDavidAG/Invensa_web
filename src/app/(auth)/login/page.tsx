import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu panel de Invensa.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Iniciar sesión"
      heading="Bienvenido de vuelta"
      sub="Accede a tu panel para registrar ventas, consultar productos y ver reportes."
      footer={
        <span>
          ¿Olvidaste tu contraseña?{" "}
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Recuperar acceso
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
