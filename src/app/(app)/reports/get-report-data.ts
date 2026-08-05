import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import { mexicoDayStartUTC, mexicoISODate } from "@/lib/datetime";
import type { SalesTrendDatum } from "./sales-trend-chart";

export type Period = "today" | "week" | "month";

export const PERIOD_DAYS: Record<Period, number> = {
  today: 1,
  week: 7,
  month: 30,
};

export const PERIOD_LABEL: Record<Period, string> = {
  today: "Hoy",
  week: "Últimos 7 días",
  month: "Últimos 30 días",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mixed: "Mixto",
};

export function parsePeriod(raw: string | undefined | null): Period {
  return raw === "week" || raw === "month" ? raw : "today";
}

function periodRange(period: Period): { from: Date; to: Date } {
  const to = new Date();
  if (period === "today") {
    return { from: mexicoDayStartUTC(0), to };
  }
  // For week/month, include N-1 days before today (so 7d = today + 6 prior).
  const days = PERIOD_DAYS[period];
  return { from: mexicoDayStartUTC(days - 1), to };
}

export type TopProduct = {
  id: string;
  code: string;
  name: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type LowStockRow = {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  threshold: number;
};

export type TopClient = { id: string; name: string; total: number };

export type ReportData = {
  period: Period;
  range: { from: Date; to: Date };
  periodTotal: number;
  periodCount: number;
  ticketAvg: number;
  uniqueClients: number;
  yesterdayTotal: number;
  yesterdayCount: number;
  deltaPct: number | null;
  chartData: SalesTrendDatum[];
  topProducts: TopProduct[];
  lowStockList: LowStockRow[];
  topClients: TopClient[];
  methodEntries: Array<[string, number]>;
  profitTotal: number;
  profitMarginPct: number | null;
};

export async function getReportData(period: Period): Promise<ReportData> {
  const range = periodRange(period);
  const supabase = await getSupabaseServer();

  // Parallel fetch — all reads scoped by the same selected-period range.
  const [
    { data: periodSales, error: periodSalesError },
    { data: yesterdaySales, error: yesterdaySalesError },
    { data: topSaleItems, error: topSaleItemsError },
    { data: lowStock, error: lowStockError },
    { data: stockRows, error: stockRowsError },
    { data: paymentAgg, error: paymentAggError },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, total, paid_amount, status, payment_method, client_id, date_at",
      )
      .gte("date_at", range.from.toISOString())
      .lte("date_at", range.to.toISOString())
      .neq("status", "cancelled"),
    // For ticket comparison (only used in "today" period)
    period === "today"
      ? supabase
          .from("sales")
          .select("total")
          .gte("date_at", mexicoDayStartUTC(1).toISOString())
          .lt("date_at", mexicoDayStartUTC(0).toISOString())
          .neq("status", "cancelled")
      : Promise.resolve({ data: [] as Array<{ total: number }>, error: null }),
    // Top products + profit: pull recent sale_items in the period, aggregate
    // client-side. price_buy is the product's CURRENT cost, not a historical
    // snapshot at time of sale — see the profit caveat below.
    supabase
      .from("sale_items")
      .select(
        "quantity, unit_price, subtotal, sales!inner(date_at, status), products(id, code, name, price_buy)",
      )
      .gte("sales.date_at", range.from.toISOString())
      .lte("sales.date_at", range.to.toISOString())
      .neq("sales.status", "cancelled"),
    supabase
      .from("products")
      .select("id, code, name, stock_low_threshold, image_url")
      .eq("status", "active"),
    // Stock is a view; PostgREST cannot infer an embedded relationship, so
    // query it directly and join in app code (mirrors /products/page.tsx).
    supabase.from("vw_product_stock").select("product_id, stock_on_hand"),
    supabase
      .from("sales")
      .select("payment_method, total")
      .gte("date_at", range.from.toISOString())
      .lte("date_at", range.to.toISOString())
      .neq("status", "cancelled"),
  ]);

  if (periodSalesError)
    console.error("[reports] period sales", periodSalesError);
  if (yesterdaySalesError)
    console.error("[reports] yesterday sales", yesterdaySalesError);
  if (topSaleItemsError)
    console.error("[reports] top sale items", topSaleItemsError);
  if (lowStockError)
    console.error("[reports] low stock products", lowStockError);
  if (stockRowsError) console.error("[reports] stock rows", stockRowsError);
  if (paymentAggError) console.error("[reports] payment agg", paymentAggError);

  // ── KPIs ─────────────────────────────────────────────────────────
  const periodTotal = (periodSales ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const periodCount = (periodSales ?? []).length;
  const ticketAvg = periodCount > 0 ? periodTotal / periodCount : 0;
  const uniqueClients = new Set(
    (periodSales ?? [])
      .map((s) => s.client_id)
      .filter((c): c is string => Boolean(c)),
  ).size;

  // vs ayer — only meaningful for "today" period
  const yesterdayTotal = (yesterdaySales ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const yesterdayCount = (yesterdaySales ?? []).length;
  const deltaPct =
    yesterdayTotal > 0
      ? ((periodTotal - yesterdayTotal) / yesterdayTotal) * 100
      : null;

  // ── Daily chart series — same range as the rest of the report, not a
  // fixed separate window, so "Ventas por día" always matches the period
  // the user picked (Hoy = 1 day, 7 días, 30 días). Reuses `periodSales`
  // (already scoped to `range`) instead of a second query.
  const dayTotal = new Map<string, number>();
  const dayCount = new Map<string, number>();
  for (const s of periodSales ?? []) {
    const key = mexicoISODate(s.date_at);
    dayTotal.set(key, (dayTotal.get(key) ?? 0) + Number(s.total));
    dayCount.set(key, (dayCount.get(key) ?? 0) + 1);
  }
  const chartData: SalesTrendDatum[] = [];
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    const key = mexicoISODate(cursor);
    chartData.push({
      date: key,
      total: dayTotal.get(key) ?? 0,
      count: dayCount.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Top products + profit (aggregate by product_id) ──────────────
  const productAgg = new Map<string, TopProduct>();
  let revenueForProfit = 0;
  let costForProfit = 0;
  for (const item of topSaleItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    if (!product) continue;
    const id = product.id as string;
    const cur = productAgg.get(id) ?? {
      id,
      code: product.code as string,
      name: product.name as string,
      units: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    const quantity = Number(item.quantity);
    const subtotal = Number(item.subtotal);
    const cost = quantity * Number(product.price_buy);
    cur.units += quantity;
    cur.revenue += subtotal;
    cur.cost += cost;
    cur.profit += subtotal - cost;
    productAgg.set(id, cur);
    revenueForProfit += subtotal;
    costForProfit += cost;
  }
  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Costo actual del producto, no el costo histórico al momento de la venta
  // (sale_items no guarda esa foto) — aproximación razonable mientras los
  // costos de compra no cambien seguido.
  const profitTotal = revenueForProfit - costForProfit;
  const profitMarginPct =
    revenueForProfit > 0 ? (profitTotal / revenueForProfit) * 100 : null;

  // ── Low stock (compare view.stock_on_hand with products.stock_low_threshold) ──
  const stockByProduct = new Map<string, number>(
    (stockRows ?? []).map((s) => [
      s.product_id as string,
      Number(s.stock_on_hand),
    ]),
  );
  const lowStockList: LowStockRow[] = (lowStock ?? [])
    .map((p) => ({
      id: p.id as string,
      code: p.code as string,
      name: p.name as string,
      imageUrl: (p.image_url as string | null) ?? null,
      stock: stockByProduct.get(p.id as string) ?? 0,
      threshold: Number(p.stock_low_threshold),
    }))
    .filter((p) => p.stock <= p.threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  // ── Top clients (TOP 5 by total spent) ─────────────────────────
  const clientAgg = new Map<string, number>();
  for (const s of periodSales ?? []) {
    if (!s.client_id) continue;
    clientAgg.set(
      s.client_id,
      (clientAgg.get(s.client_id) ?? 0) + Number(s.total),
    );
  }
  const topClientIds = [...clientAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  // Skip the query entirely when there's nothing to look up — `clients.id`
  // is a uuid column, and a placeholder string like "__none__" isn't a
  // valid uuid, so `.in("id", [...])` with that sentinel throws a Postgres
  // cast error every time no client bought in the period (e.g. "Hoy").
  const { data: clientRows, error: clientRowsError } = topClientIds.length
    ? await supabase
        .from("clients")
        .select("id, name, phone")
        .in("id", topClientIds)
    : { data: [], error: null };
  if (clientRowsError) console.error("[reports] top clients", clientRowsError);
  const clientNameById = new Map<string, string>(
    (clientRows ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const topClients: TopClient[] = topClientIds.map((id) => ({
    id,
    name: clientNameById.get(id) ?? "Cliente",
    total: clientAgg.get(id) ?? 0,
  }));

  // ── Payment methods aggregate ────────────────────────────────────
  const methodAgg = new Map<string, number>();
  for (const s of paymentAgg ?? []) {
    const m = s.payment_method as "cash" | "transfer" | "mixed";
    methodAgg.set(m, (methodAgg.get(m) ?? 0) + Number(s.total));
  }
  const methodEntries = [...methodAgg.entries()].sort((a, b) => b[1] - a[1]);

  return {
    period,
    range,
    periodTotal,
    periodCount,
    ticketAvg,
    uniqueClients,
    yesterdayTotal,
    yesterdayCount,
    deltaPct,
    chartData,
    topProducts,
    lowStockList,
    topClients,
    methodEntries,
    profitTotal,
    profitMarginPct,
  };
}

export type DetailedSale = {
  ticketNumber: number;
  dateAt: string;
  clientName: string | null;
  total: number;
  paymentMethod: string;
  status: string;
};

// Only needed for the Excel export — the on-screen report never lists
// individual sales, but a spreadsheet export is more useful with the raw
// rows behind the aggregates.
export async function getDetailedSales(
  period: Period,
): Promise<DetailedSale[]> {
  const range = periodRange(period);
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("sales")
    .select(
      "ticket_number, date_at, total, payment_method, status, clients(name)",
    )
    .gte("date_at", range.from.toISOString())
    .lte("date_at", range.to.toISOString())
    .neq("status", "cancelled")
    .order("date_at", { ascending: false });
  if (error) {
    console.error("[reports] detailed sales", error);
    return [];
  }
  return (data ?? []).map((s) => {
    const client = Array.isArray(s.clients) ? s.clients[0] : s.clients;
    return {
      ticketNumber: Number(s.ticket_number),
      dateAt: s.date_at as string,
      clientName: (client?.name as string | undefined) ?? null,
      total: Number(s.total),
      paymentMethod: s.payment_method as string,
      status: s.status as string,
    };
  });
}
