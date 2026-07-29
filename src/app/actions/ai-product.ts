"use server";

/* Hallmark · locked system applied · src/app/actions/ai-product.ts
 * Server Action that calls MiniMax vision to extract product fields from
 * an uploaded photo. Returns a structured object the form pre-fills.
 *
 * Pipeline:
 *   1. requireAdmin (parity with createProductAction)
 *   2. validate image (≤5MB, jpeg/png/webp)
 *   3. convert to base64 data URL
 *   4. send to MiniMax-VL-01 with json_object response_format
 *   5. validate AI response with aiProductParsedSchema
 *   6. return { ok, parsed } or { ok: false, error }
 */

import { requireAdmin } from "@/app/actions/_guards";
import { aiProductParsedSchema } from "@/lib/schemas/ai-product";
import { miniMaxChat, MiniMaxError, type MiniMaxMessage } from "@/lib/minimax/client";

export type ParseProductPhotoResult =
  | { ok: true; parsed: import("@/lib/schemas/ai-product").AiProductParsed }
  | { ok: false; error: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const SYSTEM_PROMPT = `Eres un asistente que extrae datos de productos de una tienda mexicana (productos de limpieza y refacciones de moto) a partir de la foto del empaque o producto.

Devuelve SOLO un objeto JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "name": string|null,
  "code": string|null,
  "unitCode": string|null,
  "priceSale": number|null,
  "priceBuy": number|null,
  "categoryName": string|null,
  "confidence": number
}

Reglas:
- name: nombre comercial del producto que se lee en el empaque.
- code: SKU o código de barras visible. Si no hay, null.
- unitCode: unidad de venta (PZA, L, KG, ML, GAL). Si no estás seguro, null.
- priceSale: precio de venta al público en MXN, sin signo de moneda, solo el número.
- priceBuy: precio de costo si aparece visible. Si no, null.
- categoryName: una sola palabra o frase corta, e.g. "Limpieza", "Refacciones", "Moto".
- confidence: número entre 0 y 1; tu confianza global en la extracción. Si casi no se ve nada, 0.1.
- Si no puedes leer un dato con claridad, déjalo null. No inventes valores.
- Números sin comas ni símbolo de moneda.`;

export async function parseProductPhotoAction(
  _state: unknown,
  formData: FormData,
): Promise<ParseProductPhotoResult> {
  const auth = await requireAdmin({ actionLabel: "usar el importador con IA" });
  if ("ok" in auth) return auth;

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sube una imagen del producto." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "La imagen pesa más de 5 MB." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: "Tipo de imagen no soportado. Usa JPG, PNG o WebP.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const messages: MiniMaxMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extrae los datos del producto de esta imagen.",
        },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ];

  let text: string;
  try {
    text = await miniMaxChat({
      messages,
      responseFormat: { type: "json_object" },
      temperature: 0.2,
      maxTokens: 600,
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

  // The model sometimes wraps the JSON in ```json fences; strip them.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    console.error("[ai-product] JSON parse failed", cleaned.slice(0, 500));
    return {
      ok: false,
      error: "La IA no devolvió un JSON válido. Intenta con otra foto.",
    };
  }

  const validated = aiProductParsedSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error(
      "[ai-product] schema mismatch",
      validated.error.issues,
    );
    return {
      ok: false,
      error: "La IA devolvió datos con formato inesperado.",
    };
  }

  return { ok: true, parsed: validated.data };
}