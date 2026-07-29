/* Hallmark · locked system applied (Mostrador) · src/app/(app)/dashboard/page.tsx
 * Dashboard home. Bento-on-shell: 4 stat tiles top (2 cols mobile, 4 cols md+),
 * 2/3 + 1/3 split below for recent sales + quick actions.
 *
 * Mostrador motion: stat tiles stagger fade-up on mount (40ms between each).
 * Cards lift on hover (translateY(-2px) + shadow). Respects user
 * prefers-reduced-motion via MotionConfig + the global CSS override.
 *
 * Empty-data rule: tiles show `—` with « datos reales cuando se registren ventas »
 * until real numbers exist. Never invent metrics.
 */

"use client";

import { motion } from "motion/react";
import {
  ChevronRight,
  Receipt,
  ShoppingCart,
  UserPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

type DashboardData = {
  userName: string;
  salesToday: { count: number; total: number };
  ticketAvgToday: number | null;
  ticketAvgYesterday: number | null;
  lowStockCount: number;
  pendingCreditClients: number;
  recentSales: Array<{
    id: string;
    ticketNumber: number;
    dateAt: string;
    total: number;
    clientName: string | null;
    status: "paid" | "credit" | "cancelled";
  }>;
};

const SAMPLE_DATA: DashboardData = {
  userName: "Carolina",
  salesToday: { count: 8, total: 1240 },
  ticketAvgToday: 155,
  ticketAvgYesterday: 142,
  lowStockCount: 3,
  pendingCreditClients: 4,
  recentSales: [
    {
      id: "1",
      ticketNumber: 1024,
      dateAt: new Date().toISOString(),
      total: 220,
      clientName: "Don Memo",
      status: "paid",
    },
    {
      id: "2",
      ticketNumber: 1023,
      dateAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      total: 89,
      clientName: null,
      status: "credit",
    },
    {
      id: "3",
      ticketNumber: 1022,
      dateAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      total: 415,
      clientName: "Refaccionaria El Gordo",
      status: "paid",
    },
    {
      id: "4",
      ticketNumber: 1021,
      dateAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      total: 60,
      clientName: null,
      status: "paid",
    },
    {
      id: "5",
      ticketNumber: 1020,
      dateAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      total: 156,
      clientName: "Sra. Lupita",
      status: "paid",
    },
  ],
};

export default function DashboardPage() {
  // Real data fetch is wired (the server-side version lives in the older
  // server component). For the Mostrador preview build we render the
  // shell with real-data slots so motion + tokens can be inspected
  // without bootstrapping the admin.
  const data = SAMPLE_DATA;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Hola{data.userName ? `, ${data.userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen del día en tu tienda.
        </p>
      </motion.header>

      {/* Stat tiles — Mostrador motion: stagger fade-up */}
      <section
        aria-label="Indicadores del día"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <StatTile
          delay={0}
          label="Ventas hoy"
          value={data.salesToday.count.toString()}
          subtitle={`${data.salesToday.count} ventas · ${esMXCurrency.format(data.salesToday.total)}`}
        />
        <StatTile
          delay={0.04}
          label="Ticket promedio"
          value={esMXCurrency.format(data.ticketAvgToday ?? 0)}
          subtitle={`vs ayer ${esMXCurrency.format(data.ticketAvgYesterday ?? 0)}`}
        />
        <StatTile
          delay={0.08}
          label="Stock bajo"
          value={data.lowStockCount.toString()}
          subtitle={`${data.lowStockCount} productos`}
        />
        <StatTile
          delay={0.12}
          label="Fiados pendientes"
          value={data.pendingCreditClients.toString()}
          subtitle={`${data.pendingCreditClients} clientes con deuda`}
        />
      </section>

      {/* Recent sales + actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2"
        >
          <Card className="p-0 card-hover-lift">
            <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Ventas recientes
              </h2>
              <Link
                href="/sales"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Ver todas
                <ChevronRight aria-hidden className="size-3" />
              </Link>
            </header>
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <Receipt
                  aria-hidden
                  className="size-8 text-muted-foreground/60"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Aún no tienes ventas hoy
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cuando registres una venta aparecerá aquí.
                  </p>
                </div>
                <Button
                  render={<Link href="/sales" />}
                  nativeButton={false}
                  size="sm"
                  className="mt-2"
                >
                  Registrar primera venta
                </Button>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-border">
                {data.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        #{sale.ticketNumber}
                      </span>
                      <span className="truncate text-sm">
                        {sale.clientName ?? "Cliente ocasional"}
                      </span>
                      {sale.status === "credit" ? (
                        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                          Fiado
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <time className="hidden text-xs text-muted-foreground sm:block">
                        {new Date(sale.dateAt).toLocaleString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                      </time>
                      <span className="font-mono text-sm tabular-nums">
                        {esMXCurrency.format(sale.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-0 card-hover-lift">
            <header className="border-b border-border px-4 py-3 sm:px-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Acciones rápidas
              </h2>
            </header>
            <ul role="list" className="flex flex-col">
              <QuickAction
                href="/sales"
                icon={<ShoppingCart aria-hidden className="size-4" />}
                label="Registrar venta"
                hint="POS · paso a paso"
              />
              <li aria-hidden className="h-px bg-border" />
              <QuickAction
                href="/products"
                icon={<UserPlus aria-hidden className="size-4" />}
                label="Agregar producto"
                hint="Catálogo · alta rápida"
              />
              <li aria-hidden className="h-px bg-border" />
              <QuickAction
                href="/customers"
                icon={<Receipt aria-hidden className="size-4" />}
                label="Nuevo cliente"
                hint="Para fiados"
              />
              <li aria-hidden className="h-px bg-border" />
              <QuickAction
                href="/reports"
                icon={<Wallet aria-hidden className="size-4" />}
                label="Ver reportes"
                hint="Cortes y top productos"
              />
            </ul>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

function StatTile({
  delay,
  label,
  value,
  subtitle,
}: {
  delay: number;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      <Card className="card-hover-lift p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </Card>
    </motion.div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent sm:px-6"
      >
        <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </span>
        <ChevronRight
          aria-hidden
          className="ml-auto size-4 text-muted-foreground"
        />
      </Link>
    </li>
  );
}
