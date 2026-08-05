import { formatDateLong, formatTime } from "@/lib/datetime";

type PrintReceiptProps = {
  ticketNumber: number;
  dateAt: string;
  status: "paid" | "credit" | "cancelled";
  paymentMethod: "cash" | "transfer" | "mixed";
  clientName: string | null;
  clientPhone: string | null;
  notes: string | null;
  total: number;
  paid: number;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    productName: string;
    productCode: string;
    unitCode: string | null;
  }>;
};

const STATUS_LABEL = {
  paid: "PAGADO",
  credit: "FIADO",
  cancelled: "CANCELADO",
} as const;

const PAYMENT_LABEL = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mixed: "Mixto",
} as const;

const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// ─── Subcomponents (kept inline for print-only scope) ──────────

function SepHeavy() {
  return <p className="my-1 text-center">================================</p>;
}

function SepLight() {
  return <p className="my-1 text-center">--------------------------------</p>;
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span>{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

export function PrintReceipt({
  ticketNumber,
  dateAt,
  status,
  paymentMethod,
  clientName,
  clientPhone,
  notes,
  total,
  paid,
  items,
}: PrintReceiptProps) {
  const change = Math.max(0, paid - total);
  const outstanding = Math.max(0, total - paid);

  return (
    <div
      data-print-receipt
      className="hidden print:block print:w-full print:mx-auto print:max-w-[80mm] print:bg-white print:p-[4mm] print:font-mono print:text-[11pt] print:text-black print:leading-[1.45]"
    >
      {/* ─── Brand header ─── */}
      <div className="text-center">
        <p className="text-[18pt] font-bold tracking-[0.12em]">INVensa</p>
        <p className="text-[9pt] tracking-[0.04em]">Tienda de barrio</p>
      </div>

      <SepHeavy />

      {/* ─── Ticket info ─── */}
      <div className="flex flex-col gap-0.5">
        <p>
          <span className="font-bold">Ticket</span> #{ticketNumber}
        </p>
        <p>{formatDateLong(dateAt)}</p>
        <p>Hora: {formatTime(dateAt)}</p>
        <p className="mt-1 text-[9pt] font-bold uppercase tracking-[0.08em]">
          {STATUS_LABEL[status]}
        </p>
      </div>

      {/* ─── Client ─── */}
      {clientName ? (
        <>
          <SepLight />
          <div className="flex flex-col gap-0.5">
            <p>
              <span className="font-bold">Cliente:</span> {clientName}
            </p>
            {clientPhone ? <p>Tel: {clientPhone}</p> : null}
          </div>
        </>
      ) : null}

      <SepHeavy />

      {/* ─── Line items ─── */}
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id}>
            <p className="font-bold leading-snug">{item.productName}</p>
            <p className="text-[9pt]">
              {item.productCode}
              {item.unitCode ? ` · ${item.unitCode}` : null}
            </p>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span>
                {item.quantity} x {formatMXN(item.unitPrice)}
              </span>
              <span className="font-bold">{formatMXN(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <SepHeavy />

      {/* ─── Total ─── */}
      <div className="flex items-baseline justify-between text-[13pt] font-bold">
        <span>TOTAL</span>
        <span>{formatMXN(total)}</span>
      </div>

      <SepHeavy />

      {/* ─── Payment ─── */}
      <div className="flex flex-col gap-1">
        <Row label="Método:" value={PAYMENT_LABEL[paymentMethod]} />
        {status === "paid" ? (
          <>
            <Row label="Recibido:" value={formatMXN(paid)} />
            {change > 0 ? (
              <Row label="Cambio:" value={formatMXN(change)} bold />
            ) : null}
          </>
        ) : (
          <>
            <Row label="Abonado:" value={formatMXN(paid)} />
            {outstanding > 0 ? (
              <Row label="Saldo:" value={formatMXN(outstanding)} bold />
            ) : null}
          </>
        )}
      </div>

      {notes ? (
        <>
          <SepLight />
          <div>
            <p className="text-[9pt] font-bold uppercase tracking-[0.06em]">
              Notas
            </p>
            <p>{notes}</p>
          </div>
        </>
      ) : null}

      <SepHeavy />

      {/* ─── Footer ─── */}
      <div className="text-center">
        <p className="font-bold">¡Gracias por su compra!</p>
        <p className="mt-1 text-[9pt] tracking-[0.04em]">invensa.app</p>
      </div>

      <SepHeavy />
    </div>
  );
}
