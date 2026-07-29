#!/usr/bin/env node
/**
 * bootstrap-admin.mjs — creates the first admin user (the sister).
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs <email> <temp-password>
 *
 * Or via pnpm:
 *   pnpm bootstrap:admin <email> <temp-password>
 *
 * Behavior:
 *   - Reads SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL from .env.local
 *   - Calls supabase.auth.admin.createUser() with email_confirm: true
 *   - The 0001_init.sql trigger auto-assigns role='admin' because profiles is empty
 *   - Prints the resulting profile row so you can confirm role
 *
 * Idempotency: safe to re-run. If profiles already has rows, the trigger
 * assigns role='employee' to any new user (which is the intended behavior).
 *
 * Security: this script uses the service-role key (bypasses RLS). It must NEVER
 * be exposed to the browser bundle. Run only locally with .env.local present.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---- 1. Load env from .env.local ----------------------------------------
function loadEnv(path) {
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const envPath = resolve(process.cwd(), ".env.local");
const env = loadEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    `[bootstrap-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envPath}`,
  );
  process.exit(1);
}

// ---- 2. Parse CLI args ---------------------------------------------------
const [, , emailArg, passwordArg] = process.argv;
if (!emailArg || !passwordArg) {
  console.error(
    "Usage: node scripts/bootstrap-admin.mjs <email> <temp-password>",
  );
  console.error("Example: pnpm bootstrap:admin sister@tienda.local Cambiar123");
  process.exit(1);
}
if (passwordArg.length < 8) {
  console.error(
    "[bootstrap-admin] Password must be at least 8 characters (matches zod regex in lib/schemas/auth.ts).",
  );
  process.exit(1);
}

// ---- 3. Create user via service-role admin client ------------------------
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`[bootstrap-admin] Creating user ${emailArg} ...`);

const { data, error } = await admin.auth.admin.createUser({
  email: emailArg,
  password: passwordArg,
  email_confirm: true,
  user_metadata: { full_name: "" },
});

if (error) {
  console.error(`[bootstrap-admin] Failed to create user: ${error.message}`);
  process.exit(1);
}

console.log(`[bootstrap-admin] auth.users row created: id=${data.user.id}`);

// ---- 4. Verify the trigger created the profile with the right role ------
// Wait briefly for the trigger to run (it fires synchronously on INSERT, but
// reading right after is safe).
const { data: profile, error: profileErr } = await admin
  .from("profiles")
  .select("id, email, full_name, role")
  .eq("id", data.user.id)
  .single();

if (profileErr) {
  console.error(
    `[bootstrap-admin] User created but profile lookup failed: ${profileErr.message}`,
  );
  console.error(
    "[bootstrap-admin] The on_auth_user_created trigger should have created the profile. Check 0001_init.sql.",
  );
  process.exit(1);
}

console.log(`[bootstrap-admin] Profile row:`);
console.log(`  id        = ${profile.id}`);
console.log(`  email     = ${profile.email}`);
console.log(`  full_name = ${profile.full_name ?? "(empty)"}`);
console.log(`  role      = ${profile.role}`);

if (profile.role !== "admin") {
  console.warn(
    `[bootstrap-admin] WARNING: role is "${profile.role}", not "admin".`,
  );
  console.warn(
    "[bootstrap-admin] This means profiles already had rows when this user was created (someone else got there first).",
  );
  console.warn(
    "[bootstrap-admin] If that's wrong, update the role manually in the dashboard and investigate.",
  );
  process.exit(2);
}

console.log(
  "\n[bootstrap-admin] Done. The sister can now log in at /login with the temp password.",
);
console.log(
  "[bootstrap-admin] Remind her to change the password from /account immediately.",
);
