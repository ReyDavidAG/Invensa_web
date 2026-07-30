"use server";

import crypto from "node:crypto";

import { requireUser } from "@/app/actions/_guards";
import { aiProductTextSuggestionSchema } from "@/lib/schemas/ai-product-text";
import {
  miniMaxChat,
  MiniMaxError,
  type MiniMaxMessage,
} from "@/lib/minimax/client";

export type SuggestProductFromTextResult =
  | {
      ok: true;
      suggestion: import("@/lib/schemas/ai-product-text").AiProductTextSuggestion;
    }
  | { ok: false; error: string };

export type ExistingCategory = { id: string; name: string };
export type ExistingUnit = { id: string; code: string; name: string };

export type SuggestProductFromTextInput = {
  description: string;
  categories: ExistingCategory[];
  units: ExistingUnit[];
};

const MAX_DESCRIPTION_CHARS = 500;

// In-memory cache: keyed by description + sorted category/unit names so
// the cache invalidates when the available categories or units change.
type CacheEntry = {
  suggestion: import("@/lib/schemas/ai-product-text").AiProductTextSuggestion;
  expiresAt: number;
};
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Naive per-user rate limit. Process-local; resets on restart.
const RATE_LIMIT_PER_MIN = 30;
const RATE_WINDOW_MS = 60 * 1000;
const recentCalls = new Map<string, number[]>();

function checkRate(userId: string): boolean {
  const now = Date.now();
  const calls = (recentCalls.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (calls.length >= RATE_LIMIT_PER_MIN) return false;
  calls.push(now);
  recentCalls.set(userId, calls);
  return true;
}

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function buildSystemPrompt(
  categories: ExistingCategory[],
  units: ExistingUnit[],
): string {
  const categoryLines = categories.length
    ? categories.map((c) => `- ${c.name}`).join("\n")
    : "- (vacía)";
  const unitLines = units.length
    ? units.map((u) => `- ${u.code} (${u.name})`).join("\n")
    : "- (vacía)";

  // Short, direct, impossible-to-misinterpret. Hallmark constraint: the
  // model can only emit the schema — anything else is filtered/rejected
  // by the client. The model is not trusted to follow rules perfectly;
  // the client is.
  return `Eres un extractor de datos para una tienda mexicana. Dada una descripción libre en español de un producto, devuelves SOLO un objeto JSON con los campos abajo. Sin texto antes, sin texto después, sin markdown, sin razonamiento visible.

ESQUEMA (usa null si el dato NO aparece explícitamente en la descripción):
{
  "name": string|null,
  "categoryName": string|null,
  "unitCode": string|null,
  "priceBuy": number|null,
  "priceSale": number|null,
  "initialStock": number|null,
  "confidence": number
}

CATEGORÍAS EXISTENTES (usa el nombre EXACTO si coincide, si no null):
${categoryLines}

UNIDADES DISPONIBLES (usa el código EXACTO si coincide, si no null):
${unitLines}

REGLAS DURAS:
- NO inventes. Si la persona no lo dijo, null.
- Números sin comas, sin $, sin espacios. "lo compro en 10" → priceBuy: 10.
- "vendo en 16" / "lo vendo a 16" → priceSale: 16.
- "tengo 10 piezas" / "hay 10 unidades" → initialStock: 10.
- "10 kilos" → initialStock: 10, unitCode: "KG".
- "10 botellas de 1L" → initialStock: 10 (10 botellas, no 10 litros), unitCode: "PZA".
- Strings sin comillas tipográficas.

CONFIANZA (0 a 1):
- 0.85-1.0: descripción clara, todos los campos inferibles.
- 0.5-0.8: probable pero algún dato falta.
- 0.2-0.4: mucha ambigüedad.
- <0.2: no entendiste, devuelve la mayoría null.

EJEMPLO:
Descripción: "Suavitel aroma bebé 1L, tengo 10 piezas, compro 10 vendo 16"
Respuesta (esto es TODO lo que debes devolver, nada más):
{"name":"Suavitel Aroma Bebé 1L","categoryName":"Limpieza","unitCode":"PZA","priceBuy":10,"priceSale":16,"initialStock":10,"confidence":0.9}`;
}

export async function suggestProductFromTextAction(
  input: SuggestProductFromTextInput,
): Promise<SuggestProductFromTextResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  if (!checkRate(auth.userId)) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
    };
  }

  const description = input.description.trim();
  const categories = input.categories ?? [];
  const units = input.units ?? [];

  if (description.length < 3) {
    return {
      ok: false,
      error: "Describe el producto con al menos unas palabras.",
    };
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return {
      ok: false,
      error: `La descripción no puede pasar de ${MAX_DESCRIPTION_CHARS} caracteres.`,
    };
  }

  // Cache key includes the sorted names so it invalidates when the
  // available categories or units change (e.g. sister creates a new one).
  const catKey = categories
    .map((c) => c.name)
    .sort()
    .join("|");
  const unitKey = units
    .map((u) => u.code)
    .sort()
    .join("|");
  const cacheKey = crypto
    .createHash("sha256")
    .update(`${description.toLowerCase()}::${catKey}::${unitKey}`)
    .digest("hex");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, suggestion: cached.suggestion };
  }

  const messages: MiniMaxMessage[] = [
    { role: "system", content: buildSystemPrompt(categories, units) },
    {
      role: "user",
      content: `Descripción del producto: ${description}`,
    },
  ];

  let text: string;
  try {
    text = await miniMaxChat({
      messages,
      responseFormat: { type: "json_object" },
      temperature: 0.2,
      maxTokens: 500,
      reasoningSplit: true,
    });
  } catch (err) {
    if (err instanceof MiniMaxError) {
      return { ok: false, error: err.message };
    }
    return {
      ok: false,
      error: "No pudimos comunicarnos con la IA. Intenta de nuevo.",
    };
  }

  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^[^{[\s]*/, "")
    .replace(/[^}\]]*$/, "")
    .trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    console.error("[ai-product-text] JSON parse failed", cleaned.slice(0, 500));
    return {
      ok: false,
      error: "La IA no devolvió un JSON válido. Reformula la descripción.",
    };
  }

  const validated = aiProductTextSuggestionSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error("[ai-product-text] schema mismatch", validated.error.issues);
    return {
      ok: false,
      error: "La IA devolvió datos con formato inesperado.",
    };
  }

  cache.set(cacheKey, {
    suggestion: validated.data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return { ok: true, suggestion: validated.data };
}

// (no extra exports — `"use server"` files may only export async functions
//  and types. Runtime values like Intl formatters are not allowed.)
