// Inline HTML email template for low-stock alerts.
// Target clients: Gmail + Outlook. CSS is inlined (no external styles).
// No React Email — keeps the bundle clean and matches plain HTML.

type LowStockRow = {
  code: string;
  name: string;
  stock: number;
  threshold: number;
};

const esMXCurrency = new Intl.NumberFormat("es-MX");

export function lowStockAlertHtml(
  rows: LowStockRow[],
  generatedAt: Date,
): string {
  const dateStr = generatedAt.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "long",
    timeStyle: "short",
  });

  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#555">${escape(r.code)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#111">${escape(r.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#b91c1c;font-weight:600">${esMXCurrency.format(r.stock)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#888">${esMXCurrency.format(r.threshold)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Productos por agotarse</title></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px;font-weight:600;margin:0 0 4px 0">Productos por agotarse</h1>
    <p style="font-size:13px;color:#666;margin:0 0 16px 0">${escape(dateStr)}</p>
    <p style="font-size:14px;color:#333;margin:0 0 16px 0">
      ${rows.length} producto${rows.length === 1 ? "" : "s"} por debajo del umbral.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:6px;overflow:hidden">
      <thead>
        <tr style="background:#f5f5f4">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666">SKU</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666">Producto</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666">Stock</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666">Umbral</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="font-size:12px;color:#888;margin:24px 0 0 0">
      Generado automáticamente por Invensa.
    </p>
  </div>
</body>
</html>`;
}

export function lowStockAlertText(rows: LowStockRow[]): string {
  return [
    "Productos por agotarse",
    "",
    ...rows.map(
      (r) =>
        `- ${r.code} · ${r.name}: stock ${r.stock} / umbral ${r.threshold}`,
    ),
    "",
    "Generado automáticamente por Invensa.",
  ].join("\n");
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
