// Hallmark · daily summary email
// Macrostructure: single-column email. Cobalt primary, cream paper.
// Hero stat (today's total) + delta vs ayer + top 3 with thumbnails + cash closing.

import { emailTokens as t, EMAIL_MAX_WIDTH } from "../tokens";

type DailySummaryData = {
  date: string;
  salesCount: number;
  salesTotal: number;
  topProducts: Array<{
    name: string;
    imageUrl: string | null;
    quantity: number;
    total: number;
  }>;
  yesterdayDeltaPct: number | null;
  cashClosingStatus: "open" | "closed";
  cashClosingDiff: number | null;
  appUrl: string;
};

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function dailySummaryHtml(d: DailySummaryData): string {
  const dateStr = new Date(`${d.date}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deltaText =
    d.yesterdayDeltaPct === null
      ? "Sin datos de ayer"
      : `${d.yesterdayDeltaPct >= 0 ? "+" : ""}${d.yesterdayDeltaPct.toFixed(0)}% vs ayer`;
  const deltaColor =
    d.yesterdayDeltaPct === null || d.yesterdayDeltaPct === 0
      ? t.mutedText
      : d.yesterdayDeltaPct > 0
        ? t.success
        : t.destructive;

  const closingLabel =
    d.cashClosingStatus === "closed"
      ? d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? "Caja cerrada · cuadra"
        : `Caja cerrada · dif. ${esMXCurrency.format(d.cashClosingDiff)}`
      : "Caja pendiente de cierre";
  const closingBg =
    d.cashClosingStatus === "open"
      ? t.destructiveBg
      : d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? t.successBg
        : Math.abs(d.cashClosingDiff) <= 5
          ? t.warningBg
          : t.destructiveBg;
  const closingFg =
    d.cashClosingStatus === "open"
      ? t.destructive
      : d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? t.success
        : Math.abs(d.cashClosingDiff) <= 5
          ? t.warning
          : t.destructive;

  const topRows = d.topProducts
    .map((p, i) => {
      const imgStyle = `display:block;width:44px;height:44px;border-radius:6px;object-fit:cover;background:${t.muted};border:1px solid ${t.border}`;
      return `
        <tr>
          <td style="padding:12px 16px;${i < d.topProducts.length - 1 ? `border-bottom:1px solid ${t.border}` : ""}" valign="middle">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
              <tr>
                <td style="width:24px;color:${t.faintText};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;vertical-align:middle">${i + 1}</td>
                <td style="width:58px;padding:0 12px;vertical-align:middle">
                  <img src="${escape(p.imageUrl ?? "")}" alt="${escape(p.name)}" width="44" height="44" style="${imgStyle}">
                </td>
                <td style="vertical-align:middle">
                  <p style="margin:0;font-size:14px;font-weight:500;color:${t.text};line-height:1.3">${escape(p.name)}</p>
                  <p style="margin:2px 0 0;font-size:11px;color:${t.mutedText}">${p.quantity} ${p.quantity === 1 ? "unidad" : "unidades"}</p>
                </td>
                <td align="right" valign="middle" style="white-space:nowrap">
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;font-weight:600;color:${t.text}">${esMXCurrency.format(p.total)}</span>
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
  <title>Resumen del día · Invensa</title>
</head>
<body style="margin:0;padding:0;background:${t.paper};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${t.text};-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
    ${esMXCurrency.format(d.salesTotal)} · ${d.salesCount} ${d.salesCount === 1 ? "venta" : "ventas"} · ${escape(dateStr)}
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
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText}">Resumen del día</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero stat -->
          <tr>
            <td style="padding:0 0 24px 0">
              <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText}">${escape(dateStr)}</p>
              <p style="margin:8px 0 0;font-size:40px;font-weight:700;line-height:1;letter-spacing:-0.03em;color:${t.text};font-variant-numeric:tabular-nums">${esMXCurrency.format(d.salesTotal)}</p>
              <p style="margin:8px 0 0;font-size:14px;color:${t.mutedText}">
                ${d.salesCount} ${d.salesCount === 1 ? "venta" : "ventas"} ·
                <span style="color:${deltaColor};font-weight:600">${escape(deltaText)}</span>
              </p>
            </td>
          </tr>

          ${
            d.topProducts.length > 0
              ? `
          <!-- Top products card -->
          <tr>
            <td style="padding:0 0 16px 0">
              <div style="background:${t.card};border:1px solid ${t.border};border-radius:12px;overflow:hidden">
                <div style="padding:12px 16px;border-bottom:1px solid ${t.border};background:${t.muted}">
                  <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText}">Productos más vendidos</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
                  ${topRows}
                </table>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Cash closing status -->
          <tr>
            <td style="padding:0 0 24px 0">
              <div style="background:${closingBg};border-radius:10px;padding:14px 16px">
                <p style="margin:0;font-size:14px;font-weight:600;color:${closingFg}">${escape(closingLabel)}</p>
                ${
                  d.cashClosingStatus === "open"
                    ? `<p style="margin:4px 0 0;font-size:12px;color:${t.mutedText}">Cuadra la caja hoy en ${escape(d.appUrl)}/cash-closing.</p>`
                    : ""
                }
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 0 24px 0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto">
                <tr>
                  <td style="background:${t.cobalt};border-radius:8px;text-align:center">
                    <a href="${escape(d.appUrl)}/sales" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.005em">Ver ventas en Invensa →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 0 0 0;border-top:1px solid ${t.border}">
              <p style="margin:0;font-size:12px;color:${t.faintText};text-align:center;line-height:1.5">
                Generado automáticamente por Invensa. Este correo se manda todos los días a las 9:00 PM.
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

export function dailySummaryText(d: DailySummaryData): string {
  const lines = [
    `Resumen del día — ${d.date}`,
    "",
    `Ventas: ${d.salesCount} · ${esMXCurrency.format(d.salesTotal)}`,
  ];
  if (d.yesterdayDeltaPct !== null) {
    lines.push(
      `Variación vs ayer: ${d.yesterdayDeltaPct >= 0 ? "+" : ""}${d.yesterdayDeltaPct.toFixed(0)}%`,
    );
  }
  if (d.topProducts.length > 0) {
    lines.push("", "Productos más vendidos:");
    d.topProducts.forEach((p, i) => {
      lines.push(
        `  ${i + 1}. ${p.name} — ${p.quantity} uds · ${esMXCurrency.format(p.total)}`,
      );
    });
  }
  lines.push(
    "",
    d.cashClosingStatus === "closed"
      ? d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? "Caja cerrada · cuadra"
        : `Caja cerrada · dif. ${esMXCurrency.format(d.cashClosingDiff)}`
      : "Caja pendiente de cierre",
    "",
    `Ver ventas: ${d.appUrl}/sales`,
    "",
    "Generado automáticamente por Invensa.",
  );
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
