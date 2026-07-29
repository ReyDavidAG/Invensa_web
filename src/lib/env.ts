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

const envSchema = z.object({
  // Public (safe for the browser bundle)
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "anon key looks too short"),
  NEXT_PUBLIC_SITE_URL: url,
  NEXT_PUBLIC_LOCALE: z.string().default("es-MX"),
  NEXT_PUBLIC_R2_PUBLIC_URL: optionalUrl,

  // Server-only
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, "service role key looks too short"),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: z.string().default("invensa-products"),
  R2_REGION: z.string().default("auto"),
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  SUPABASE_WEBHOOK_SECRET: optionalString,
  APP_BASE_URL: optionalString,
  MINIMAX_API_KEY: optionalString,
  MINIMAX_MODEL: z.string().default("MiniMax-M3"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export type ClientEnv = Pick<
  ServerEnv,
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_SITE_URL"
  | "NEXT_PUBLIC_LOCALE"
  | "NEXT_PUBLIC_R2_PUBLIC_URL"
>;

function formatZodError(label: string, err: z.ZodError): string {
  const lines = err.issues.map(
    (i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  return `[env] ${label} environment is invalid:\n${lines.join("\n")}`;
}

function readEnv(): ServerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(formatZodError("Server", parsed.error));
  return parsed.data;
}

let cached: ServerEnv | null = null;
export function getServerEnv(): ServerEnv {
  // ponytail: in-process cache; env doesn't change between requests in a single Node process.
  cached ??= readEnv();
  return cached;
}

/** Read the client-safe slice of env. Safe to call from Server Components. */
export function getClientEnv(): ClientEnv {
  const env = getServerEnv();
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_LOCALE: env.NEXT_PUBLIC_LOCALE,
    NEXT_PUBLIC_R2_PUBLIC_URL: env.NEXT_PUBLIC_R2_PUBLIC_URL,
  };
}
