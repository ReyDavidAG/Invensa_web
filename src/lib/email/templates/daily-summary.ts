// Inline HTML email template for the daily summary.
// Sent at 9pm Mexico time. Plain HTML for Gmail/Outlook compatibility.

type DailySummaryData = {
  date: string;
  salesCount: number;
  salesTotal: number;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  yesterdayDeltaPct: number | null;
  cashClosingStatus: "open" | "closed";
  cashClosingDiff: number | null;
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
      ? "—"
      : `${d.yesterdayDeltaPct >= 0 ? "+" : ""}${d.yesterdayDeltaPct.toFixed(0)}% vs ayer`;

  const deltaColor =
    d.yesterdayDeltaPct === null || d.yesterdayDeltaPct === 0
      ? "#666"
      : d.yesterdayDeltaPct > 0
        ? "#15803d"
        : "#b91c1c";

  const closingText =
    d.cashClosingStatus === "closed"
      ? d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? "Caja cerrada · cuadra"
        : `Caja cerrada · ${esMXCurrency.format(d.cashClosingDiff)}`
      : "Caja pendiente de cierre";

  const closingColor =
    d.cashClosingStatus === "open"
      ? "#b91c1c"
      : d.cashClosingDiff === null || d.cashClosingDiff === 0
        ? "#15803d"
        : Math.abs(d.cashClosingDiff) <= 5
          ? "#a16207"
          : "#b91c1c";

  const topRows = d.topProducts
    .map(
      (p, i) => `
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#666;width:24px">${i + 1}.</td>
        <td style="padding:6px 12px;font-size:14px;color:#111">${escape(p.name)}</td>
        <td style="padding:6px 12px;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#666">${p.quantity}</td>
        <td style="padding:6px 12px;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#111;font-weight:600">${esMXCurrency.format(p.total)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Resumen del día</title></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px;font-weight:600;margin:0 0 4px 0">Resumen del día</h1>
    <p style="font-size:13px;color:#666;margin:0 0 20px 0">${escape(dateStr)}</p>

    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:16px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666;margin:0 0 4px 0">Ventas hoy</p>
      <p style="font-size:32px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#111;margin:0">${esMXCurrency.format(d.salesTotal)}</p>
      <p style="font-size:13px;color:#666;margin:4px 0 0 0">${d.salesCount} ${d.salesCount === 1 ? "venta" : "ventas"} · <span style="color:${deltaColor};font-weight:600">${escape(deltaText)}</span></p>
    </div>

    ${
      d.topProducts.length > 0
        ? `
    <div style="background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666;margin:0;padding:12px 16px;border-bottom:1px solid #eee">Top productos</p>
      <table style="width:100%;border-collapse:collapse">${topRows}</table>
    </div>`
        : ""
    }

    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <p style="font-size:13px;margin:0;color:${closingColor};font-weight:600">${escape(closingText)}</p>
    </div>

    <p style="font-size:12px;color:#888;margin:24px 0 0 0">
      Generado automáticamente por Invensa.
    </p>
  </div>
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
    lines.push("", "Top productos:");
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
        : `Caja cerrada · ${esMXCurrency.format(d.cashClosingDiff)}`
      : "Caja pendiente de cierre",
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
    .replace(/"/g, "&quot;");
}
