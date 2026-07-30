"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CustomersSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    // Sync the local input to the URL-driven `defaultValue` prop so back/
    // forward and external links land in the same field. We intentionally
    // call setState here — the rule's "set during render" alternative
    // would discard user focus on every URL change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        next.set("q", value.trim());
      } else {
        next.delete("q");
      }
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/customers?${qs}` : "/customers", { scroll: false });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-72" data-tour="customer-search">
      <label htmlFor="customers-search" className="sr-only">
        Buscar clientes
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="customers-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Buscar por nombre, teléfono o email…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
