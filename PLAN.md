# PLAN — Invensa_web

> Bitácora viva del proyecto. Se actualiza en cada cambio relevante.
>
> **Última actualización:** 2026-07-28 · Módulo productos completo (lista + alta + detalle + edición)
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
| 10 | Módulo clientes (fiados / deuda) | Pendiente |
| 11 | Reportes (cortes, stock bajo, top productos) | Pendiente |
| 12 | Deploy a Vercel + env vars + verificación | Pendiente |
| 13 | Pruebas con hermana + mamá | Pendiente |

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
