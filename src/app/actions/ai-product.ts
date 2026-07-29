"use server";

import { requireAdmin } from "@/app/actions/_guards";
import { aiProductParsedSchema } from "@/lib/schemas/ai-product";
import {
  miniMaxChat,
  MiniMaxError,
  type MiniMaxMessage,
} from "@/lib/minimax/client";

export type ParseProductPhotoResult =
  | { ok: true; parsed: import("@/lib/schemas/ai-product").AiProductParsed }
  | { ok: false; error: string };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB (MiniMax accepts up to 10 MB)
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const SYSTEM_PROMPT = `Eres un asistente que extrae datos de productos de una tienda mexicana (limpieza y refacciones de moto) a partir de una foto del empaque o producto.

REGLAS DE SALIDA — no las ignores:
1. Tu respuesta completa debe ser ÚNICAMENTE un objeto JSON válido. Nada más.
2. NO escribas texto antes del JSON. NO escribas texto después del JSON.
3. NO uses bloques de markdown (nada de \`\`\`json).
4. NO incluyas razonamiento, thinking, análisis ni commentary de ningún tipo.
5. NO expliques lo que estás haciendo. Solo el JSON final.
6. Si un dato no es visible o no estás seguro, usa null. NUNCA inventes valores.
7. Los números van sin comas, sin símbolos de moneda, sin espacios.

Esquema exacto (respeta los tipos y los nombres de campo):
{
  "name": string|null,
  "code": string|null,
  "unitCode": string|null,
  "priceSale": number|null,
  "priceBuy": number|null,
  "categoryName": string|null,
  "confidence": number
}

Guía de cada campo:
- name: nombre comercial legible del empaque (ej. "Fabuloso Fresca Activa 2L").
- code: SKU o código de barras visible. null si no se ve.
- unitCode: unidad de venta inferida (PZA, L, KG, ML, GAL). null si no sabes.
- priceSale: precio de venta al público en MXN, solo el número. null si no es visible.
- priceBuy: precio de costo si aparece visible. null si no.
- categoryName: una palabra o frase corta ("Limpieza", "Refacciones", "Moto", etc.).
- confidence: número entre 0 y 1 con tu confianza global.
  · 0.9-1.0: producto claro, todos los campos visibles.
  · 0.5-0.8: legible pero faltan 1-2 campos.
  · 0.2-0.4: producto borroso o solo parcial.
  · <0.2: no se distingue nada, devuelve todo null con confidence 0.1.

Ejemplo de respuesta CORRECTA (esto es todo lo que debes devolver):
{"name":"Fabuloso Fresca Activa 2L","code":null,"unitCode":"L","priceSale":null,"priceBuy":null,"categoryName":"Limpieza","confidence":0.7}

Ejemplo de respuesta INCORRECTA (no hagas esto):
- "Aquí está el JSON:" seguido del JSON.
- \`\`\`json ... \`\`\`
- Análisis previo en lenguaje natural.
- Cualquier texto fuera del objeto.`;

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
      maxTokens: 800,
      // MiniMax-specific: separates reasoning from final answer so the JSON
      // comes back clean in `content` instead of being prefixed with
      // `<think>…</think>` blocks.
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

  // Strip any leaked reasoning, markdown fences, or preamble. The AI is
  // instructed to return JSON only, but some models leak <think>…</think>
  // blocks or prefix with conversational text. Aggressive cleaning.
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
    console.error("[ai-product] JSON parse failed", cleaned.slice(0, 500));
    return {
      ok: false,
      error: "La IA no devolvió un JSON válido. Intenta con otra foto.",
    };
  }

  const validated = aiProductParsedSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error("[ai-product] schema mismatch", validated.error.issues);
    return {
      ok: false,
      error: "La IA devolvió datos con formato inesperado.",
    };
  }

  return { ok: true, parsed: validated.data };
}
