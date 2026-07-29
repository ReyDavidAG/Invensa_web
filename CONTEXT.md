# CONTEXT.md — Invensa_web

> **Lee este archivo ANTES de tocar el proyecto.** Contiene las invariantes que NO se negocian.
> Si una nueva decisión contradice algo de aquí, este archivo se actualiza PRIMERO y luego el código.

**Última actualización:** 2026-07-28 — esquema aplicado al remoto (5 migrations + seed)

---

## 1. Qué es y para quién

| Campo | Valor |
|---|---|
| Producto | Sistema de **inventario + ventas (POS) + reportes** para una tienda pequeña |
| Tienda | Una sola (la de la hermana del dueño del repo) |
| Usuarios | **2 personas** en producción: la hermana (admin) y su mamá (employee) |
| Dispositivo | **Laptop y teléfono** — mobile-first. La hermana consulta ventas/stock desde su cel |
| Idioma | `es-MX` (UI, fechas, moneda MXN). Sin i18n |
| Presupuesto | **$0 recurrentes** al mes. Todo free tier o self-hosted |

### Personas

| Persona | Rol | Permisos |
|---|---|---|
| Hermana | `admin` | CRUD completo + gestión de usuarias |
| Mamá | `employee` | Registrar ventas, ver productos/clientes. **NO** borra ni cambia precios |

Si en el futuro se abre una 2da tienda, ese día se introduce `stores` y se separa el modelo. **Hoy NO.**

---

## 2. Stack (decisiones bloqueadas)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend + servidor | **Next.js 16** (App Router) + TS | Última estable; dd-send ya pasó por las breaking changes |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** (preset `base-nova`) | Sistema de diseño "Coral" documentado en `design.md` |
| BD / Auth / RLS / Realtime | **Supabase** | Free tier con Auth + Postgres + RLS. Migración es la única fuente de verdad del esquema |
| Storage de imágenes | **Cloudflare R2** (10 GB gratis, 0 egress) | Supabase Storage cobra bandwidth; R2 no |
| Hosting | **Vercel** Hobby | Deploy desde GitHub, preview por branch |

**Prohibido:** Auth0 (paywall), tRPC (overkill), Prisma (Supabase + SQL es más simple), Tailwind UI de pago, cualquier servicio con costo recurrente.

### Servicios con plan futuro (NO implementar hasta que se pidan)

- **Pagos:** Mercado Pago Checkout Pro + webhook (preparado en esquema, sin uso todavía)
- **Email transaccional:** Resend (gratis hasta 100 emails/día)
- **Google OAuth:** provider de Supabase (off por ahora)

---

## 3. Convenciones operacionales

- **Mobile-first:** si un layout es feo a 375px, está mal. Probado a 320 / 375 / 414 / 768 / 1024 / 1280.
- **Sin emojis** en código ni UI.
- **Comentarios en inglés**, cortos (≤ una línea).
- **Errores visibles** en español: toast + Problem Details JSON (RFC 7807) en API.
- **Sin métricas inventadas** ("trusted by 10k", "+47% ventas"). Si una celda muestra un número, es real o es `—` con `« datos reales cuando se registren ventas »`.
- **Estilo:** consultar `design.md` antes de inventar componentes. Tema **Coral** (`oklch(0.65 0.18 28)`) reservado para acciones primarias.
- **Código:** `kebab-case` archivos, `PascalCase` componentes, `camelCase` vars. Sin `any`, sin `as unknown as X` salvo justificación.
- **Imports:** `@/` alias. Nada de `../../../`.
- **Dinero:** centavos en enteros si hay cálculo server-side, sino `numeric(12,2)` directo.

---

## 4. Estructura de migraciones (Supabase)

Versión en `supabase/migrations/` y se aplican con `pnpm exec supabase db push`. **Todas las migraciones se aplican a Supabase remoto** (no a una BD local — no hace falta).

| # | Archivo | Crea |
|---|---|---|
| `0001_init.sql` | `profiles` (1:1 con `auth.users`), enum `user_role`, trigger de auto-creación, helper `current_user_role()`, RLS de profiles |
| `0002_products.sql` | `categories`, `units`, `products`, índices de búsqueda |
| `0003_sales.sql` | `sales`, `sale_items`, `inventory_movements`, enums `sale_status`, `payment_method`, `movement_type` |
| `0004_customers.sql` | `clients` + vista `vw_client_balances` (deuda derivada) |
| `0005_rls.sql` | Políticas RLS consolidadas de products / sales / sale_items / inventory_movements / clients |
| `seed.sql` | Categorías iniciales (Limpieza, Refacciones) y unidades (PZA, L, KG) |

**Convención:** la tabla `profiles` lleva RLS en 0001 (porque es auth). Las demás tablas llevan RLS en 0005 para consolidar.

---

## 5. Reglas de oro del modelo de datos

1. **Stock es derivado.** Se calcula como SUM de `inventory_movements` por producto. NO se guarda como columna (evita desincronización, preserva auditoría). Vista `vw_product_stock` lo expone.
2. **Fiado es parcial.** `sales.paid_amount` permite abonos. La deuda del cliente se deriva como `SUM(total - paid_amount) WHERE status='credit'`.
3. **Imágenes son URL de R2.** Solo se guarda `products.image_url` (texto). Cero metadata en BD.
4. **Primera usuaria es admin.** Trigger sobre `auth.users` INSERT: si `profiles` está vacío → role='admin', si no → 'employee'.
5. **Categorías separadas de unidades.** `categories` (limpieza/refacciones) ≠ `units` (PZA/L/KG). Una unidad se reutiliza entre categorías.
6. **Tienda única, sin RFC fiscal.** Si en el futuro se requiere facturación, se agrega columna/migración. NO se prologa desde el día 1.
7. **Multi-moneda NO.** Siempre MXN. `numeric(12,2)` directo (no centavos).
8. **`profiles` se llena automático.** Las invitaciones futuras usan `supabase.auth.admin.inviteUserByEmail()` + trigger de auto-creación. **Enable sign up OFF** en Supabase Auth (la hermana crea la primera cuenta por el form de /register, luego invita por panel admin).

---

## 6. Cómo correr / verificar

```bash
# 1. Una sola vez: login + link al proyecto
pnpm exec supabase login
pnpm exec supabase link --project-ref <ref>

# 2. Aplicar migraciones + seed
pnpm exec supabase db push

# 3. Dev
pnpm dev

# 4. Verificar estado remoto
pnpm exec supabase db remote commit list
```

> **El proyecto NO tiene BD local.** Se desarrolla contra el remoto desde el día 1. Si en el futuro se requiere local, se inicializa con `supabase start`.

---

## 7. Lo que NO es este proyecto

- **NO es multi-tienda** (no `stores`).
- **NO es multi-moneda** (no USD/EUR).
- **NO es SaaS** (no hay tenants, no hay billing).
- **NO es B2B** (no RFC, no facturas fiscales, no clientes corporativos).
- **NO es e-commerce** (no hay catálogo público, no hay carrito, no hay checkout online).
- **NO es producción de alta concurrencia** (no realtime crítico, no CDN, no cache distribuido).
- **NO es i18n** (es-MX only).

Cualquier feature que toque uno de estos "NO" requiere conversación previa y probablemente un proyecto separado.
