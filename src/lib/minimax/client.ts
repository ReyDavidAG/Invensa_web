import "server-only";

import { getServerEnv } from "@/lib/env";

const MINIMAX_CHAT_COMPLETIONS_URL =
  "https://api.minimax.io/v1/chat/completions";

export type MiniMaxMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

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
  /** MiniMax-specific: separates reasoning from final answer. */
  reasoningSplit?: boolean;
};

export class MiniMaxError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MiniMaxError";
    this.status = status;
  }
}

/**
 * Redact any token-shaped strings (sk-…, Bearer …, x-api-key: …) so a
 * defensive log line never echoes a credential. Matches on substring
 * shape — conservative.
 */
function redactSecrets(input: unknown): string {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  return text
    .replace(/(sk-[A-Za-z0-9_\-]{16,})/g, "[REDACTED:api_key]")
    .replace(/(Bearer\s+)[A-Za-z0-9_\-./=]+/gi, "$1[REDACTED:bearer]")
    .replace(
      /(x-api-key["']?\s*:\s*["']?)[A-Za-z0-9_\-]+/gi,
      "$1[REDACTED:api_key]",
    );
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
    ...(opts.temperature !== undefined
      ? { temperature: opts.temperature }
      : {}),
    ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
    ...(opts.reasoningSplit !== undefined
      ? { reasoning_split: opts.reasoningSplit }
      : {}),
  };

  const res = await fetch(MINIMAX_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(
      "[minimax] non-2xx",
      res.status,
      redactSecrets(detail.slice(0, 500)),
    );
    throw new MiniMaxError(
      `MiniMax respondió ${res.status}. Intenta de nuevo.`,
      res.status,
    );
  }

  let json: {
    base_resp?: { status_code?: number; status_msg?: string };
    choices?: Array<{
      message?: { content?: string | Array<{ text?: string }> };
    }>;
    [k: string]: unknown;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new MiniMaxError(
      "MiniMax devolvió una respuesta no-JSON.",
      res.status,
    );
  }

  // MiniMax wraps its own errors in base_resp even on 200 OK.
  const apiError = json.base_resp;
  if (apiError && apiError.status_code && apiError.status_code !== 0) {
    console.error(
      "[minimax] api error",
      apiError.status_code,
      redactSecrets(apiError.status_msg ?? ""),
    );
    throw new MiniMaxError(
      apiError.status_msg ?? `MiniMax error ${apiError.status_code}`,
      apiError.status_code,
    );
  }

  // Extract content with multiple fallbacks — MiniMax's `reasoning_split`
  // mode occasionally leaves `content` empty when the model exhausts its
  // reasoning budget on the thinking trace instead of the final answer.
  // In that case the JSON often ends up in the `reasoning` field.
  function extractContent(
    message: { content?: unknown; reasoning?: unknown } | undefined,
  ): string {
    if (!message) return "";
    const c = message.content;
    if (typeof c === "string" && c.length > 0) return c;
    if (Array.isArray(c) && c.length > 0) {
      const joined = c
        .map((part) =>
          typeof part === "object" && part !== null && "text" in part
            ? (part as { text?: unknown }).text
            : "",
        )
        .filter((s): s is string => Boolean(s))
        .join("");
      if (joined) return joined;
    }
    // Fallback: reasoning field. Common when reasoning_split is on and the
    // model puts the JSON payload there.
    const r = message.reasoning;
    if (typeof r === "string" && r.length > 0) return r;
    if (Array.isArray(r) && r.length > 0) {
      const joined = r
        .map((part) =>
          typeof part === "object" && part !== null && "text" in part
            ? (part as { text?: unknown }).text
            : "",
        )
        .filter((s): s is string => Boolean(s))
        .join("");
      if (joined) return joined;
    }
    return "";
  }

  const content = extractContent(json.choices?.[0]?.message);
  if (content.length > 0) return content;

  // DEBUG: dump the actual message shape so we can see what MiniMax returned.
  // This is a regression-helper — when this branch fires, the caller logs
  // the message body so we can extend extractContent() to cover it.
  const message = json.choices?.[0]?.message as
    Record<string, unknown> | undefined;
  const messageKeys = message ? Object.keys(message) : [];
  const sample: Record<string, unknown> = {};
  if (message) {
    for (const key of messageKeys) {
      const value = message[key];
      if (typeof value === "string") {
        sample[key] = value.slice(0, 200);
      } else {
        sample[key] = value;
      }
    }
  }
  console.error(
    "[minimax] empty content after all fallbacks. messageKeys:",
    messageKeys,
    "sampledMessage:",
    redactSecrets(JSON.stringify(sample).slice(0, 1500)),
    "fullRedactedBody:",
    redactSecrets(JSON.stringify(json).slice(0, 1500)),
  );
  throw new MiniMaxError(
    "MiniMax no devolvió contenido útil. Intenta con una descripción más corta.",
    res.status,
  );
}
