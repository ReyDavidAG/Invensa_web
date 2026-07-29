# PLAN — Notificaciones in-app (campanita)

> Feature nueva. Per-usuario, in-app. Email queda como canal separado (resumen diario + stock bajo).
>
> **Status:** 📝 Plan · pendiente sign-off
>
> **Skills aplicadas:** /ponytail (lazy, sin sobre-ingeniería) + /hallmark (diseño limpio, paleta del design.md).

---

## 1. TL;DR

Una campanita en el top-bar que muestra notificaciones por usuario. Cada usuario ve solo las suyas. Las notificaciones las crea el sistema (cron, server actions) — el usuario no puede escribir. El usuario solo lee y marca como leídas.

**V1 dispara:**
- Stock bajo (ya existe el cron; agregamos INSERT de notificación al final del run).
- Recordatorio de cierre de caja pendiente (cron nuevo, 11 AM, solo si `status='open'`).

**V2 (fuera de scope):** notificaciones in-app por ventas grandes, productos archivados, clientes nuevos, etc.

---

## 2. Funcionalidad

### Qué es una notificación

Registro por usuario de un evento del sistema. **Atada al `user_id`**, no global. No es email — es in-app.

Tres tipos en V1:

| `type` | Cuándo se crea | Quién la recibe | Link |
|---|---|---|---|
| `low_stock` | Cuando el cron de stock bajo corre y hay productos críticos | Solo admin (1 notif por día, no por producto) | `/products` |
| `cash_closing` | Cron 11 AM si la caja del día sigue `status='open'` | Admin + employee | `/cash-closing` |
| `system` | Reservado para mensajes manuales futuros | Todos | configurable |

### Qué ve el usuario

**Top-bar (ya existe):**
```
[Sidebar] [Breadcrumb · Title] ............ [Bell🔔3] [Theme] [Avatar]
```

- Icono `Bell` de lucide.
- Badge redondo con el conteo de no-leídas. Oculto si 0. Estilo: background `--destructive`, texto blanco, ~10px, posicionado arriba-derecha del icono.
- Click → abre dropdown (shadcn Popover, ya instalado).

**Dropdown (320px wide, max-h-96, scroll interno):**
- Header: "Notificaciones" + texto muted del total ("3 sin leer · 8 totales").
- Lista de notificaciones (top 20, ordenadas por `created_at desc`):
  - Icono por tipo en cuadrado 32px (Package para low_stock, Banknote para cash_closing).
  - Título (font-medium, 13px) + body (12px, muted).
  - Timestamp relativo ("hace 2 h", "ayer 18:32").
  - Si no leída: dot cobalt 2px a la izquierda del icono.
  - Hover: bg-muted.
  - Click: marca como leída + navega al `link` (si existe).
- Empty state: icono Bell muted + "Sin notificaciones" + texto muted.
- Footer con border-top: "Marcar todas como leídas" (link cobalt, solo visible si hay no-leídas).

### Lifecycle

1. **Trigger** (cron / server action) llama a `createNotifications()` Server Action.
2. **Insert** en `notifications` con `user_id`, `type`, `title`, `body`, `link`, `metadata`.
3. **Render** en el top-bar via Server Component (lee count unread al render).
4. **Click** en campanita → Popover abre, lista se hidrata client-side.
5. **Click en fila** → Server Action `markAsRead(id)` + `router.push(link)`.
6. **"Marcar todas"** → `markAllAsRead()` Server Action + revalidate.

### Polling vs realtime

**V1 = polling, lazy.**
- Server Component del top-bar lee el count al render (ya pasa en cada navegación).
- Al abrir el dropdown, fetch fresh + actualiza badge.
- Sin SSE, sin WebSocket, sin Supabase Realtime. Ponytail: si la hermana abre la app 3 veces al día, polling al render es suficiente.

**V2 (si hace falta):** Supabase Realtime channel en `notifications WHERE user_id=auth.uid()`. Pero solo si V1 se siente lento.

---

## 3. Modelo de datos

### Migración nueva — `0007_notifications.sql`

```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('low_stock', 'cash_closing', 'system')),
  title text not null,
  body text,
  link text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Most recent first; unread rows surface fast when filtering by user.
create index notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

-- "unread count" query.
create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- RLS
alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications for select
  to authenticated using (user_id = auth.uid());

create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- INSERT/DELETE only via service role (system actions, not user-facing).
-- We deliberately do NOT grant insert to authenticated; the server actions
-- use the service role key for system-triggered notifications.
```

**¿Por qué service-role para inserts?** El trigger del cron corre sin un usuario logueado. La service role bypassea RLS — necesario. Server Actions (`createNotifications`) usan `getSupabaseAdmin()` (el cliente con service role que ya existe en `lib/supabase/admin.ts`).

### Dedup por día

Para evitar spam (si el cron corre 2 veces el mismo día por alguna razón), el trigger hace:
```sql
select id from notifications
  where user_id = $1 and type = $2
    and created_at::date = current_date
  limit 1
```
Si existe → no insert. (Lógica en TS, no en SQL. Mantener reglas de negocio en el código.)

---

## 4. Server Actions

Todas en `src/app/actions/notifications.ts`:

```ts
export type Notification = {
  id: string;
  user_id: string;
  type: "low_stock" | "cash_closing" | "system";
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotificationsAction(): Promise<{
  ok: true;
  unread: number;
  items: Notification[];
}> { ... }

export async function markAsReadAction(id: string): Promise<{ ok: true }> { ... }
export async function markAllAsReadAction(): Promise<{ ok: true; updated: number }> { ... }

// Llamadas por triggers del sistema (usan service role, NO auth.uid()).
export async function createNotificationAction(input: {
  userIds: string[];   // a quién le llega
  type: "low_stock" | "cash_closing" | "system";
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true; created: number }> { ... }
```

`createNotificationAction` corre server-side y usa `getSupabaseAdmin()` (service role). No se expone a clientes directamente — la única ruta para invocarla es desde un cron route o desde una Server Action autorizada.

### Hooks React Query

En `src/lib/query/mutations.ts`:

```ts
export function useMarkAsRead() { ... }
export function useMarkAllAsRead() { ... }
```

`listNotificationsAction` se llama dentro del componente cliente del Popover, no necesita hook (es un fetch puntual).

---

## 5. UI: NotificationBell

### Archivos

- `src/components/nav/notification-bell.tsx` — Server Component shell que lee el count.
- `src/components/nav/notification-popover.tsx` — Client Component que abre el dropdown.
- (Ambos pueden vivir en un solo archivo `notification-bell.tsx` con `'use client'` en el Popover interno.)

### Render server-side

```tsx
// TopBar.tsx — agregar entre ThemeToggle y AccountMenu
const unread = await getUnreadNotificationsCount(supabase, user.id);
<NotificationBell initialUnread={unread} />
```

### Estructura del Bell

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Notificaciones">
      <Bell aria-hidden />
      {unread > 0 && (
        <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-80 p-0">
    {/* Header + list + footer */}
  </PopoverContent>
</Popover>
```

### Render del item

```tsx
<Link
  href={n.link ?? "#"}
  onClick={() => markAsRead(n.id)}
  className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
>
  {n.read_at === null && (
    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />
  )}
  <span className={cn(
    "grid size-8 shrink-0 place-items-center rounded-md",
    n.type === "low_stock" && "bg-warning/15 text-warning",
    n.type === "cash_closing" && "bg-primary/10 text-primary",
    n.type === "system" && "bg-muted text-muted-foreground"
  )}>
    {n.type === "low_stock" && <Package aria-hidden className="size-4" />}
    {n.type === "cash_closing" && <Banknote aria-hidden className="size-4" />}
    {n.type === "system" && <BellRing aria-hidden className="size-4" />}
  </span>
  <div className="flex min-w-0 flex-1 flex-col">
    <p className="text-sm font-medium leading-snug text-foreground">{n.title}</p>
    {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
    <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</p>
  </div>
</Link>
```

### Empty state

```tsx
<div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
  <Bell aria-hidden className="size-8 text-muted-foreground/60" />
  <p className="text-sm font-medium text-foreground">Sin notificaciones</p>
  <p className="text-xs text-muted-foreground">Te avisamos cuando algo requiera tu atención.</p>
</div>
```

---

## 6. Triggers (dónde insertar)

### Low-stock cron (`/api/cron/low-stock-alert`)

Al final del run exitoso (después de enviar email):
- Si `rows.length > 0` y recipients > 0: insert notificación por cada admin.
- Dedup por día: si ya hay `low_stock` hoy para ese user, no insert.
- Title: "**N productos por agotarse**"
- Body: nombres de los primeros 3 productos + "+M más" si > 3.
- Link: `/products`

### Cash-closing cron (nuevo, `/api/cron/cash-closing-reminder`)

- Cron: `0 17 * * *` UTC = 11:00 AM Mexico.
- Query: `cash_closings WHERE date=today AND status='open'`.
- Si existe: insert notificación por cada admin + employee (todos necesitan cerrar).
- Title: "**Caja pendiente de cerrar**"
- Body: "Cierre del ${date} aún sin cerrar."
- Link: `/cash-closing`

### vercel.json — agregar tercer cron

```json
{
  "crons": [
    { "path": "/api/cron/low-stock-alert", "schedule": "0 15 * * *" },
    { "path": "/api/cron/daily-summary", "schedule": "0 3 * * *" },
    { "path": "/api/cron/cash-closing-reminder", "schedule": "0 17 * * *" }
  ]
}
```

Vercel Hobby permite 2 jobs. **3 excede el límite.** Opciones:
- **Upgrade a Pro** ($20/mes). No aplica ($0/mes es invariante).
- **Combinar low-stock + cash-closing-reminder en un solo cron** que verifique ambos. Hace al run un poco más complejo pero ahorra el slot.
- **Mover un cron a GitHub Actions** (gratis para repos públicos, 2000 min/mes para privados). Sencillo, separado del deploy de Vercel.

**Decisión recomendada:** mover `daily-summary` a GitHub Actions (es el más "batch" y no necesita respuesta inmediata). Los otros 2 quedan en Vercel.

Pero esto es scope-creep para V1 de notificaciones. La campanita funciona aunque el cron de cash-closing-reminder no exista (solo no manda la notificación). Si el límite aprieta, ese cron se mueve a GH Actions después.

**Para esta feature, pongo `cash-closing-reminder` como cron y dejo nota en PLAN.md de que excede el límite. Decisión del usuario.**

---

## 7. Hallmark — diseño

### Pre-flight (ya hecho)

- **Font:** Inter vía next/font (sin cambios, ya instalado).
- **Paleta:** tokens de design.md — primary cobalt, destructive red, warning amber, paper cream.
- **Motion:** motion library instalada. Para el bell: dropdown slide-in con FadeUp preset (240ms ease-out cubic).
- **Spacing:** Tailwind 4pt.
- **Framework:** Next 16 + shadcn/ui.

### Decisiones de diseño

1. **Badge color = destructive** (rojo). No es primary (cobalt) porque las notificaciones no leídas son señal de **atención requerida**, no de marca. El design.md reserva cobalt para acciones primarias; el rojo destructivo es para "esto requiere tu atención".

2. **Unread dot = primary (cobalt)** dentro del item. Es el indicador de estado (no de urgencia). Rojo sería demasiado alarmista para algo que puede ser solo informativo.

3. **Icono del item por tipo:** amber/15 + warning fg para low_stock (atención, no urgencia); primary/10 + primary fg para cash_closing (acción requerida); muted para system (informativo).

4. **Empty state honesto:** "Sin notificaciones" + helper text. Sin frases motivacionales forzadas.

5. **Footer "Marcar todas"** solo visible si hay no-leídas. Hidden si el bell está limpio.

6. **Click en item** navega al `link` + marca como leída. **Sin modal de confirmación** — Ponytail: la acción es reversible (puede marcar como no-leída después si lo necesita; V1 no expone esa acción pero la data está).

7. **Timestamps relativos** vía `Intl.RelativeTimeFormat('es-MX')`. Para > 7 días, formato fecha corto.

8. **Mobile:** el Popover de shadcn funciona en mobile pero queda angosto. **V1 = Popover en ambos.** V2 = Sheet (full-screen) en mobile si la queja es real.

### No fabricar contenido

- Empty state: copy honesta, no "¡Estás al día! 🎉".
- Sin "X" personas tienen esto pendiente.
- Sin avatares de "quién" (son notificaciones del sistema, no de personas).

---

## 8. Orden de implementación

1. **Migración** — `0007_notifications.sql` (tabla + RLS + índices).
2. **Schemas zod** — `src/lib/schemas/notifications.ts`.
3. **Server Actions** — `src/app/actions/notifications.ts` (list, markAsRead, markAllAsRead, create).
4. **Hooks React Query** — `src/lib/query/mutations.ts` (useMarkAsRead, useMarkAllAsRead).
5. **NotificationBell** — `src/components/nav/notification-bell.tsx` (Server shell + Client popover).
6. **TopBar integration** — agregar entre ThemeToggle y AccountMenu.
7. **Hook low-stock cron** — al final del run, llamar `createNotifications(...)` con dedup.
8. **Hook cash-closing cron** (decidir si este commit va o no, ver §6).
9. **Smoke test manual** — crear un producto con stock bajo threshold → esperar cron o forzar → ver campanita.

---

## 9. Tradeoffs / out of scope

### Out of scope (V1)

- **Realtime** (Supabase Realtime channel). Polling al render es suficiente.
- **Push notifications** (web/mobile). Out.
- **Email per notificación** in-app. Email sigue siendo solo para resumen diario + stock bajo (programados).
- **Notification preferences** (mute por tipo). Todos ven todo por ahora.
- **Per-row notifications** (uno por producto crítico). Una sola notificación agrupada por día.
- **Auto-archive** después de N días. Manual (la tabla crece pero es barata).
- **Mobile sheet**. Popover funciona; iteramos si la queja es real.
- **Notificaciones de empleados para stock bajo.** Solo admin lo recibe (decisión existente).

### Decisiones tomadas

- **Service-role para inserts del sistema.** Necesario porque el cron corre sin usuario. Ya existe `getSupabaseAdmin()`.
- **Dedup por día** en TS, no SQL. Mantiene las reglas de negocio en código.
- **`link` opcional.** Notifications sin link no navegan (solo marca como leída).
- **`metadata` jsonb** para flexibilidad futura (ej. `product_ids: []` para drill-down).
- **Sin paginación en V1.** Cap de 20 items en el dropdown. Si llega a más, "Ver todas" → full page (futuro).

### Riesgos

- **Vercel Hobby 2-cron limit.** Ya en 2/2. El cron de cash-closing-reminder excede. Solución: mover daily-summary a GH Actions. **Acción:** dejar nota en PLAN.md, implementar solo si user confirma.
- **Rendimiento del badge query.** Index `WHERE read_at IS NULL` por user. Pequeño. Sin riesgo.
- **Crecimiento de la tabla.** Sin TTL. A ~3 notif/día × 365 = 1000 filas/usuario/año. Trivial.

---

## 10. Validación

- [ ] Migración aplica sin errores.
- [ ] Insert manual via SQL funciona con RLS denegando al usuario.
- [ ] List action devuelve solo del propio user.
- [ ] markAsRead solo afecta al propio user.
- [ ] Bell renderiza count correcto al cargar dashboard, products, etc.
- [ ] Dropdown abre y muestra items en orden correcto.
- [ ] Click en item marca como leída + navega.
- [ ] "Marcar todas" limpia el badge.
- [ ] Empty state visible cuando no hay notifs.
- [ ] No notifs duplicadas el mismo día (low_stock dedup).
- [ ] Cash-closing reminder solo si status='open' (cuando se implemente ese cron).
- [ ] Mobile: Popover no se rompe a 375px.

---

## 11. Resumen de archivos

**Nuevos:**
- `supabase/migrations/0007_notifications.sql`
- `src/lib/schemas/notifications.ts`
- `src/app/actions/notifications.ts`
- `src/components/nav/notification-bell.tsx`
- `docs/notifications.md` (este archivo)

**Modificados:**
- `src/components/nav/top-bar.tsx` — agregar NotificationBell.
- `src/lib/query/mutations.ts` — agregar hooks.
- `src/app/api/cron/low-stock-alert/route.ts` — llamar `createNotifications(...)` al final.
- `vercel.json` — agregar cron de cash-closing-reminder (si se aprueba).

**Opcionales (si excede el límite de Vercel):**
- `.github/workflows/daily-summary.yml` — mover cron ahí.

---

## 12. Próximo paso

Sign-off del usuario en este plan. Después → implementación en el orden de §8.
