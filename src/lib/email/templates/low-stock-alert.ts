// Hallmark · low-stock alert email
// Macrostructure: single-column email (table layout for Outlook compat).
// Theme: cobalt primary, warm cream paper, amber warning, red destructive.
// No fabricated data. Real product thumbs from R2.

import { emailTokens as t, EMAIL_MAX_WIDTH } from "../tokens";

type LowStockRow = {
  code: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  threshold: number;
};

export function lowStockAlertHtml(
  rows: LowStockRow[],
  generatedAt: Date,
  appUrl: string,
): string {
  const dateStr = generatedAt.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "long",
    timeStyle: "short",
  });

  const count = rows.length;

  const cards = rows
    .map((r, i) => {
      const outOfStock = r.stock === 0;
      const ratio = `${r.stock} / ${r.threshold}`;
      const ratioBg = outOfStock ? t.destructiveBg : t.warningBg;
      const ratioFg = outOfStock ? t.destructive : t.warning;
      const ratioLabel = outOfStock ? "Sin stock" : "Por agotarse";
      const isLast = i === rows.length - 1;
      const borderStyle = isLast
        ? "border:none"
        : `border-bottom:1px solid ${t.border}`;
      const imgSrc = r.imageUrl ?? "";
      const imgStyle = `display:block;width:56px;height:56px;border-radius:8px;object-fit:cover;background:${t.muted};border:1px solid ${t.border}`;
      return `
        <tr>
          <td style="padding:14px 16px;${borderStyle}" valign="top">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
              <tr>
                <td style="width:72px;padding-right:14px" valign="top">
                  <img src="${escape(imgSrc)}" alt="${escape(r.name)}" width="56" height="56" style="${imgStyle}">
                </td>
                <td valign="middle">
                  <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.04em;color:${t.faintText};text-transform:uppercase">${escape(r.code)}</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;line-height:1.3;color:${t.text}">${escape(r.name)}</p>
                </td>
                <td valign="middle" align="right" style="white-space:nowrap">
                  <span style="display:inline-block;background:${ratioBg};color:${ratioFg};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;font-weight:600;padding:5px 10px;border-radius:6px;line-height:1">${escape(ratio)}</span>
                  <p style="margin:4px 0 0;font-size:11px;color:${t.mutedText};text-align:right">${escape(ratioLabel)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Productos por agotarse · Invensa</title>
</head>
<body style="margin:0;padding:0;background:${t.paper};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${t.text};-webkit-font-smoothing:antialiased">
  <!-- Preheader text shown in inbox preview -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
    ${count} producto${count === 1 ? "" : "s"} ${count === 1 ? "necesita" : "necesitan"} reposición · ${escape(dateStr)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${t.paper};border-collapse:collapse">
    <tr>
      <td align="center" style="padding:32px 16px">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${EMAIL_MAX_WIDTH}" style="max-width:${EMAIL_MAX_WIDTH}px;width:100%;border-collapse:collapse">

          <!-- Brand header -->
          <tr>
            <td style="padding:0 0 24px 0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
                <tr>
                  <td style="vertical-align:middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
                      <tr>
                        <td style="width:36px;height:36px;background:${t.cobalt};border-radius:8px;text-align:center;vertical-align:middle;font-weight:700;color:#ffffff;font-size:18px;font-family:Inter,system-ui,sans-serif">I</td>
                        <td style="padding-left:10px;vertical-align:middle;font-size:15px;font-weight:600;color:${t.text};letter-spacing:-0.01em">Invensa</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText}">Reporte automático</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:0 0 24px 0">
              <h1 style="margin:0;font-size:28px;font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:${t.text}">
                ${count} producto${count === 1 ? "" : "s"} ${count === 1 ? "por agotarse" : "por agotarse"}
              </h1>
              <p style="margin:6px 0 0;font-size:14px;color:${t.mutedText}">${escape(dateStr)}</p>
            </td>
          </tr>

          <!-- Product list card -->
          <tr>
            <td style="background:${t.card};border:1px solid ${t.border};border-radius:12px;overflow:hidden;padding:0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
                <tr>
                  <td style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.muted}">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText}">SKU · Producto · Stock</p>
                  </td>
                </tr>
                ${cards}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 0 24px 0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto">
                <tr>
                  <td style="background:${t.cobalt};border-radius:8px;text-align:center">
                    <a href="${escape(appUrl)}/products" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.005em">Ver productos en Invensa →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 0 0 0;border-top:1px solid ${t.border}">
              <p style="margin:0;font-size:12px;color:${t.faintText};text-align:center;line-height:1.5">
                Generado automáticamente por Invensa. Este correo se manda todos los días a las 9:00 AM si hay productos críticos.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function lowStockAlertText(rows: LowStockRow[], appUrl: string): string {
  const lines = [
    "Productos por agotarse",
    "",
    ...rows.map(
      (r) =>
        `· ${r.code} · ${r.name}: stock ${r.stock} / umbral ${r.threshold}${r.stock === 0 ? " (sin stock)" : ""}`,
    ),
    "",
    `Ver productos: ${appUrl}/products`,
    "",
    "Generado automáticamente por Invensa.",
  ];
  return lines.join("\n");
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
