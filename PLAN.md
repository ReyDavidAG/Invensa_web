# PLAN — Invensa_web

> Bitácora viva del proyecto. Se actualiza en cada cambio relevante.
>
> **Última actualización:** 2026-07-28 · Bootstrap inicial (antes de scaffold de Next.js)

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
| Frontend + servidor | **Next.js 15** (App Router) + TypeScript | Estable, soporte maduro de shadcn |
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
| 1 | Bootstrap: `.gitignore`, `PLAN.md`, `.env.local.example`, README | **En curso** |
| 2 | Scaffold Next 15 + shadcn + deps | Pendiente |
| 3 | `design.md` (Hallmark) + tema (colores, tipografía, motion) | Pendiente |
| 4 | Layout shell (side-nav + top-bar) + landing → dashboard/login | Pendiente |
| 5 | Auth UI completa (login / register / forgot / reset / confirm) | Pendiente |
| 6 | DB schema + RLS (migrations versionadas) + seed categorías | Pendiente |
| 7 | Módulo productos (CRUD + imágenes R2) | Pendiente |
| 8 | Módulo ventas (POS-like) + recibos | Pendiente |
| 9 | Módulo clientes (fiados / deuda) | Pendiente |
| 10 | Reportes (cortes, stock bajo, top productos) | Pendiente |
| 11 | Deploy a Vercel + vars de entorno + verificación | Pendiente |
| 12 | Pruebas con hermana + mamá | Pendiente |

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

## 7. Próximo paso inmediato

Instalar Node.js (CachyOS no lo trae), scaffoldear Next 15 con TypeScript + Tailwind, instalar shadcn y deps base. Confirmar con el usuario antes de ejecutar `pnpm create next-app`.
