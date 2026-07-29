"use client";

/* Hallmark · locked system applied · src/components/form/creatable-combobox.tsx
 * Generic creatable combobox. Search-as-you-type list + "Create X" footer
 * when the search has no exact match. Used for categories and units in the
 * product form so the sister can spin up new ones without leaving the page.
 */

import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CreatableOption = {
  id: string;
  code: string;
  name: string;
};

type CreatableComboboxProps = {
  value: string;
  onChange: (id: string) => void;
  options: CreatableOption[];
  onCreate: (
    name: string,
  ) => Promise<{ ok: true; option: CreatableOption } | { ok: false; error: string }>;
  placeholder?: string;
  emptyHint?: string;
  renderOption?: (option: CreatableOption) => React.ReactNode;
  renderSelected?: (option: CreatableOption) => React.ReactNode;
  /** Singular noun shown in the "Create X" footer, e.g. "categoría", "unidad". */
  createNoun?: string;
  className?: string;
};

export function CreatableCombobox({
  value,
  onChange,
  options,
  onCreate,
  placeholder = "Selecciona o crea…",
  emptyHint = "Sin opciones.",
  renderOption,
  renderSelected,
  createNoun = "opción",
  className,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient state whenever the popover opens/closes.
  useEffect(() => {
    if (open) {
      setSearch("");
      setError(null);
      // Focus the search input on next tick.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q),
    );
  }, [options, search]);

  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return (
      options.find(
        (o) => o.name.toLowerCase() === q || o.code.toLowerCase() === q,
      ) ?? null
    );
  }, [options, search]);

  const selected = options.find((o) => o.id === value) ?? null;
  const showCreate = search.trim().length > 0 && !exactMatch && !creating;

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    const result = await onCreate(name);
    setCreating(false);
    if (result.ok) {
      onChange(result.option.id);
      setOpen(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
              className,
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 truncate text-left">
          {selected ? (
            renderSelected ? (
              renderSelected(selected)
            ) : (
              <>
                <span className="truncate">{selected.name}</span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {selected.code}
                </span>
              </>
            )
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
            placeholder="Buscar o crear…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (showCreate) {
                  handleCreate();
                } else if (filtered.length > 0) {
                  onChange(filtered[0].id);
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
          aria-label="Opciones"
          className="max-h-64 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              {emptyHint}
            </li>
          ) : (
            filtered.map((o) => {
              const isSelected = o.id === value;
              return (
                <li key={o.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      isSelected && "bg-muted/60",
                    )}
                  >
                    {renderOption ? (
                      renderOption(o)
                    ) : (
                      <>
                        <span className="truncate">{o.name}</span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                          {o.code}
                        </span>
                      </>
                    )}
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

        {showCreate ? (
          <div className="border-t border-border p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
              className="w-full justify-start gap-2 px-2 text-primary hover:bg-primary/10 hover:text-primary"
            >
              {creating ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Plus aria-hidden className="size-4" />
              )}
              <span className="truncate">
                Crear {createNoun} "{search.trim()}"
              </span>
            </Button>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="border-t border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
