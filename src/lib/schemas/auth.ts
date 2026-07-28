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
      .max(80, { message: es.maxChars(80) }),
    password: z
      .string()
      .min(8, { message: es.minChars(8) })
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
      .min(8, { message: es.minChars(8) })
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
