// Spanish error messages and Supabase error mapping.
// Single source of truth for user-facing copy. Imported by zod schemas and Server Actions.

export const es = {
  required: "Este campo es obligatorio",
  email: "Ingresa un correo válido",
  passwordWeak:
    "Debe tener 8+ caracteres, una mayúscula, una minúscula y un número",
  passwordMismatch: "Las contraseñas no coinciden",
  fullNameShort: "Ingresa tu nombre completo",
} as const;

// Supabase error code → Spanish string. Stable across SDK versions.
export const supabaseErrorMap: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu correo antes de entrar. Revisa tu bandeja.",
  over_email_send_rate_limit: "Demasiados intentos. Espera unos minutos.",
  user_already_exists: "Ya hay una cuenta con este correo.",
  weak_password: "La contraseña es muy débil.",
  signup_disabled: "El registro está deshabilitado. Pide una invitación.",
  otp_expired: "El enlace expiró. Solicita uno nuevo.",
  otp_disabled: "El enlace ya se usó o está deshabilitado.",
  email_address_invalid: "El formato del correo no es válido.",
  same_password: "La nueva contraseña debe ser distinta a la actual.",
  email_exists: "Este correo ya está registrado.",
  recovery_disabled: "La recuperación está deshabilitada.",
  user_not_found: "No encontramos una cuenta con este correo.",
  invalid_grant: "El enlace no es válido o ya expiró.",
  validation_failed: "Los datos no cumplen el formato esperado.",
};

export function mapSupabaseError(code?: string, fallback?: string): string {
  if (!code && !fallback) return "Algo salió mal. Intenta de nuevo.";
  if (code && supabaseErrorMap[code]) return supabaseErrorMap[code];
  return fallback ?? "Algo salió mal. Intenta de nuevo.";
}
