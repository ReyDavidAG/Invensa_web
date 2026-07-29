import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/lib/env";

let cached: Resend | null = null;

function client(): Resend {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    throw new Error("[email] RESEND_API_KEY not set");
  }
  cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ id: string }> {
  const env = getServerEnv();
  const from = env.RESEND_FROM_EMAIL || "Invensa <noreply@invensa.app>";
  const { data, error } = await client().emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error || !data) {
    throw new Error(`Resend send failed: ${error?.message ?? "no data"}`);
  }
  return { id: data.id };
}
