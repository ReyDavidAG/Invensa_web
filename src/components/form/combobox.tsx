"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional small caption rendered next to the label (e.g. "IN", "OUT"). */
  hint?: string;
};

type ComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyHint?: string;
  ariaLabel?: string;
  className?: string;
};

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  emptyHint = "Sin opciones.",
  ariaLabel,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the search input on next tick whenever the popover opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, search]);

  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSearch("");
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
              className,
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 truncate text-left">
          {selected ? (
            <>
              <span className="truncate">{selected.label}</span>
              {selected.hint ? (
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {selected.hint}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length > 0) {
                  onChange(filtered[0].value);
                  setOpen(false);
                }
              }
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="h-7 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>

        <ul
          role="listbox"
          aria-label={ariaLabel ?? "Opciones"}
          className="max-h-64 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              {emptyHint}
            </li>
          ) : (
            filtered.map((o) => {
              const isSelected = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      isSelected && "bg-muted/60",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{o.label}</span>
                      {o.hint ? (
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                          {o.hint}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check
                        aria-hidden
                        className="size-4 shrink-0 text-primary"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
