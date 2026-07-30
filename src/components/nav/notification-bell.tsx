"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Bell, BellRing, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMarkAllAsRead, useMarkAsRead } from "@/lib/query/mutations";
import { listNotificationsAction } from "@/app/actions/notifications";
import type {
  Notification,
  NotificationType,
} from "@/lib/schemas/notifications";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<
  NotificationType,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  low_stock: Package,
  cash_closing: Banknote,
  system: BellRing,
};

const TYPE_TINT: Record<NotificationType, string> = {
  low_stock: "bg-warning/15 text-warning",
  cash_closing: "bg-primary/10 text-primary",
  system: "bg-muted text-muted-foreground",
};

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const router = useRouter();
  const markAsRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listNotificationsAction();
      setItems(res.items);
      setUnread(res.unread);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open]);

  async function handleItemClick(n: Notification) {
    if (n.read_at === null) {
      const res = await markAsRead.mutateAsync(n.id);
      if (res.ok) {
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((it) =>
            it.id === n.id ? { ...it, read_at: new Date().toISOString() } : it,
          ),
        );
      } else {
        toast.error(res.error);
      }
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link as never);
    }
  }

  async function handleMarkAll() {
    const res = await markAll.mutateAsync();
    if (res.ok) {
      setUnread(0);
      setItems((prev) =>
        prev.map((it) =>
          it.read_at === null
            ? { ...it, read_at: new Date().toISOString() }
            : it,
        ),
      );
      toast.success("Notificaciones marcadas como leídas");
    } else {
      toast.error(res.error);
    }
  }

  const hasUnread = unread > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              hasUnread
                ? `Notificaciones (${unread} sin leer)`
                : "Notificaciones"
            }
            data-tour="bell"
            className="relative"
          />
        }
      >
        <Bell aria-hidden className="size-4" />
        {hasUnread ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
      >
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notificaciones
          </h3>
          {items.length > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {unread > 0
                ? `${unread} sin leer · ${items.length} totales`
                : `${items.length} totales`}
            </span>
          ) : null}
        </div>

        {/* List */}
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center px-6 py-10">
            <Loader2
              aria-hidden
              className="size-5 animate-spin text-muted-foreground"
            />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul
            role="list"
            className="max-h-96 overflow-y-auto divide-y divide-border"
          >
            {items.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  notification={n}
                  onClick={() => handleItemClick(n)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && hasUnread ? (
          <div className="border-t border-border px-4 py-2">
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markAll.isPending}
              className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline disabled:opacity-50"
            >
              {markAll.isPending ? "Marcando…" : "Marcar todas como leídas"}
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[n.type];
  const isUnread = n.read_at === null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1 size-2 shrink-0 rounded-full transition-opacity",
          isUnread ? "bg-primary opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md",
          TYPE_TINT[n.type],
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium leading-snug text-foreground">
          {n.title}
        </span>
        {n.body ? (
          <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {n.body}
          </span>
        ) : null}
        <span className="mt-1 text-[11px] text-muted-foreground">
          {formatRelative(new Date(n.created_at))}
        </span>
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Bell aria-hidden className="size-8 text-muted-foreground/60" />
      <p className="text-sm font-medium text-foreground">Sin notificaciones</p>
      <p className="text-xs text-muted-foreground">
        Te avisamos cuando algo requiera tu atención.
      </p>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHr = Math.round(diffMs / 3_600_000);
  const diffDay = Math.round(diffMs / 86_400_000);

  const rtf = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
