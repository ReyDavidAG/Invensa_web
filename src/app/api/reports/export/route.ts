import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";

import { getSupabaseServer } from "@/lib/supabase/server";
import { formatDateTimeShort, todayMexicoISODate } from "@/lib/datetime";
import {
  getDetailedSales,
  getReportData,
  parsePeriod,
  PAYMENT_METHOD_LABEL,
  PERIOD_LABEL,
} from "@/app/(app)/reports/get-report-data";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const STATUS_LABEL: Record<string, string> = {
  paid: "Pagado",
  credit: "Fiado",
  cancelled: "Cancelado",
};

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const period = parsePeriod(req.nextUrl.searchParams.get("period"));
  const [data, detailedSales] = await Promise.all([
    getReportData(period),
    getDetailedSales(period),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Invensa";
  workbook.created = new Date();

  const headerFont = { bold: true };

  // ── Resumen ──────────────────────────────────────────────────────
  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Indicador", key: "k", width: 28 },
    { header: "Valor", key: "v", width: 22 },
  ];
  resumen.getRow(1).font = headerFont;
  resumen.addRows([
    { k: "Período", v: PERIOD_LABEL[period] },
    { k: "Generado", v: formatDateTimeShort(new Date()) },
    { k: "Ventas totales", v: esMXCurrency.format(data.periodTotal) },
    { k: "Ticket promedio", v: esMXCurrency.format(data.ticketAvg) },
    { k: "Número de ventas", v: data.periodCount },
    { k: "Clientes únicos", v: data.uniqueClients },
    { k: "Ganancias", v: esMXCurrency.format(data.profitTotal) },
    {
      k: "Margen de ganancia",
      v:
        data.profitMarginPct !== null
          ? `${data.profitMarginPct.toFixed(1)}%`
          : "—",
    },
    {
      k: "Ganancias — nota",
      v: "Calculado con el costo de compra ACTUAL de cada producto, no el costo histórico al momento de la venta.",
    },
  ]);

  // ── Ventas detalladas ────────────────────────────────────────────
  const ventas = workbook.addWorksheet("Ventas detalladas");
  ventas.columns = [
    { header: "Ticket", key: "ticket", width: 10 },
    { header: "Fecha", key: "date", width: 20 },
    { header: "Cliente", key: "client", width: 26 },
    { header: "Total", key: "total", width: 14 },
    { header: "Método de pago", key: "method", width: 18 },
    { header: "Estado", key: "status", width: 14 },
  ];
  ventas.getRow(1).font = headerFont;
  ventas.addRows(
    detailedSales.map((s) => ({
      ticket: s.ticketNumber,
      date: formatDateTimeShort(s.dateAt),
      client: s.clientName ?? "Anónimo",
      total: s.total,
      method: PAYMENT_METHOD_LABEL[s.paymentMethod] ?? s.paymentMethod,
      status: STATUS_LABEL[s.status] ?? s.status,
    })),
  );
  ventas.getColumn("total").numFmt = '"$"#,##0.00';

  // ── Productos más vendidos ───────────────────────────────────────
  const productos = workbook.addWorksheet("Productos más vendidos");
  productos.columns = [
    { header: "SKU", key: "code", width: 14 },
    { header: "Producto", key: "name", width: 32 },
    { header: "Unidades", key: "units", width: 12 },
    { header: "Ingresos", key: "revenue", width: 14 },
    { header: "Costo (actual)", key: "cost", width: 14 },
    { header: "Ganancia", key: "profit", width: 14 },
  ];
  productos.getRow(1).font = headerFont;
  productos.addRows(
    data.topProducts.map((p) => ({
      code: p.code,
      name: p.name,
      units: p.units,
      revenue: p.revenue,
      cost: p.cost,
      profit: p.profit,
    })),
  );
  productos.getColumn("revenue").numFmt = '"$"#,##0.00';
  productos.getColumn("cost").numFmt = '"$"#,##0.00';
  productos.getColumn("profit").numFmt = '"$"#,##0.00';

  // ── Top clientes ─────────────────────────────────────────────────
  const clientes = workbook.addWorksheet("Top clientes");
  clientes.columns = [
    { header: "Cliente", key: "name", width: 28 },
    { header: "Total", key: "total", width: 14 },
  ];
  clientes.getRow(1).font = headerFont;
  clientes.addRows(
    data.topClients.map((c) => ({ name: c.name, total: c.total })),
  );
  clientes.getColumn("total").numFmt = '"$"#,##0.00';

  // ── Métodos de pago ──────────────────────────────────────────────
  const metodos = workbook.addWorksheet("Métodos de pago");
  metodos.columns = [
    { header: "Método", key: "method", width: 18 },
    { header: "Total", key: "total", width: 14 },
  ];
  metodos.getRow(1).font = headerFont;
  metodos.addRows(
    data.methodEntries.map(([method, total]) => ({
      method: PAYMENT_METHOD_LABEL[method] ?? method,
      total,
    })),
  );
  metodos.getColumn("total").numFmt = '"$"#,##0.00';

  // ── Stock bajo ───────────────────────────────────────────────────
  const stock = workbook.addWorksheet("Stock bajo");
  stock.columns = [
    { header: "SKU", key: "code", width: 14 },
    { header: "Producto", key: "name", width: 32 },
    { header: "Stock", key: "stock", width: 10 },
    { header: "Umbral", key: "threshold", width: 10 },
  ];
  stock.getRow(1).font = headerFont;
  stock.addRows(
    data.lowStockList.map((p) => ({
      code: p.code,
      name: p.name,
      stock: p.stock,
      threshold: p.threshold,
    })),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `invensa-reporte-${period}-${todayMexicoISODate()}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
