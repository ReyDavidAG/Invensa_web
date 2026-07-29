# PLAN — Invensa_web

> Bitácora viva del proyecto. Se actualiza en cada cambio relevante.
>
> **Última actualización:** 2026-07-29 · Fases 14-17 completas (cierre de caja + cron stock bajo + cron resumen + email vía Gmail SMTP)
>
> **Lee `CONTEXT.md` antes de tocar el proyecto.** Contiene las invariantes de negocio (tienda única, $0 recurrentes, mobile-first, fotos a R2, sin Auth0, etc.).

---

## 1. Qué estamos construyendo

Sistema de **inventario + ventas + reportes** para la tienda de una persona (la hermana del dueño del repo). La tienda vende productos de limpieza y refacciones para moto. **Dos personas** operan el sistema: la dueña de la tienda (admin) y su mamá (employee). El sistema es operada **completamente desde el navegador**, sin instalar nada en la máquina de la tienda, **multi-dispositivo** (laptop y teléfono), **$0 mensuales**.

### Personas usuarias

| Persona | Rol | Permisos |
| --- | --- | --- |
| Hermana | `admin` | CRUD completo en todos los módulos + gestión de usuarios |
| Mamá | `employee` | Registrar ventas, ver productos y clientes, **no** borrar ni cambiar precios |

> Si en el futuro la dueña abre una segunda tienda, ese día se introduce `stores` y se separa el modelo. Hoy una tienda = dos usuarias.

---

## 2. Decisiones técnicas (no se reabren sin razón)

| Capa | Tecnología | Razón |
| --- | --- | --- |
| Frontend + servidor | **Next.js 16** (App Router) + TypeScript | Última estable; el AGENTS.md de dd-send advierte de breaking changes — revisar `node_modules/next/dist/docs/` antes de código nuevo |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** | Componentes copy-paste, accesibles, temática por CSS vars |
| Lógica de servidor | **Server Actions** + **Route Handlers** (`/api`) | Sin backend separado, sin Express |
| Animaciones | **motion** (motion.dev) | Atractivas pero con disciplina `prefers-reduced-motion` |
| Formularios | **react-hook-form** + **zod** + `@hookform/resolvers` | Schemas tipados, errores por campo, componentes controlados |
| Íconos | **lucide-react** | Cobertura completa, liviano |
| Toasts | **sonner** | Estilo shadcn-friendly |
| Dates | **react-day-picker** + **date-fns** | Locale es-MX, sin momentjs |
| Tema | **next-themes** | Dark/light automático |
| BD / Auth / Realtime | **Supabase** (Postgres + Auth + RLS) | Auth gratis incluyendo Google OAuth; RLS = seguridad real |
| Storage de imágenes | **Cloudflare R2** (10 GB gratis, **0 egress**) | Supabase Storage cobra bandwidth; R2 no |
| Email transaccional | **Resend** (gratis hasta 100 emails/día) | Plantillas HTML; invitación inicial + reset password |
| Hosting | **Vercel** (Hobby) | Deploy desde GitHub, preview por branch |
| Pagos (futuro) | **Mercado Pago Checkout Pro** + webhook | Ya probado en dd-send; integrable idéntico |
| Estado de URL | **useSearchParams** + **useRouter** | Estado en URL para filtros, paginación, deep-linking |

**Lo que NO usamos:** Auth0 (paywall en OAuth), tRPC (overkill), Prisma (Supabase + SQL directo es más simple), Tailwind UI de pago, cualquier servicio con costo mensual recurrente.

---

## 3. Estructura de carpetas (objetivo)

```
Invensa_web/
├── .env.local.example        # estructura de secrets (placeholders)
├── .env.local                # privado, no se commitea
├── .gitignore                # secrets + node_modules + .next
├── PLAN.md                   # este archivo (bitácora)
├── design.md                 # sistema de diseño (Hallmark, cuando se estabilice)
├── README.md                 # quickstart dev
├── package.json
├── next.config.ts
├── tsconfig.json
├── middleware.ts             # refresh de sesión Supabase
├── supabase/
│   ├── config.toml           # CLI config
│   ├── migrations/           # SQL versionado
│   │   ├── 0001_init.sql     # profiles + role
│   │   ├── 0002_products.sql
│   │   ├── 0003_sales.sql
│   │   ├── 0004_customers.sql
│   │   └── 0005_rls.sql      # todas las policies
│   └── seed.sql              # categorías iniciales
├── public/
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                       # redirige a /dashboard o /login
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   ├── reset-password/page.tsx
    │   │   └── confirm/page.tsx           # llega desde email
    │   ├── (app)/
    │   │   ├── layout.tsx                 # shell con sidebar/topbar
    │   │   ├── dashboard/page.tsx         # vista del día
    │   │   ├── products/
    │   │   │   ├── page.tsx               # lista (useSearchParams para filtros)
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── sales/
    │   │   │   ├── page.tsx               # lista
    │   │   │   └── new/page.tsx           # POS-like
    │   │   ├── customers/
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/page.tsx          # perfil + historial + fiados
    │   │   └── reports/
    │   │       ├── page.tsx               # índice
    │   │       ├── sales/page.tsx
    │   │       ├── stock/page.tsx
    │   │       └── top-products/page.tsx
    │   ├── actions/                       # Server Actions tipados
    │   │   ├── auth.ts
    │   │   ├── products.ts
    │   │   ├── sales.ts
    │   │   ├── customers.ts
    │   │   └── storage.ts                 # presigned URLs a R2
    │   └── api/
    │       └── health/route.ts
    ├── components/
    │   ├── ui/                            # los que vienen de shadcn
    │   ├── form/                          # wrappers controlados
    │   │   ├── input-form-field.tsx
    │   │   ├── select-form-field.tsx
    │   │   ├── textarea-form-field.tsx
    │   │   ├── checkbox-form-field.tsx
    │   │   ├── date-form-field.tsx
    │   │   └── form-message.tsx
    │   ├── nav/
    │   │   ├── side-nav.tsx
    │   │   └── top-bar.tsx
    │   └── empty-state.tsx                # reusado
    ├── lib/
    │   ├── supabase/
    │   │   ├── server.ts                  # cliente servidor (cookies)
    │   │   ├── client.ts                  # cliente navegador (anon)
    │   │   └── admin.ts                   # service-role (server-only, verificado)
    │   ├── r2/
    │   │   └── presign.ts                 # presigned URLs para upload cliente→R2
    │   ├── motion/
    │   │   └── presets.ts                 # easing + duración por tipo
    │   ├── schemas/                       # zod schemas reusables
    │   │   ├── product.ts
    │   │   ├── sale.ts
    │   │   ├── customer.ts
    │   │   └── auth.ts
    │   ├── errors.ts                      # mapeo Supabase errors → español
    │   ├── problem.ts                     # helper RFC 7807 Problem Details
    │   ├── format.ts                      # currency, dates es-MX
    │   └── env.ts                         # validación zod de env al arrancar
    ├── types/
    │   └── database.ts                    # tipos generados desde Supabase
    └── styles/
        └── globals.css                    # theme tokens (derivados de design.md)
```

### Reglas de dónde vive cada lógica

- **Cliente (componentes):** UI, validación con zod vía react-hook-form, preview de imágenes, animaciones motion.
- **Server Actions:** CRUD, validaciones de negocio, writes a Supabase (anon key limitada por RLS).
- **Route Handlers (`/api`):** webhooks (Mercado Pago cuando se active), upload directo a R2 si se decide no presigned.
- **Service-role key** (`SUPABASE_SERVICE_ROLE_KEY`): SOLO en `lib/supabase/admin.ts`, **nunca** al cliente. Usado para: invitaciones, jobs internos, cálculos que saltan RLS.

---

## 4. Seguridad — defense in depth (no se negocia)

| Capa | Implementación |
| --- | --- |
| **HTTPS** | Vercel lo fuerza; cookies `Secure` |
| **Auth** | Supabase Auth: email+contraseña + Google OAuth (gratis) + TOTP opcional para admin |
| **Validación input** | zod en Server Actions + zod resolver en react-hook-form |
| **Autorización real** | **Postgres RLS** keyed on `auth.uid()` y role |
| **Rate limiting** | Supabase built-in por IP/usuario |
| **Audit log** | Tabla `audit_log` con triggers |
| **XSS** | React escapa por defecto; nada de `dangerouslySetInnerHTML` sin sanitizar |
| **CSRF** | Server Actions validados por Next.js (origin header check) |
| **Secrets** | Vercel env vars + `.env.local` (gitignored); service-role key jamás al bundle del cliente |
| **Imagen** | Subida por presigned URL directo a R2 (no pasa por Next) |

> Si mañana un atacante borra el frontend entero, **la BD sigue rechazando operaciones no autorizadas**. Esa es la prueba de que la seguridad vive en RLS, no en Zod.

---

## 5. Fases de implementación

| # | Fase | Estado |
| --- | --- | --- |
| 1 | Bootstrap: `.gitignore`, `PLAN.md`, `.env.local.example`, README | ✅ Hecho |
| 2 | Scaffold Next 16 + shadcn + base-nova preset + Geist fonts | ✅ Hecho |
| 3 | `design.md` (Hallmark) + tokens (color, tipografía, motion) | 🟡 En curso |
| 4 | `lib/supabase/{server,client,admin}.ts` + `lib/env.ts` (zod) + middleware | ✅ Hecho |
| 5 | Layout shell (side-nav + top-bar + theme toggle) | ✅ Hecho |
| 6 | Auth UI completa (login / register / forgot / reset / confirm) + Server Actions | ✅ Hecho |
| 7 | Migration 0001-0005: profiles + products + sales + customers + RLS + seed | ✅ Hecho |
| 8 | Módulo productos (CRUD completo — lista + alta + detalle + edición) | ✅ Hecho |
| 9 | Módulo ventas (POS-like + lista + recibo) | ✅ Hecho |
| 10 | Módulo clientes (lista + alta + detalle + edición + archivo) | ✅ Hecho |
| 11 | Reportes (cortes + chart + top productos + stock bajo + top clientes + métodos) | ✅ Hecho |
| 12 | Deploy a Vercel + env vars + verificación | Pendiente |
| 13 | Pruebas con hermana + mamá | Pendiente |
| 14 | **Cierre de caja** (`cash_closings` + UI `/cash-closing`) | ✅ Hecho |
| 15 | **Alerta stock bajo proactiva** (cron + Resend) | ✅ Hecho |
| 16 | **Email diario de resumen** (cron + email) | ✅ Hecho |
| 17 | **Email backend = Gmail SMTP** (sin Resend, sin dominio) | ✅ Hecho |

### Stack realmente instalado (versiones verificadas)

```json
{
  "next": "16.2.12",
  "react": "19.2.4",
  "tailwindcss": "^4.3.3",
  "shadcn": "^4.16.0",      // preset "base-nova" (geist font + base-ui primitives)
  "@supabase/ssr": "^0.12.4",
  "@supabase/supabase-js": "^2.111.0",
  "react-hook-form": "^7.83.0",
  "zod": "^4.4.3",
  "@hookform/resolvers": "^5.5.7",
  "motion": "^12.43.0",      // motion.dev (no Framer Motion)
  "react-day-picker": "^10.0.1",
  "date-fns": "^4.4.0",
  "lucide-react": "^1.27.0",
  "sonner": "^2.0.7",
  "next-themes": "^0.4.6"
}
```

shadcn components instalados: button, input, label, form, select, textarea, checkbox, card, dialog, dropdown-menu, sheet, sidebar, table, tabs, badge, avatar, skeleton, sonner, tooltip, popover, calendar, scroll-area, separator.

---

## 6. Convenciones de código

- **TypeScript estricto** (`strict: true`).
- **Comentarios solo cuando aportan** y **siempre en inglés**, cortos (≤ una línea).
- **Sin emojis** en código ni en UI.
- **Sin fabricated metrics** ("trusted by 10k teams", "+47% ventas", etc.). Si la hermana quiere ver gráficas con datos, son datos reales.
- **Errores visibles**: toast en español + problema JSON en API (RFC 7807).
- **Sin Tailwind class strings largas inline**; componentes shadcn + tokens por CSS vars (definidos en `globals.css` desde `design.md`).
- **Nombrado**: `kebab-case` para archivos, `PascalCase` para componentes, `camelCase` para variables/funciones.
- **No `any`**, no `as unknown as` salvo justificación documentada.
- **Sin imports relativos profundos** (`../../../`) — usar alias `@/`.

---

## 7. Decisiones del modelo de datos (fase 7, 2026-07-28)

| Decisión | Default elegido | Por qué |
|---|---|---|
| Stock | **Derivado** vía vista `vw_product_stock` (SUM de `inventory_movements`) | Preserva auditoría. Sin triggers de sincronización. Sin riesgo de desincronización. Si el rendimiento duele, se materializa en fase futura. |
| Fiado parcial | **Sí.** `sales.paid_amount` permite abonos | La hermana registra abonos en fiados. `vw_client_balances` deriva la deuda. |
| Categorías | **Tabla aparte `categories`** (no en `units`) | Limpieza ≠ PZA. Una unidad se reutiliza entre categorías. |
| Imágenes | Solo `products.image_url` (texto), R2 maneja el resto | Cero metadata en BD. R2 ya tiene el objeto. |
| Identificador fiscal (RFC) | **NO** | Tienda de barrio, no B2B. Si en el futuro se requiere, se agrega migración. |
| Multi-tienda | **NO** | Una tienda = dos usuarias. Si se abre 2da tienda, ese día se introduce `stores`. |
| Multi-moneda | **NO** | Siempre MXN. `numeric(12,2)` directo. |
| Auth signup | **OFF** en Supabase Auth | La hermana crea la primera cuenta, luego invita por panel admin con `supabase.auth.admin.inviteUserByEmail()`. |
| Enable confirm email | **OFF** | Sin plantilla HTML de correo todavía. ON cuando se implemente Resend. |
| Contraseña mínima | 8 caracteres | Matches zod regex en `lib/schemas/auth.ts`. |

## 8. Próximo paso inmediato

**Módulo productos (fase 8).** Lista + alta + edición con upload de imagen a Cloudflare R2 vía presigned URLs. Página `/products` con filtros (categoría + búsqueda), tabla con SKU/Nombre/Stock/Precio, y botón `+ Nuevo`. Página `/products/new` con form + dropzone de imagen.

Antes de empezar la UI de productos, **corre el bootstrap admin** (`pnpm bootstrap:admin <email> <password>`) para poder loguearte y probar el dashboard.

## 9. Lo que ya está hecho en fase 8 (productos)

- `src/app/(app)/products/page.tsx` — server component con searchParams `?q` `?cat` `?sort` `?dir` `?page`. Lista filtrable + ordenable + paginada. Empty-states honestos. `+ Nuevo` solo si admin.
- `src/app/(app)/products/products-search.tsx` — client component con debounce 250ms que empuja `q` al URL via `router.replace`.
- `src/app/(app)/products/products-filter-chip.tsx` — chip URL-driven (categoría activa en coral).
- `src/app/(app)/products/products-sortable-th.tsx` — TH clickable con toggle asc/desc + ícono de dirección.
- `src/app/(app)/products/products-pagination.tsx` — paginación windowed ±2 con prev/next.
- `src/app/(app)/products/new/page.tsx` + `products-form.tsx` — alta con RHF + zod + useActionState. Imagen = placeholder (R2 dropzone en fase futura).
- `src/app/(app)/products/[id]/page.tsx` — detalle con imagen + categorías/unidad + stock (color warning si ≤5) + últimos 20 inventory_movements. Botones Editar/Archivar solo si admin.
- `src/app/(app)/products/[id]/edit/page.tsx` + `products-edit-form.tsx` — edición con RHF pre-rellenado, `updateProductAction.bind(null, id)`.
- `src/lib/schemas/products.ts` — `productCreateSchema`, `productUpdateSchema` (zod 4), tipos input/output separados.
- `src/app/actions/products.ts` — Server Actions: `createProductAction`, `updateProductAction(id, ...)`, `archiveProductAction`. Verifica admin server-side, mapea error 23505 a "código duplicado", redirige con `revalidatePath`.

Pendiente: imagen upload a Cloudflare R2 via presigned URLs (placeholder visual ya en su lugar).

## 10. Lo que ya está hecho en fase 5

- `src/app/(app)/layout.tsx` — SidebarProvider + SideNav + SidebarInset + TopBar + main con paddings responsivos.
- `src/components/nav/side-nav.tsx` — client component con 5 items primarios + Cuenta, active state con 2px coral border-left + coral text, colapsa a iconos en lg.
- `src/components/nav/top-bar.tsx` — server component que hace fetch del user + profile (full_name) y renderiza SidebarTrigger + Breadcrumb + PageTitle + ThemeToggle + AccountMenu.
- `src/components/nav/page-title.tsx` — client component que deriva título + breadcrumb del pathname con un PATH_MAP estático.
- `src/components/nav/theme-toggle.tsx` — client component con `useTheme` de next-themes (light/dark con ícono sol/luna).
- `src/components/nav/account-menu.tsx` — client component con DropdownMenu (avatar con iniciales + nombre + email + sign-out).
- `src/app/(app)/dashboard/page.tsx` — reemplazado el stub con dashboard real: 4 stat tiles (Ventas hoy, Ticket promedio, Stock bajo, Fiados pendientes) + lista de ventas recientes + acciones rápidas. Queries reales (no fake) con empty-states honestos ("—" con « datos reales cuando se registren ventas »).

## 11. Próximas fases planeadas (2026-07-29)

Tres mejoras que la dueña necesita ya. Sin fiado (la tienda no fía — confirmado). Sin caducidad (no venden comida, son productos de limpieza y refacciones para moto).

### Fase 14 — Cierre de caja (`cash_closings`)

**Por qué:** la hermana cierra la tienda sin saber si la caja cuadra. Hoy no hay forma de comparar lo que el sistema dice que entró contra lo que realmente hay en el cajón. Sin este dato no sabe si le falta dinero o si la app tiene un bug.

**Tabla nueva:**
- `cash_closings(id, date UNIQUE, opened_at, closed_at, expected_cash, counted_cash, diff GENERATED, notes, closed_by, status)` — una fila por día. `expected_cash` se calcula de `sales.paid_amount - sales.change_given` del día (es server-derived, no input).

**Cálculo del expected_cash:**
- Sum de ventas pagadas en efectivo del día, **menos** el cambio/devolución que se dio.
- Hoy la columna `sales.change_given` no existe. Se agrega en esta misma migración.

**UI:**
- `/cash-closing` — page con el cierre del día. Si `status=open`: input "¿cuánto hay en caja?" + notas → submit. Si `status=closed`: lectura con `expected`, `counted`, `diff` destacados (verde si 0, ámbar si ±$5, rojo si más).
- `side-nav.tsx` — nuevo item "Cierre de caja" entre Reportes y Cuenta.
- `dashboard/page.tsx` — widget "Cierre de hoy" con badge (pendiente / cerrado / descuadre).

**Server Actions:** `openCashSessionAction` (auto al primer GET del día), `closeCashAction`, `getTodayClosingAction` (lectura).

**RLS:**
- admin: SELECT, UPDATE, DELETE.
- employee: SELECT, INSERT, UPDATE (la caja la cierra quien esté en turno; no se borra).

**Esfuerzo:** 2 días.

### Fase 15 — Alerta de stock bajo proactiva

**Por qué:** `products.stock_low_threshold` y `vw_product_stock` ya existen. La hermana entra al sistema solo cuando ya se quedó sin producto. Necesita que el sistema le avise.

**Infraestructura:**
- Cron diario **9:00 AM America/Mexico_City** → `GET /api/cron/low-stock-alert`.
- Query: productos `status=active` con `stock_on_hand <= stock_low_threshold` y `stock_low_threshold > 0`.
- Email via Resend con tabla de productos críticos (nombre, SKU, stock actual, threshold).
- Botón manual en `/dashboard` (admin only) para disparar el envío inmediato sin esperar al cron.

**Esfuerzo:** 1 día. Reusa Resend y la vista existente.

### Fase 16 — Email diario de resumen

**Por qué:** hermana y mamá no abren el dashboard a diario. Reciben un email a las 9pm con el cierre del día para saber cómo les fue sin tener que entrar.

**Contenido del email:**
- Total vendido hoy (MXN) + count de ventas.
- Comparación con ayer (% cambio).
- Top 3 productos del día.
- Estado del cierre de caja (cerrado / pendiente / descuadre).

**Infraestructura:**
- Cron diario **9:00 PM America/Mexico_City** → `GET /api/cron/daily-summary`.
- Misma estructura de email que #15, distinto query.

**Esfuerzo:** 0.5 día. Comparte infra con #15.

### Cron jobs en Vercel

Vercel Hobby permite 2 cron jobs por proyecto. Uso exacto:

| Cron path | Hora MX | Hora UTC | Fase |
|---|---|---|---|
| `/api/cron/low-stock-alert` | 09:00 | 15:00 | 15 |
| `/api/cron/daily-summary` | 21:00 | 03:00 | 16 |

Definidos en `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/low-stock-alert", "schedule": "0 15 * * *" },
    { "path": "/api/cron/daily-summary", "schedule": "0 3 * * *" }
  ]
}
```

> **Timezone:** México CST (UTC-6) sin DST en la práctica para nuestro uso (no nos importa el cambio de horario). Si quisiéramos_DST-aware, usamos `vercel.json` con tz + librería tz-aware en el server. Por ahora: offsets fijos.

### Email: Resend

Ya tenemos `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en env. Solo falta:
- Instalar `resend` (npm).
- Wrapper en `src/lib/email/send.ts` (server-only).
- Templates en `src/lib/email/templates/*.ts` — **HTML inline con tablas**, sin React Email.

**Por qué no React Email:** una dependencia más para emails que se ven en clientes de correo (que ignoran CSS). HTML inline con tablas es feo pero funciona en Gmail/Outlook y mantiene el bundle limpio. Se introduce React Email solo si el HTML se vuelve inmanejable.

### Decisiones que se reabren

| Decisión | Default | Razón |
|---|---|---|
| Cron hosting | **Vercel Cron** (Hobby, 2 jobs) | $0, suficiente. Si necesitamos >2 jobs, se mueve a GitHub Actions. |
| Email HTML | **Inline tables**, sin React Email | Ponytail. Bundle limpio, compatibilidad probada. |
| Cash closings: ¿una o múltiples sesiones por día? | **Una por día** (`date UNIQUE`) | YAGNI. Si hay corte de turno mañana/tarde, se introduce `cash_session` después. |
| Recipient del daily summary | **Todos los admin + employee** activos | Sin UI de preferencias todavía. Si la mamá no quiere recibirlo, se filtra por `notification_prefs` después. |
| Recipient del low-stock alert | **Solo admin** | La hermana toma decisiones de compra, la mamá solo registra ventas. |

### Esquema de base de datos — diff

```sql
-- 0006_cash_closings.sql

-- 1. Nueva columna en sales: cambio que se dio al cliente
alter table public.sales
  add column if not exists change_given numeric(12,2) not null default 0
  check (change_given >= 0);

-- 2. Tabla cash_closings
create table if not exists public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  expected_cash numeric(12,2) not null default 0,
  counted_cash numeric(12,2) check (counted_cash is null or counted_cash >= 0),
  diff numeric(12,2) generated always as (
    coalesce(counted_cash, 0) - expected_cash
  ) stored,
  notes text,
  closed_by uuid references public.profiles(id),
  status text not null default 'open' check (status in ('open', 'closed'))
);

create index cash_closings_date_idx on public.cash_closings(date desc);

-- 3. RLS
alter table public.cash_closings enable row level security;

create policy cash_closings_select_authenticated
  on public.cash_closings for select
  to authenticated using (true);

create policy cash_closings_insert_authenticated
  on public.cash_closings for insert
  to authenticated with check (true);

create policy cash_closings_update_authenticated
  on public.cash_closings for update
  to authenticated using (true);

create policy cash_closings_delete_admin
  on public.cash_closings for delete
  to authenticated using (public.current_user_role() = 'admin');

-- 4. Helper view: ventas en efectivo del día (para expected_cash)
create or replace view public.vw_cash_sales_today as
select
  date_trunc('day', s.date_at at time zone 'America/Mexico_City')::date as sale_date,
  sum(s.paid_amount - s.change_given) as net_cash
from public.sales s
where s.status = 'paid'
  and s.payment_method = 'cash'
group by 1;
```

## 12. Lo que ya está hecho en fase 14 (cierre de caja)

- `supabase/migrations/0006_cash_closings.sql` — `sales.change_given` (cambio devuelto al cliente), tabla `cash_closings` con `diff` como columna generada, RLS (admin borra, ambos roles insertan/actualizan), vista `vw_cash_sales_by_day` (net cash por día local).
- `src/lib/schemas/cash-closing.ts` — `cashClosingCloseSchema` + tipos.
- `src/app/actions/cash-closing.ts` — `getTodayCashClosingAction` (auto-open en primer GET), `closeCashAction` (recomputa expected al cerrar).
- `src/app/(app)/cash-closing/page.tsx` + `cash-closing-client.tsx` — server component + client con RHF/zod. Banner de estado (verde/ámbar/rojo según diff), 2 stat tiles (esperado/contado), form para cerrar, lectura cuando ya cerrado. Diff tones: success si 0, warning si ±$5, destructive más allá.
- `src/app/api/cash-closing/today/route.ts` — GET para polling live del expected (cada 30s mientras está abierto).
- `src/components/nav/side-nav.tsx` — item "Cierre de caja" entre Clientes y Reportes (ícono Banknote).
- `src/app/(app)/dashboard/page.tsx` — widget "Cierre de caja del día" con badge de estado. Link a `/cash-closing`.
- `src/app/actions/sales.ts` — server calcula `change_given = max(0, paidAmount - total)` para ventas en efectivo paid.
- `src/app/(app)/sales/new/pos-client.tsx` — POS ahora envía `paidAmount` real (lo que recibió), no `total`. Server deriva `change_given` y `paid_amount = total`.
- `src/lib/query/mutations.ts` — hook `useCloseCash`.

→ Mover la migración a Supabase: `pnpm exec supabase db push` (cuando estés listo).

## 13. Próximo paso inmediato

**Fase 17: deploy + verificación end-to-end.** Aplicar migración 0006 a Supabase, configurar `CRON_SECRET` + verificar `RESEND_API_KEY` + `RESEND_FROM_EMAIL` en Vercel, probar el cron manualmente con `curl -H "Authorization: Bearer $CRON_SECRET" https://<deploy>/api/cron/low-stock-alert`. Confirmar email llega. Repetir con `/api/cron/daily-summary`.

## 14. Lo que ya está hecho en fase 15 (alerta stock bajo)

- `resend` npm package añadido.
- `src/lib/email/send.ts` — wrapper `sendEmail()` server-only, singleton del cliente Resend, lee `RESEND_API_KEY` y `RESEND_FROM_EMAIL` de env.
- `src/lib/email/templates/low-stock-alert.ts` — HTML inline con tabla de productos críticos (SKU, nombre, stock, umbral). Texto plano como fallback.
- `src/lib/email/recipients.ts` — helper `getRecipients(['admin'])` que query `profiles` filtrando por role.
- `src/app/api/cron/low-stock-alert/route.ts` — GET con auth `Bearer $CRON_SECRET`. Query `vw_product_stock` + `products` filtrando `stock_on_hand <= stock_low_threshold AND threshold > 0`. Si no hay filas, 200 OK sin enviar (Vercel no reintenta). Solo recipients = admin.
- `vercel.json` — cron `0 15 * * *` (9 AM Mexico, UTC-6 sin DST).
- `src/app/actions/alerts.ts` — `sendLowStockAlertAction()` admin-only (mismo query que el cron, para trigger manual).
- `src/lib/query/mutations.ts` — `useSendLowStockAlert()` hook.
- `src/app/(app)/dashboard/low-stock-alert-trigger.tsx` — card client con botón "Enviar ahora", solo visible si `profile.role === 'admin'`. Muestra conteo actual de críticos.

## 15. Lo que ya está hecho en fase 16 (resumen diario)

- `src/lib/email/templates/daily-summary.ts` — HTML con: ventas hoy (count + total + delta % vs ayer, color verde/rojo), top 3 productos, estado del cierre de caja (color por status + diff).
- `src/app/api/cron/daily-summary/route.ts` — GET con mismo auth. Query paralela: ventas hoy, ventas ayer, sale_items de hoy, cash_closing del día. Calcula delta %, agrega top productos, recipients = admin + employee.
- `vercel.json` — cron `0 3 * * *` (9 PM Mexico). Total: 2 jobs dentro del límite Hobby.
- El cierre de caja UI creado en fase 14 provee el `diff` que este email muestra (sin acoplamiento directo: el cron solo lee la tabla).

## 16. Operativa post-deploy (todos)

Variables en Vercel que se deben configurar:
- `GMAIL_USER` — la dirección Gmail que manda los correos.
- `GMAIL_APP_PASSWORD` — contraseña de aplicación de 16 chars (Google → Cuenta → Seguridad → 2FA activado → Contraseñas de aplicación).
- `EMAIL_FROM` — opcional. Default = `GMAIL_USER`. Formato: `Invensa <invensa.tu@gmail.com>`.
- `CRON_SECRET` — generar con `openssl rand -hex 32`, pegarlo en Vercel env. Vercel lo manda en `Authorization: Bearer …` automáticamente a los cron paths.
- `SUPABASE_SERVICE_ROLE_KEY` — ya estaba; se usa solo si en el futuro se decide ejecutar el cron como SQL directo desde Postgres en lugar de un GET HTTP.

→ Cuando despliegues, el primer email de las 9am y el de las 9pm saldrán automáticamente. Si quieres probar antes sin esperar, el botón "Enviar ahora" del dashboard dispara el mismo flujo.

## 17. Decisión de fase 17 — Gmail SMTP en lugar de Resend

**Por qué se cambió:** Resend exige dominio propio para producción. Comprar dominio = ~$10-15 USD/año. Gmail SMTP vía nodemailer = $0, sin dominio, 500 emails/día (Invensa usa ~2/día = 0.4% del límite). Setup: 5 minutos (crear contraseña de app en Google).

**Trade-offs:**
- Remitente aparece como tu Gmail personal, no como `noreply@invensa.app`. Menos "profesional" pero funcional.
- A veces cae en "Promociones" si el destinatario no tiene guardado el contacto. Mitigación: la hermana y la mamá usan el mismo sistema que manda, así que con un email de "warm-up" se arregla.
- Riesgo de seguridad: la contraseña de app da acceso completo al Gmail. Guardar solo en Vercel + `.env.local` (gitignored), nunca en código.

**Si en el futuro quieres dominio propio** (ej. cuando Invensa crezca): el cambio es trivial. `sendEmail()` es el único punto que toca SMTP. Reemplazar `nodemailer.createTransport({ service: 'gmail', ... })` por `nodemailer.createTransport({ host: 'smtp.resend.com', ... })` o el provider que sea. Los templates no cambian.

## 18. Lo que ya está hecho en fase 17

- `pnpm remove resend` + `pnpm add nodemailer` + `@types/nodemailer`.
- `src/lib/email/send.ts` — reescrito: transporter Gmail SMTP singleton, lee `GMAIL_USER` + `GMAIL_APP_PASSWORD` + opcional `EMAIL_FROM`.
- `src/lib/env.ts` — schema actualizado: removidas `RESEND_*`, agregadas `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM`.
- `.env.local.example` — sección Email reescrita con instrucciones para contraseña de app de Google.
- `.env.local` — actualizadas variables nuevas (GMAIL_USER + GMAIL_APP_PASSWORD + EMAIL_FROM + CRON_SECRET generado).

## 19. Deploy end-to-end (orden exacto)

### A. Antes del deploy — generar secrets locales

```bash
# 1) Generar CRON_SECRET (si no tienes uno ya). 32 bytes hex = 64 chars.
openssl rand -hex 32
# Output: e0e00c97cbf3ca313452151305f22a6aedc45d07909e48d963b6fc2e2a45d851
# → pegar en .env.local:  CRON_SECRET="<ese-valor>"
```

**Contraseña de app de Gmail** (solo se hace una vez):
1. Abrir la cuenta Gmail que va a ser el remitente.
2. Ir a https://myaccount.google.com/security
3. Verificar que **2-Step Verification** está ON (si no, activarlo primero).
4. Ir a https://myaccount.google.com/apppasswords
5. App name = "Invensa" → Generate.
6. Te muestra 16 chars tipo `abcd efgh ijkl mnop`. **Copiarlos YA** porque no se vuelven a mostrar.
7. En `.env.local`:
   ```
   GMAIL_USER="tugmail@gmail.com"
   GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
   EMAIL_FROM="Invensa <tugmail@gmail.com>"
   CRON_SECRET="<el-valor-de-openssl>"
   ```

### B. Aplicar migración nueva (cierre de caja)

```bash
# Una vez (linkea el proyecto a tu Supabase la primera vez):
pnpm exec supabase link --project-ref lyvypclifdweyoujgyzd

# Aplicar 0006 (cierre de caja):
pnpm exec supabase db push
# O específico:
pnpm exec supabase migration up
```

Verifica en el dashboard de Supabase → Table Editor → `cash_closings` debe existir con columnas `id, date, opened_at, closed_at, expected_cash, counted_cash, diff, notes, closed_by, status`.

### C. Configurar Vercel

1. **Ir a**: https://vercel.com → tu proyecto → Settings → Environment Variables.
2. **Agregar** (Production + Preview + Development):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://lyvypclifdweyoujgyzd.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (mismo que en .env.local)
   - `SUPABASE_SERVICE_ROLE_KEY` = (mismo)
   - `NEXT_PUBLIC_SITE_URL` = tu dominio final (ej. `https://invensa.vercel.app`)
   - `NEXT_PUBLIC_LOCALE` = `es-MX`
   - `NEXT_PUBLIC_R2_PUBLIC_URL` = `https://pub-bd19f9f5ece04ec7833dcfec7461a913.r2.dev`
   - `R2_ACCOUNT_ID` = `af1ba039dbed5e7e82379b1ad4e677b1`
   - `R2_ACCESS_KEY_ID` = (mismo)
   - `R2_SECRET_ACCESS_KEY` = (mismo)
   - `R2_BUCKET` = `invensa-products`
   - `R2_REGION` = `auto`
   - `MINIMAX_API_KEY` = (mismo)
   - `MINIMAX_MODEL` = `MiniMax-M3`
   - `APP_BASE_URL` = tu dominio final (ej. `https://invensa.vercel.app`)
   - **`GMAIL_USER`** = `tugmail@gmail.com`
   - **`GMAIL_APP_PASSWORD`** = `abcd efgh ijkl mnop`
   - **`EMAIL_FROM`** = `Invensa <tugmail@gmail.com>`
   - **`CRON_SECRET`** = `<el-mismo-valor-que-en-env-local>`
3. **Redeploy** el último commit (env vars solo aplican en builds nuevos).

### D. Verificar los crons

Vercel → tu proyecto → Settings → Crons debe listar:
- `0 15 * * *` → `/api/cron/low-stock-alert`
- `0 3 * * *` → `/api/cron/daily-summary`

**Prueba manual** (con el secret que generaste):
```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://<tu-dominio>.vercel.app/api/cron/low-stock-alert
# Esperado: 200 con JSON {"sent":1,"rows":N,"recipients":N}
```

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://<tu-dominio>.vercel.app/api/cron/daily-summary
# Esperado: 200 con JSON {"sent":1,"recipients":N,"salesCount":N,"salesTotal":N}
```

### E. Smoke test manual del cierre de caja

1. Ir a `/cash-closing` → debe mostrar "Caja abierta · Esperado $0" (si no hay ventas hoy).
2. Registrar una venta de prueba en `/sales/new` → volver a `/cash-closing` → "Esperado" debe aumentar.
3. Llenar "Total contado en caja" → Cerrar.
4. Verificar que la fila en Supabase `cash_closings` tiene `status='closed'`, `diff` calculado.
5. Botón "Enviar ahora" en dashboard (admin) debe mandar email a `GMAIL_USER` (test).

### F. Verificar el dominio en producción

Si tienes dominio propio (no es obligatorio para Vercel):
- Vercel → Settings → Domains → agregar.
- En Cloudflare Registrar (o donde lo compraste): apuntar CNAME a `cname.vercel-dns.com`.

Vercel te da HTTPS gratis vía Let's Encrypt.

## 20. Recap de costos mensuales (después del deploy)

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free tier | $0 |
| Cloudflare R2 | Free tier (10 GB, 0 egress) | $0 |
| Gmail SMTP | Personal (500 emails/día) | $0 |
| Dominio (opcional) | .com/.app/etc | ~$10-15 USD/año |

**Total mensual: $0.** Único pago opcional: dominio para que el remitente del email sea `noreply@invensa.com` en lugar de tu Gmail personal.



**Fase 14 (cierre de caja).** Empezar por:
1. Migración `0006_cash_closings.sql` + aplicar a Supabase local.
2. `src/lib/schemas/cash-closing.ts` (zod).
3. `src/app/actions/cash-closing.ts` (open/close/getToday).
4. `src/app/(app)/cash-closing/page.tsx` + componentes.
5. Side-nav item + dashboard widget.
6. Después: Fase 15 (cron + email + Resend).
7. Después: Fase 16 (cron + email + Resend, reusando infra de 15).

