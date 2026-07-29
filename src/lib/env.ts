/* Hallmark · locked system applied · src/lib/env.ts
 * Zod-validated environment loader. Throws lazily — never at module load — so the dev
 * server can boot before .env.local is fully populated. Throws on first call when a
 * missing required var is touched.
 *
 * Public vars (NEXT_PUBLIC_*) are available in both server and client contexts.
 * Server-only vars must never leak to the client bundle.
 */

import "server-only";

import { z } from "zod";

const url = z.string().url();

// Treat empty strings as "not set" so .env.local placeholders don't crash zod.
const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().optional(),
);
const optionalUrl = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().url().optional(),
);

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "anon key looks too short"),
  NEXT_PUBLIC_SITE_URL: url,
  NEXT_PUBLIC_LOCALE: z.string().default("es-MX"),
  NEXT_PUBLIC_R2_PUBLIC_URL: optionalUrl,
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, "service role key looks too short"),

  // Cloudflare R2 (server-only)
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: z.string().default("invensa-products"),
  R2_REGION: z.string().default("auto"),

  // Resend (transactional email)
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,

  // Mercado Pago (pagos — fase futura)
  MERCADOPAGO_ACCESS_TOKEN: optionalString,
  MERCADOPAGO_PUBLIC_KEY: optionalString,
  MERCADOPAGO_WEBHOOK_SECRET: optionalString,

  // Supabase webhook signature (if used)
  SUPABASE_WEBHOOK_SECRET: optionalString,

  // MiniMax (foto → producto)
  MINIMAX_API_KEY: optionalString,
  MINIMAX_MODEL: z.string().default("MiniMax-VL-01"),

  APP_BASE_URL: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

function formatZodError(label: string, err: z.ZodError): string {
  const lines = err.issues.map(
    (i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  return `[env] ${label} environment is invalid:\n${lines.join("\n")}`;
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_REGION: process.env.R2_REGION,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    SUPABASE_WEBHOOK_SECRET: process.env.SUPABASE_WEBHOOK_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
    MINIMAX_MODEL: process.env.MINIMAX_MODEL,
  });
  if (!parsed.success) throw new Error(formatZodError("Server", parsed.error));
  return parsed.data;
}

/** Read the client-safe slice of env. Safe to call from Server Components. */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  });
  if (!parsed.success) throw new Error(formatZodError("Client", parsed.error));
  return parsed.data;
}
