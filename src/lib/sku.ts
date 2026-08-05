// Non-AI SKU suggestion. Format "<PREFIX>-<NNN>" (e.g. "PZA-014"), where
// PREFIX comes from the product's unit of measure when known. Pure numeric
// digit widths grow only if a prefix's number space actually fills up, so
// generated SKUs never collide with real scanned barcodes (those are plain
// numeric strings with no dash).

const DEFAULT_PREFIX = "SKU";
const START_WIDTH = 3;
const MAX_WIDTH = 6;

export function suggestSku(
  existingCodes: readonly string[],
  unitCode?: string | null,
): string {
  const prefix =
    unitCode
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") || DEFAULT_PREFIX;
  const taken = new Set(existingCodes.map((c) => c.trim().toUpperCase()));

  for (let width = START_WIDTH; width <= MAX_WIDTH; width++) {
    const candidate = randomUnused(prefix, width, taken);
    if (candidate) return candidate;
  }
  // Unreachable at real-world scale (10^6 slots per prefix) — keep it total.
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function randomUnused(
  prefix: string,
  width: number,
  taken: ReadonlySet<string>,
): string | null {
  const max = 10 ** width;
  const attempts = Math.min(50, max);
  for (let i = 0; i < attempts; i++) {
    const n = Math.floor(Math.random() * max);
    const candidate = `${prefix}-${String(n).padStart(width, "0")}`;
    if (!taken.has(candidate)) return candidate;
  }
  return null;
}
