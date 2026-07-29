/* Hallmark · locked system applied · src/lib/minimax/client.ts
 * Server-only MiniMax API client. Thin wrapper over chat completions; the
 * vision layer uses the same endpoint with image_url message parts.
 *
 * Endpoint: POST https://api.minimax.chat/v1/text/chatcompletion_v2
 * Auth: Bearer MINIMAX_API_KEY
 * Structured output: response_format = { type: "json_object" }
 *
 * Returns the assistant text. Callers validate with zod.
 */

import "server-only";

import { getServerEnv } from "@/lib/env";

const MINIMAX_CHAT_COMPLETIONS_URL =
  "https://api.minimax.chat/v1/text/chatcompletion_v2";

export type MiniMaxMessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export type MiniMaxMessage = {
  role: "system" | "user" | "assistant";
  content: MiniMaxMessageContent;
};

export type MiniMaxChatOptions = {
  messages: MiniMaxMessage[];
  model?: string;
  responseFormat?: { type: "json_object" };
  temperature?: number;
  maxTokens?: number;
};

export class MiniMaxError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MiniMaxError";
    this.status = status;
  }
}

export async function miniMaxChat(opts: MiniMaxChatOptions): Promise<string> {
  const env = getServerEnv();
  if (!env.MINIMAX_API_KEY) {
    throw new MiniMaxError(
      "Falta configurar la API de IA (MINIMAX_API_KEY).",
      0,
    );
  }

  const body = {
    model: opts.model ?? env.MINIMAX_MODEL,
    messages: opts.messages,
    ...(opts.responseFormat ? { response_format: opts.responseFormat } : {}),
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
  };

  const res = await fetch(MINIMAX_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // MiniMax responses are slow on first-token; cache-friendly default.
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[minimax] non-2xx", res.status, detail.slice(0, 500));
    throw new MiniMaxError(
      `MiniMax respondió ${res.status}. Revisa la consola del servidor.`,
      res.status,
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && "text" in part ? part.text : ""))
      .filter(Boolean)
      .join("");
  }
  throw new MiniMaxError("MiniMax no devolvió contenido.", res.status);
}