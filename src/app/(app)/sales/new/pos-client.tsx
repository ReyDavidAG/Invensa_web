"use client";

/* Hallmark · locked system applied (Taller) · src/app/(app)/sales/new/pos-client.tsx
 * POS — point of sale. Search-first product picker with "recientes" quick-add,
 * cart with +/- quantity controls, payment toggle (cash / transfer / fiado),
 * cash received auto-change calculation, and a single submit button.
 *
 * Cart state is persisted to localStorage so an accidental page refresh
 * (or a network hiccup) doesn't drop the cart.
 */

import { motion } from "motion/react";
import {
  ChevronLeft,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSale } from "@/lib/query/mutations";
import { cn } from "@/lib/utils";

export type PosProduct = {
  id: string;
  code: string;
  name: string;
  priceSale: number;
  stock: number;
};

export type PosClient = {
  id: string;
  name: string;
  phone: string | null;
};

type CartLine = {
  productId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

type PaymentMode = "cash" | "transfer" | "credit";
type PaymentMethod = "cash" | "transfer" | "mixed";
type SaleStatus = "paid" | "credit";

const CART_KEY = "invensa.pos.cart.v1";
const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function PosClient({
  products,
  recentProducts,
  clients,
}: {
  products: PosProduct[];
  recentProducts: PosProduct[];
  clients: PosClient[];
}) {
  const router = useRouter();
  const createSale = useCreateSale();

  // ─── State ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [notes, setNotes] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Effects ────────────────────────────────────────────────────────
  // Debounce search input (200ms)
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(handle);
  }, [search]);

  // Restore cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved) as CartLine[]);
    } catch {}
    // Focus search input on mount
    searchRef.current?.focus();
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // ─── Derived ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [debouncedSearch, products]);

  const total = useMemo(
    () =>
      cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );
  const totalQuantity = cart.reduce((sum, l) => sum + l.quantity, 0);

  const paidAmount = Number(paidAmountInput) || 0;
  const showCashReceived = paymentMode === "cash" || paymentMode === "transfer";
  const showChange = showCashReceived && paidAmount > total;
  const change = showChange ? paidAmount - total : 0;
  const isFiado = paymentMode === "credit";
  const canSubmit =
    cart.length > 0 &&
    !createSale.isPending &&
    (!isFiado || clientId);

  // ─── Handlers ──────────────────────────────────────────────────────
  const addToCart = useCallback((p: PosProduct) => {
    if (p.stock <= 0) {
      toast.error(`"${p.name}" sin stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity + 1 > existing.stock) {
          toast.error(`Sin stock suficiente para "${p.name}"`);
          return prev;
        }
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          code: p.code,
          name: p.name,
          unitPrice: p.priceSale,
          quantity: 1,
          stock: p.stock,
        },
      ];
    });
    // Clear search and refocus
    setSearch("");
    searchRef.current?.focus();
  }, []);

  const setQuantity = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
        return;
      }
      setCart((prev) =>
        prev.map((l) => {
          if (l.productId !== productId) return l;
          if (qty > l.stock) {
            toast.error(`Sin stock suficiente para "${l.name}"`);
            return l;
          }
          return { ...l, quantity: qty };
        }),
      );
    },
    [],
  );

  const removeLine = useCallback((productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const onSubmit = async () => {
    if (!canSubmit) return;
    const status: SaleStatus = isFiado ? "credit" : "paid";
    // For fiado, default paymentMethod to "cash" if none specified; the
    // sale can be settled later via /sales/[id] in a future phase.
    const paymentMethod: PaymentMethod = isFiado ? "cash" : paymentMode;
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("paymentMethod", paymentMethod);
    fd.set("status", status);
    fd.set(
      "paidAmount",
      isFiado ? String(paidAmount) : String(total),
    );
    fd.set("notes", notes);
    fd.set("items", JSON.stringify(cart));
    const result = await createSale.mutateAsync(fd);
    if (result.ok) {
      toast.success(`Venta registrada · #${result.ticketNumber}`);
      // Clear cart and localStorage
      setCart([]);
      localStorage.removeItem(CART_KEY);
      router.push(`/sales/${result.id}`);
    } else if (!result.fieldErrors) {
      toast.error(result.error);
    }
  };

  // Quick amount buttons for cash received
  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-6">
      {/* ─── LEFT: Customer + Search + Products ─────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link
              href="/sales"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
              Ventas
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              Nueva venta
            </h1>
          </div>
        </motion.div>

        {/* Cliente */}
        <Card className="p-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="pos-client"
              className="flex items-center gap-2 text-xs font-medium text-foreground"
            >
              <User aria-hidden className="size-3.5" />
              Cliente
            </label>
            <Select
              value={clientId || "anonymous"}
              onValueChange={(v) => setClientId(v && v !== "anonymous" ? v : "")}
            >
              <SelectTrigger id="pos-client" className="h-12 w-full">
                <SelectValue placeholder="Anónimo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonymous">Anónimo (cliente ocasional)</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-9 pr-4 text-base"
          />
        </div>

        {/* Search results OR recientes */}
        {debouncedSearch ? (
          <section aria-label="Resultados de búsqueda">
            {filteredProducts.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
                Sin resultados para "{debouncedSearch}".
              </Card>
            ) : (
              <ul
                role="list"
                className="grid grid-cols-2 gap-2 md:grid-cols-3"
              >
                {filteredProducts.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} onAdd={addToCart} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section aria-label="Productos recientes" className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recientes
            </h2>
            {recentProducts.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
                Empieza a vender para ver tus productos más usados aquí.
              </Card>
            ) : (
              <ul
                role="list"
                className="grid grid-cols-2 gap-2 md:grid-cols-3"
              >
                {recentProducts.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} onAdd={addToCart} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* ─── RIGHT: Cart + Payment + Submit ─────────────────────────── */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card className="flex flex-col p-0">
          {/* Cart header */}
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                Carrito
              </h2>
              <span className="text-xs text-muted-foreground">
                ({totalQuantity} {totalQuantity === 1 ? "pieza" : "piezas"})
              </span>
            </div>
            {cart.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 aria-hidden className="size-3.5" />
                Vaciar
              </button>
            ) : null}
          </header>

          {/* Cart lines */}
          <div className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <PackageSearch
                  aria-hidden
                  className="size-8 text-muted-foreground/60"
                />
                <p className="text-sm font-medium text-foreground">
                  Carrito vacío
                </p>
                <p className="text-xs text-muted-foreground">
                  Busca un producto o toca uno reciente.
                </p>
              </div>
            ) : (
              cart.map((line) => (
                <CartLineRow
                  key={line.productId}
                  line={line}
                  onQuantityChange={(q) => setQuantity(line.productId, q)}
                  onRemove={() => removeLine(line.productId)}
                />
              ))
            )}
          </div>

          {/* Payment + Total + Submit */}
          <div className="flex flex-col gap-3 border-t border-border p-4">
            {/* Error banner */}
            {createSale.data && !createSale.data.ok && !createSale.data.fieldErrors ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
              >
                {createSale.data.error}
              </div>
            ) : null}

            {/* Payment mode toggle */}
            <fieldset disabled={createSale.isPending}>
              <legend className="mb-1.5 text-xs font-medium text-foreground">
                Pago
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "cash" as const, label: "Efectivo" },
                    { value: "transfer" as const, label: "Transfer." },
                    { value: "credit" as const, label: "Fiado" },
                  ]
                ).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPaymentMode(p.value)}
                    className={cn(
                      "h-12 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
                      paymentMode === p.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Cash received */}
            {showCashReceived ? (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="pos-paid"
                  className="text-xs font-medium text-foreground"
                >
                  Recibido
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="pos-paid"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    disabled={createSale.isPending}
                    className="h-12 pl-7 pr-4 font-mono tabular-nums text-base"
                  />
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaidAmountInput(String(amt))}
                      disabled={createSale.isPending}
                      className="h-9 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                {paidAmount > 0 && change > 0 ? (
                  <div className="flex items-center justify-between rounded-md bg-success/10 px-3 py-2">
                    <span className="text-xs font-medium text-success">
                      Cambio
                    </span>
                    <span className="font-mono text-base font-semibold tabular-nums text-success">
                      {esMXCurrency.format(change)}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Fiado notice */}
            {isFiado && !clientId ? (
              <div
                role="alert"
                className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                Selecciona un cliente para registrar un fiado.
              </div>
            ) : null}

            {/* Total + Submit */}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {esMXCurrency.format(total)}
              </span>
            </div>

            <Button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              size="lg"
              className="h-14 w-full text-base font-semibold"
            >
              {createSale.isPending ? (
                <>
                  <Loader2 aria-hidden className="size-5 animate-spin" />
                  Registrando…
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-5" />
                  Registrar venta
                </>
              )}
            </Button>
            {cart.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Agrega productos al carrito para empezar.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: PosProduct;
  onAdd: (p: PosProduct) => void;
}) {
  const outOfStock = product.stock <= 0;
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={outOfStock}
      className={cn(
        "group flex h-full flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "active:translate-y-0",
        outOfStock
          ? "cursor-not-allowed border-border opacity-60"
          : "border-border",
      )}
    >
      <span className="line-clamp-2 text-sm font-medium text-foreground">
        {product.name}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
        {product.code}
      </span>
      <span className="mt-auto flex w-full items-center justify-between pt-1">
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {esMXCurrency.format(product.priceSale)}
        </span>
        {outOfStock ? (
          <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
            Sin stock
          </span>
        ) : (
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus aria-hidden className="size-4" />
          </span>
        )}
      </span>
    </button>
  );
}

function CartLineRow({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}) {
  const subtotal = line.unitPrice * line.quantity;
  return (
    <div className="flex items-start gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {line.name}
        </p>
        <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {line.code} · {esMXCurrency.format(line.unitPrice)} c/u
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => onQuantityChange(line.quantity - 1)}
              aria-label="Disminuir cantidad"
              className="grid size-8 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Minus aria-hidden className="size-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={line.quantity}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) onQuantityChange(v);
              }}
              min={0}
              max={line.stock}
              className="h-8 w-12 border-x border-border bg-background text-center font-mono text-sm tabular-nums focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(line.quantity + 1)}
              aria-label="Aumentar cantidad"
              className="grid size-8 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Plus aria-hidden className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ${line.name}`}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {esMXCurrency.format(subtotal)}
        </p>
      </div>
    </div>
  );
}
