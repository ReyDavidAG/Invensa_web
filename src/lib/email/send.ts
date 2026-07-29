import "server-only";

import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env";

let cached: nodemailer.Transporter | null = null;

function transporter(): nodemailer.Transporter {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error("[email] GMAIL_USER and GMAIL_APP_PASSWORD must be set");
  }
  cached = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });
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
  const from = env.EMAIL_FROM || env.GMAIL_USER;
  if (!from) {
    throw new Error("[email] EMAIL_FROM or GMAIL_USER required");
  }
  const info = await transporter().sendMail({
    from,
    to: input.to.join(", "),
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { id: info.messageId };
}
