"use client";

import { FadeUp } from "@/components/motion/fade-up";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateSale } from "@/lib/query/mutations";
import {
  CreatableCombobox,
  type CreatableOption,
} from "@/components/form/creatable-combobox";
import { useCreateCustomer } from "@/lib/query/mutations";
import { cn } from "@/lib/utils";

export type PosProduct = {
  id: string;
  code: string;
  name: string;
  priceSale: number;
  stock: number;
  imageUrl: string | null;
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
  imageUrl: string | null;
};

type PaymentMode = "cash"; // Fiado y transferencia deshabilitados por ahora
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
  clients: initialClients,
}: {
  products: PosProduct[];
  recentProducts: PosProduct[];
  clients: PosClient[];
}) {
  const router = useRouter();
  const createSale = useCreateSale();
  const createCustomer = useCreateCustomer();
  const [clients, setClients] = useState<PosClient[]>(initialClients);

  // ─── State ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [notes, setNotes] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Close the search dropdown on outside click.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );
  const totalQuantity = cart.reduce((sum, l) => sum + l.quantity, 0);

  const paidAmount = Number(paidAmountInput) || 0;
  const showChange = paidAmount > total;
  const change = showChange ? paidAmount - total : 0;
  const shortfall = total - paidAmount;
  const canSubmit =
    cart.length > 0 && paidAmount >= total && !createSale.isPending;

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
          imageUrl: p.imageUrl,
        },
      ];
    });
    // Clear the search + reset debouncedSearch so the dropdown switches from
    // the previous results to "Recientes" immediately (no 200ms stale window).
    // Keep the dropdown open and refocus the input on the next frame so the
    // user can keep adding products without re-clicking the search field.
    setSearch("");
    setDebouncedSearch("");
    setSearchFocused(true);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
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
  }, []);

  const removeLine = useCallback((productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const onSubmit = async () => {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("paymentMethod", "cash");
    fd.set("status", "paid");
    fd.set("paidAmount", String(total));
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
    <FadeUp className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-6">
      {/* ─── LEFT: Customer + Search + Products ─────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        {/* Cliente */}
        <Card className="p-4">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-foreground">
              <User aria-hidden className="size-3.5" />
              Cliente
            </span>
            <CreatableCombobox
              value={clientId || "anonymous"}
              onChange={(v) => setClientId(v === "anonymous" ? "" : v)}
              options={[
                {
                  id: "anonymous",
                  code: "—",
                  name: "Anónimo (cliente ocasional)",
                },
                ...clients.map((c): CreatableOption => ({
                  id: c.id,
                  code: "·",
                  name: c.name,
                })),
              ]}
              onCreate={async (name) => {
                try {
                  const fd = new FormData();
                  fd.set("name", name);
                  fd.set("phone", "");
                  fd.set("email", "");
                  fd.set("address", "");
                  fd.set("notes", "");
                  const res = await createCustomer.mutateAsync(fd);
                  if (res.ok) {
                    setClients((prev) => [
                      ...prev,
                      {
                        id: res.id,
                        name,
                        phone: null,
                      },
                    ]);
                    setClientId(res.id);
                    toast.success(`Cliente "${name}" creado`);
                    return {
                      ok: true,
                      option: { id: res.id, code: "·", name },
                    };
                  }
                  return { ok: false, error: res.error };
                } catch (err) {
                  return {
                    ok: false,
                    error:
                      err instanceof Error ? err.message : "Error desconocido",
                  };
                }
              }}
              placeholder="Buscar cliente…"
              createNoun="cliente"
              className="h-12"
            />
          </div>
        </Card>

        {/* Search — autocomplete dropdown */}
        <div className="relative" ref={searchContainerRef}>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="h-12 pl-9 pr-10 text-base"
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : null}

          {/* Dropdown: shows on focus. Recientes when empty, results when typing. */}
          {searchFocused ? (
            <div className="absolute top-full left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {(() => {
                const items = debouncedSearch
                  ? filteredProducts.slice(0, 8)
                  : recentProducts.slice(0, 3);
                const isSearch = Boolean(debouncedSearch);
                const isFiltering = search.trim() !== debouncedSearch;
                const headerLabel = isSearch
                  ? `${filteredProducts.length} resultado${filteredProducts.length === 1 ? "" : "s"}`
                  : "Recientes";
                return (
                  <>
                    <p className="sticky top-0 border-b border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {headerLabel}
                    </p>
                    {isFiltering ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground"
                      >
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                        Buscando…
                      </div>
                    ) : items.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {isSearch
                          ? `Sin resultados para "${debouncedSearch}".`
                          : "Empieza a vender para ver tus productos más usados aquí."}
                      </p>
                    ) : (
                      <ul role="list" className="divide-y divide-border">
                        {items.map((p) => {
                          const outOfStock = p.stock <= 0;
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (outOfStock) {
                                    toast.error(`"${p.name}" sin stock`);
                                    return;
                                  }
                                  // addToCart owns focus + dropdown state — do
                                  // NOT call setSearchFocused(false) here or it
                                  // races with the focus event and the dropdown
                                  // gets stuck closed.
                                  addToCart(p);
                                }}
                                disabled={outOfStock}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-secondary-foreground">
                                  {p.imageUrl ? (
                                    <img
                                      src={p.imageUrl}
                                      alt=""
                                      loading="lazy"
                                      decoding="async"
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <PackageSearch
                                      aria-hidden
                                      className="size-4"
                                    />
                                  )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate text-sm font-medium text-foreground">
                                    {p.name}
                                  </span>
                                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                                    {p.code}
                                    {p.stock <= 0 ? (
                                      <span className="ml-2 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                                        Sin stock
                                      </span>
                                    ) : null}
                                  </span>
                                </span>
                                <span className="ml-auto font-mono text-sm font-semibold tabular-nums text-foreground">
                                  {esMXCurrency.format(p.priceSale)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── RIGHT: Cart + Payment + Submit ─────────────────────────── */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card className="flex flex-col p-0">
          {/* Cart header */}
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight">Carrito</h2>
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
            {createSale.data &&
            !createSale.data.ok &&
            !createSale.data.fieldErrors ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
              >
                {createSale.data.error}
              </div>
            ) : null}

            {/* Payment method (currently cash-only; toggle hidden until transfer/fiado land) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">Pago</span>
              <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary">
                Efectivo
              </span>
            </div>

            {/* Cash received — always shown for cash-only POS */}
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
              ) : paidAmount > 0 && shortfall > 0 ? (
                <div
                  role="alert"
                  className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2"
                >
                  <span className="text-xs font-medium text-destructive">
                    Falta
                  </span>
                  <span className="font-mono text-base font-semibold tabular-nums text-destructive">
                    {esMXCurrency.format(shortfall)}
                  </span>
                </div>
              ) : null}
            </div>

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
    </FadeUp>
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
      {line.imageUrl ? (
        <img
          src={line.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-10 shrink-0 rounded-md border border-border bg-muted object-cover"
        />
      ) : null}
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
