import { z } from "zod";
import { es } from "@/lib/messages/es";

// Login form — email + password. Identical contract for email-only first factor.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: es.required })
    .email({ message: es.email }),
  password: z.string().min(1, { message: es.required }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Invite-acceptance form (sister invites mom via admin.inviteUserByEmail).
// Sets full_name + password on the existing auth.users row.
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: es.fullNameShort })
      .max(80, "Máximo 80 caracteres"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, { message: es.passwordWeak })
      .regex(/[a-z]/, { message: es.passwordWeak })
      .regex(/[0-9]/, { message: es.passwordWeak }),
    confirmPassword: z.string().min(1, { message: es.required }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: es.passwordMismatch,
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Forgot-password form: just an email. server sends a recovery link.
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: es.required })
    .email({ message: es.email }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset-password form: token has already been exchanged; user lands with a session
// and picks a new password. The token lives in the URL and is read in the Server Action.
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, { message: es.passwordWeak })
      .regex(/[a-z]/, { message: es.passwordWeak })
      .regex(/[0-9]/, { message: es.passwordWeak }),
    confirmPassword: z.string().min(1, { message: es.required }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: es.passwordMismatch,
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// /account: edit own profile (full_name only — email + role are system-managed).
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: es.required })
    .max(120, "Máximo 120 caracteres"),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileUpdateFormValues = z.input<typeof profileUpdateSchema>;
