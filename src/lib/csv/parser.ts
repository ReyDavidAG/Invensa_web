/* Hallmark · locked system applied · src/lib/csv/parser.ts
 * Minimal RFC-4180-ish CSV parser. Handles:
 *   - quoted fields with embedded commas ("foo, bar")
 *   - escaped double-quotes ("" inside quoted field)
 *   - CRLF and LF line endings
 *   - leading UTF-8 BOM (common when pasting from Excel)
 *
 * No external dep. Returns string[][] — caller does header mapping.
 */

export function parseCsv(input: string): string[][] {
  // Strip BOM if present.
  const text = input.replace(/^﻿/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote.
          field += '"';
          i += 2;
          continue;
        }
        // End of quoted field.
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      // Opening quote — only if field is empty (RFC-style strict) or first char.
      if (field === "") {
        inQuotes = true;
        i += 1;
        continue;
      }
      // Stray quote in unquoted field — keep literally.
      field += ch;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // CRLF: swallow the \n that follows.
      if (text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush trailing field/row (only if non-empty — avoids phantom empty row).
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}