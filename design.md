/* Hallmark · pre-emit critique: P5 H5 E4 S4 R5 V5
 * macrostructure: Workbench (app shell) + Letter (auth narrow column) · mode: project-wide lock-in
 * theme: Coral · audience: sister (admin) + mom (employee) · use: POS+inventory · tone: utilitarian
 * tokens already exist at: src/app/globals.css :root (OKLCH) — extended, not overwritten
 * locked into: design.md at repo root · first Hallmark run on this project
 */

# design.md — Invensa_web

> **Locked design system** for the Invensa_web Next 16 + shadcn app.
> Hallmark reads this file first on every run; subsequent picks defer to it.
> Last updated: 2026-07-28 (initial lock-in, design pass #1).

---

## 1. Brand brief

| Field | Value |
| --- | --- |
| Product | Inventory + POS + reports for a single small store (cleaning products + moto refacciones) |
| Primary user | Sister — store owner, admin role, zero technical skill |
| Secondary user | Mom — store helper, employee role, basic computer literacy |
| Languages | `es-MX` (UI copy, dates, currency). No i18n for now |
| Devices | Laptop browser **and** mobile browser. Both first-class |
| Trust posture | Calm, professional, no invented metrics, no fabricated social proof |
| Future surface | Web only. No native app. Pagos via Mercado Pago (fase futura) |

**The single most important action a user can take on this app:** `Registrar una venta` from the dashboard or topbar. Every layout decision starts there.

---

## 2. Macrostructure: `Workbench` (per-page variations noted)

The dominant structural identity is **admin-tool workbench**: side-rail nav, top-bar, dense content area, no decorative hero. Three of the eight pages share this shell; the auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/confirm`) drop the shell and use a narrow **Letter** column.

```
[ LETTER · auth · narrow center column ]
        ┌──────────────────────────┐
        │  brand wordmark          │
        │  ─ eyebrow               │
        │  H1 heading              │
        │  sub                     │
        │  form fields             │
        │  primary CTA             │
        │  secondary link          │
        └──────────────────────────┘

[ WORKBENCH · app shell · side-rail + topbar + main ]
┌───────┬───────────────────────────────┐
│       │  topbar (user · theme · out) │
│ side  ├───────────────────────────────┤
│ rail  │                               │
│ nav   │  page content                 │
│       │  (tables, forms, bento tiles) │
│       │                               │
└───────┴───────────────────────────────┘
```

---

## 3. Theme: `Coral` — modern-minimal

Three diversification axes:

| Axis | Value |
| --- | --- |
| Paper band | **Light** (`L = 99%` paper; dark mode `L = 13%`) |
| Display style | **Grotesk-sans** — Geist (display + body + Geist Mono for numerics/code) |
| Accent hue | **Warm coral** — `oklch(0.65 0.18 28)` (~hue 28°, warm) |

**Genre rule that scopes Coral**: accent colour is *reserved for primary actions and active states*. It does not appear on chrome, borders, or background fills. This is what keeps "coral" from reading playful in a small-business tool — the accent speaks only when the user is being asked to do something.

---

## 4. Tokens

All tokens reference CSS custom properties. No raw OKLCH/hex inside component code. All tokens live in `src/app/globals.css` `:root` and `&.dark` blocks (already wired through `src/app/theme-init.ts` via `next-themes`).

### 4.1 Color tokens

| Token | Light (OKLCH) | Dark (OKLCH) | Use |
| --- | --- | --- | --- |
| `--background` | `0.99 0 0` | `0.13 0 0` | App canvas |
| `--foreground` | `0.18 0 0` | `0.95 0 0` | Default text |
| `--card` | `1 0 0` | `0.17 0 0` | Card / panel surface |
| `--card-foreground` | `0.18 0 0` | `0.95 0 0` | Card text |
| `--popover` | `1 0 0` | `0.17 0 0` | Popover background |
| `--popover-foreground` | `0.18 0 0` | `0.95 0 0` | Popover text |
| `--primary` | `0.65 0.18 28` | `0.70 0.17 28` | Coral — primary action fill |
| `--primary-foreground` | `0.99 0 0` | `0.13 0 0` | Text on primary fill |
| `--secondary` | `0.96 0 0` | `0.22 0 0` | Subtle buttons, badges |
| `--secondary-foreground` | `0.18 0 0` | `0.95 0 0` | Text on secondary |
| `--muted` | `0.96 0 0` | `0.22 0 0` | Muted backgrounds (hover, faint fills) |
| `--muted-foreground` | `0.50 0 0` | `0.65 0 0` | Helper text, captions |
| `--accent` | `0.96 0 0` | `0.22 0 0` | Same as muted; reserved for hover wash |
| `--accent-foreground` | `0.18 0 0` | `0.95 0 0` | Text on accent fill |
| `--destructive` | `0.55 0.22 25` | `0.55 0.22 25` | Errors, destructive actions |
| `--destructive-foreground` | `0.99 0 0` | `0.99 0 0` | Text on destructive |
| `--success` | `0.62 0.16 145` | `0.62 0.16 145` | Confirmed sales, paid fiados |
| `--warning` | `0.78 0.15 75` | `0.78 0.15 75` | Low stock alert |
| `--border` | `0.91 0 0` | `0.27 0 0` | Hairlines, dividers, input borders |
| `--input` | `0.91 0 0` | `0.27 0 0` | Input border |
| `--ring` | `0.65 0.18 28` | `0.70 0.17 28` | Focus ring (3:1 contrast against surface) |
| `--chart-1` | `0.65 0.18 28` | `0.70 0.17 28` | Coral — sales today |
| `--chart-2` | `0.62 0.16 145` | `0.62 0.16 145` | Green — net profit |
| `--chart-3` | `0.78 0.15 75` | `0.78 0.15 75` | Amber — low stock |
| `--chart-4` | `0.55 0.22 25` | `0.55 0.22 25` | Red — pending fiados |
| `--chart-5` | `0.55 0.10 250` | `0.65 0.12 250` | Cool grey-blue — neutral series |

### 4.2 Typography

| Role | Token | Value |
| --- | --- | --- |
| Display / body sans | `--font-sans` | `var(--font-geist-sans)` from `next/font/google` |
| Numeric / code mono | `--font-mono` | `var(--font-geist-mono)` from `next/font/google` |

Weights: Geist ships 100–900. Use only `400 / 500 / 600 / 700` — no thin/black at display sizes. No italic display — emphasis in display type is carried by **weight + the accent colour**, not by `<em>` or `font-style: italic`.

### 4.3 Radius, spacing, motion

**Radius scale** (all derive from `--radius: 0.625rem`):

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `0.375rem` | Pills, badges, small chips |
| `--radius-md` | `0.5rem` | Buttons, inputs, table rows |
| `--radius-lg` | `0.625rem` | Cards, dialogs, sheets |
| `--radius-xl` | `0.875rem` | Hero panels (rare) |
| `--radius-2xl` … `4xl` | derived | Reserved for display cases |

**Spacing** uses Tailwind v4 default 4-pt scale (`0.25rem` increments). No custom spacing tokens. Tailwind's numeric classes (`p-2`, `gap-4`, etc.) are the only spacing surface.

**Motion**:

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | `120ms` | Hover state changes |
| `--dur-base` | `180ms` | Form field focus, button press |
| `--dur-slow` | `240ms` | Entrance animations, toast slide |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default entrance |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Toggle / morph |

`prefers-reduced-motion: reduce` → all durations collapse to ≤150ms opacity crossfade. Implement with a single `motion-safe:` / `motion-reduce:` Tailwind variant pair.

---

## 5. Typography scale

```
display-2xl   text-6xl   text-[60px]  leading-[1.05] tracking-[-0.04em]  font-bold   // login H1 ≤50 chars only
display-xl    text-5xl   text-[48px]  leading-[1.05] tracking-[-0.035em] font-bold   // ≥30 chars step down
display-l     text-4xl   text-[36px]  leading-[1.1]   tracking-[-0.03em]  font-bold   // page header
h1            text-3xl   text-[30px]  leading-[1.15]  tracking-[-0.02em]  font-bold
h2            text-2xl   text-[24px]  leading-[1.25]  tracking-[-0.015em] font-semibold
h3            text-xl    text-[20px]  leading-[1.3]   tracking-[-0.01em]  font-semibold
body          text-base  text-[16px]  leading-[1.5]                      font-normal
body-sm       text-sm    text-[14px]  leading-[1.45]                     font-normal
caption       text-xs    text-[12px]  leading-[1.4]   tracking-[0.04em]   font-medium  uppercase optional
mono-num      text-sm    text-[14px]  font-mono      tabular-nums        font-medium  // prices, quantities
```

**Hard rules**:

- Display headlines ≤ 50 chars total. If copy needs > 50 chars, **rewrite shorter first**, then drop one rung.
- All headings roman (`font-style: normal`). No `<em>` inside headings.
- Numerics in tables use `font-mono tabular-nums` — aligns decimal columns.

---

## 6. Layout patterns

### 6.1 Auth pages — `Letter` macrostructure

Layout: single column, `max-w-md`, vertically centred.

```
┌────────────────────────────────────────┐
│                                        │   ← min-h-screen flex items-center
│      ┌──────────────────────────┐      │
│      │  ▎ Wordmark (24px bold)  │      │   ← brand at top
│      │  ──  4px coral rule      │      │
│      │  Eyebrow (uppercase 11)  │      │   ← INICIAR SESIÓN (or REGISTRARSE)
│      │  H1 (30px roman bold)    │      │   ← "Bienvenido de vuelta"
│      │  Sub (14px muted)        │      │   ← one sentence, descriptive
│      │                          │      │
│      │  [email field]           │      │
│      │  [password field]        │      │
│      │  [error banner]          │      │   ← conditional
│      │  [primary CTA · 52 tall] │      │
│      │  small secondary link    │      │   ← "¿Olvidaste tu contraseña?"
│      └──────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

No card around the form. The form lives directly on `--background`. Borders and spacing carry the hierarchy. Width capped at `max-w-[420px]` on the form, `mx-auto`. Vertical padding `64px` top, `48px` bottom.

### 6.2 App shell — `Workbench`

```
┌─sidebar 240px──┬─topbar 56px─────────────────────────────────┐
│  brand mark     │  breadcrumb  ·  page title      user · ☀ ⎋ │
│  ───            ├────────────────────────────────────────────┤
│  Dashboard      │                                            │
│  Productos      │  page main (max-w-screen-2xl, p-8)         │
│  Ventas         │  ─ 24px gutter on wide, 16px on narrow     │
│  Clientes       │                                            │
│  Reportes       │                                            │
│  ───            │                                            │
│  Cuenta         │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

**Sidebar (shadcn `Sidebar`)**: collapsible to icons-only at `≤ 1024px`, drawer-overlay at `≤ 768px`. Active item: 2px coral underline + coral text. Inactive: muted text. Icon + label, never icon-only by default.

**Topbar**: `[breadcrumb · H2 page title]` left · `[theme toggle · account dropdown — avatar + name + email · ⎋ sign out]` right. Sticky.

**Page main**: `max-w-screen-2xl mx-auto px-8 py-6` on `≥ 768px`. `px-4 py-4` on narrow.

### 6.3 Dashboard (`/dashboard`) — Bento on shell

Top row: 4 stat tiles in `grid-cols-2 md:grid-cols-4 gap-4`:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Ventas hoy   │ │ Ticket prom. │ │ Stock bajo   │ │ Fiados pend. │
│      —       │ │      —       │ │      —       │ │      —       │
│ 12 ventas    │ │ vs ayer      │ │ productos    │ │ 3 clientes   │
│  « datos     │ │  « datos     │ │  « datos     │ │  « datos     │
│    reales »  │ │    reales »  │ │    reales »  │ │    reales »  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Until real data exists, every cell that *would* hold a number shows `—` and the small muted line below says `« datos reales cuando se registren ventas »`. The muted subtitle (`12 ventas / vs ayer / productos / 3 clientes`) is itself hidden when count is unknown. **Never fabricate a number for the dashboard.** When the first sale lands, the tile flips to real data — never before.

Below the tiles: 2-column split. Left 2/3: recent sales list (table). Right 1/3: short-actions card (`Registrar venta` · `Agregar producto` · `Nuevo cliente`).

Each tile: `--card` bg, `--border` 1px, `--radius-lg`, `p-4`. Single label + single value + tiny muted subtitle. **No chart on the dashboard home** — load-bearing numbers only. Real charts (if needed) live in `/reports`.

### 6.4 List pages (Products, Customers, Sales) — Filter rail + table

```
┌──────────────────────────────────────────────────────────┐
│  H2 · "Productos"          [search input]   [+ Nuevo]    │
│  ── 4px coral rule                                       │
│                                                          │
│  Filter chips:  Categoría: Todas · Limpieza · Refacciones │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │  SKU  │  Nombre      │  Stock │  Precio  │  ⌥ │      │
│  ├───────┼──────────────┼────────┼──────────┼────┤      │
│  │  ...  │  Fab Ultra   │  12    │ $89.00   │  ⋮ │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  Página 1 de 8 · 87 resultados        ‹ 1 2 3 … ›        │
└──────────────────────────────────────────────────────────┘
```

Filters live in URL via `useSearchParams()`: `?q=...&cat=limpieza&page=2`. Server Component reads `searchParams`, re-fetches. Sort columns click into the URL: `?sort=price&dir=desc`.

### 6.5 Detail / Form pages (`/products/new`, `/products/[id]`, `/customers/[id]`)

```
┌──────────────────────────────────────────────────────────┐
│  breadcrumb · "Productos / Fab Ultra"          [⌫ Eliminar]│
│  H2 · "Editar producto"                                  │
│  ── 4px coral rule                                       │
│                                                          │
│  ┌── col 1 ─────────────┐  ┌── col 2 ─────────────────┐  │
│  │  [Imagen]            │  │  SKU              [input]│  │
│  │  dropzone / preview  │  │  Nombre           [input]│  │
│  │                      │  │  Categoría        [select]│  │
│  │                      │  │  Precio compra   [number]│  │
│  │                      │  │  Precio venta    [number]│  │
│  │                      │  │  Stock inicial   [number]│  │
│  │                      │  │  Descripción     [textarea]│ │
│  │                      │  │  [Cancelar] [Guardar]  │  │
│  └──────────────────────┘  └─────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

`max-w-screen-lg`. Two columns at `md`, single column on mobile. Form on the right, image on the left. Save button **right-aligned** in the column, never centred. Cancel is `secondary` variant.

### 6.6 Reports (`/reports`)

Index page lists report cards: Ventas hoy · Stock bajo · Top productos · Fiados pendientes. Each card links to its own page.

Report pages have a date range picker (top-right), 4 KPI tiles in a row, then one chart (simple line for sales over time, simple bar for top products), then a table.

**Honesty rule**: until there is real data, reports show real placeholder text like `—` and a labelled grey block `« datos reales cuando se registren ventas »`. Never fake numbers.

---

## 7. Component variants

### 7.1 Button (`shadcn button.tsx`)

| Variant | Background | Text | Border | Hover |
| --- | --- | --- | --- | --- |
| `default` (primary) | `--primary` (coral) | `--primary-foreground` | none | `--primary` darkened 6% via opacity-90 overlay |
| `secondary` | transparent | `--foreground` | 1px `--border` | `--accent` fill |
| `ghost` | transparent | `--foreground` | none | `--accent` fill |
| `outline` | transparent | `--foreground` | 1px `--border` | `--accent` fill |
| `destructive` | `--destructive` | `--destructive-foreground` | none | 90% opacity |
| `link` | transparent | `--primary` | none | underline |

| Size | Height | Padding-x | Text size |
| --- | --- | --- | --- |
| `sm` | 36px | 12px | 14px |
| `default` | 44px | 16px | 14px |
| `lg` | 52px | 20px | 16px (auth primary CTA) |

**All buttons**, all sizes, all states:

| State | Treatment |
| --- | --- |
| default | as above |
| hover | background overlay (≤10% opacity of foreground), never solid colour swap |
| focus-visible | 2px outer ring of `--ring`, `outline-offset: 2px`. **Ring is not animated** — appears instantly |
| active | translateY(1px) + foreground at 15% opacity over primary |
| disabled | opacity 0.55, `cursor-not-allowed`, no hover |
| loading | spinner replaces leading icon. Label stays. Disabled |
| error | border becomes `--destructive`. Label changes to `Reintentar` |
| success | green check icon replaces leading icon. Label briefly `Guardado` then route or close |

### 7.2 Input (`shadcn input.tsx` wrapped by `InputFormField`)

Default height 44px. Single border `--input`. Focus ring `--ring` 2px outside.

States: default · hover (border `--ring` at 60% opacity) · focus-visible · disabled (muted bg) · error (border `--destructive`, helper text in `--destructive`).

When used inside a form with `<FormMessage>`: error renders below, `aria-invalid="true"` and `aria-describedby` wired to the message id.

### 7.3 Card

Three roles, all use `--card`/`--card-foreground`:

- **Panel** (`Card`): 1px `--border`, `--radius-lg`, `p-6`. Used on dashboard tiles, form pages, dialog bodies.
- **Stat tile** (panel but `p-4`, no shadow): dashboard only.
- **Outlined group** (panel with `border-dashed`): empty states ("Aún no tienes productos registrados…").

### 7.4 Form wrappers — controlled components discipline

These live in `src/components/form/`:

| Component | Wraps |
| --- | --- |
| `InputFormField` | shadcn `Input` |
| `PasswordFormField` | shadcn `Input type=password` + show/hide toggle |
| `TextareaFormField` | shadcn `Textarea` |
| `SelectFormField` | shadcn `Select` |
| `CheckboxFormField` | shadcn `Checkbox` |
| `DateFormField` | shadcn `Calendar` in `Popover` (es-MX locale) |
| `NumberFormField` | shadcn `Input type=number` + arrow-steppers, formatted in `es-MX` |
| `CurrencyFormField` | `NumberFormField` with currency prefix, `Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN'})` |
| `FormMessage` | error text below field, `--destructive` colour, 12px |
| `FormSection` | group of fields, optional H3 + 1px divider |

Each wrapper accepts `{ control, name, label, description, ... }`, renders a `<FormField><FormItem><FormLabel/><FormControl>{children}</FormControl><FormMessage/></FormItem></FormField>` block from shadcn, and forwards refs. Spanish error message mapping happens here, not in the form schema.

### 7.5 Dialog / Sheet

Both use the shadcn primitives. Dialog centred, max-w-md. Sheet slides from right, max-w-sm, used for detail previews. Overlay is `--background/80 backdrop-blur-sm`.

### 7.6 Sonner toast

Toasts live bottom-right on desktop, top-centred on mobile. 3 types:

| Type | Icon | Background | Foreground |
| --- | --- | --- | --- |
| success | `lucide:check-circle-2` | `--card` | `--success` |
| error | `lucide:alert-octagon` | `--card` | `--destructive` |
| info | `lucide:info` | `--card` | `--foreground` |

Timeout: 4s on success/info, 6s on error. **Silent success preferred** for low-stakes confirmations (a sale saved toasts on the form, then unmounts when the row appears in the list).

### 7.7 Empty state

Reusable component `<EmptyState icon title description action>`. Used in:

- Dashboard for "Aún no tienes ventas hoy"
- Products list when filtered result is empty
- Customers list
- Search no-results

Border-dashed card, 80px wide icon in muted colour, H3, body, optional primary CTA.

### 7.8 Sidebar (shadcn)

Already installed. Use as-is. Active item: `bg-accent text-accent-foreground` plus a 2px coral left border (`border-l-2 border-primary`). Group dividers: `<Separator className="my-2" />`.

### 7.9 Avatar / Badge

- `Avatar`: `lucide:user` fallback when no image. Size 32px in topbar.
- `Badge` variants: `default` (coral on primary text), `secondary`, `outline`, `destructive`, `success`. Heights 22px, text 12px, `--radius-sm`.

### 7.10 Skeleton

Use for any list/table load. `bg-muted animate-pulse`. Matches the final layout's height and width to avoid reflows.

---

## 8. Forms discipline

1. **Schema-first** — every form has a `zod` schema in `src/lib/schemas/<feature>.ts`. The schema is the contract.
2. **`useForm({ resolver: zodResolver(schema), mode: 'onSubmit' })`** — no validate-on-blur by default (the sister finds it nagging). For auth forms, `mode: 'onTouched'` once the user has interacted with the field.
3. **Server Actions validate again with the same schema** — never trust the client. Re-run `schema.safeParse(formData)` on the server.
4. **Errors in Spanish** — `src/lib/messages/es.ts` maps zod codes to Spanish. The form wrapper renders them under the field.
5. **Disabled while submitting** — `form.formState.isSubmitting` disables every field + primary CTA. Visual feedback: spinner replaces leading icon, `Verificando…` label on auth-style submit.
6. **Cancel is `secondary`, Save is `default`** — never reverse.
7. **Destructive submits require explicit confirmation** — `<Dialog>` with `Confirmar` + `Cancelar` actions. Touching a sale price or deleting a customer is destructive.
8. **`aria-invalid` + `aria-describedby`** — set by `FormMessage`, never in business logic.

---

## 9. Motion discipline

- **Only `opacity` and `transform`** are animated. Never width, height, padding, margin, top, left.
- **Durations**: `--dur-fast 120ms` for state changes (hover, focus); `--dur-base 180ms` for press; `--dur-slow 240ms` for entrance/toast.
- **Easing**: `--ease-out` for entrance (default), `--ease-in` for exit. No bounce, no spring, no overshoot.
- **Reduced motion**: `motion-reduce:transition-none` and `motion-reduce:animate-none`. All entrance animations collapse to ≤150ms opacity crossfade. Implemented in `src/app/providers.tsx` via a single `<MotionConfig>` wrapper from `motion`.
- **Focus ring is not animated** — it appears instantly. If you want a transition on the ring, it's `transition: box-shadow 0ms`.
- **Sonner toasts** slide+fade from bottom-right (`--dur-slow`, `--ease-out`).

---

## 10. Anti-patterns — locked rules

These are **bans**, not advice. Any violation is a regression.

1. **No fake chrome** — no browser bar mockups, no fake phone frames, no fake code-block window, no fake IDE. The user has a real OS supplying real chrome.
2. **No fabricated metrics** — "trusted by 10k", "+47% sales", "the fastest POS in Mexico" — none of it. If a tile shows a number, it's a real number from the database or it's `—` with a `« datos reales cuando se registren ventas »` labelled block.
3. **No invented testimonials or logos** — none on the marketing surfaces, none in the dashboard. The store has zero testimonials; do not invent them.
4. **No italic display headers** — `<em>` inside an `<h1>`/`<h2>` is banned. Italic survives only as body-copy emphasis.
5. **No emoji** — neither in code, nor in UI strings, nor in comments.
6. **No `Colors.X` literals or raw hex/OKLCH inside components** — only `var(--*)` tokens.
7. **No `any`** in TypeScript — `unknown` with narrowing, or proper types.
8. **No `as unknown as X`** without a justifying comment — usually indicates a bug.
9. **Comments in English, short** — `// Best price for 24h`, not a paragraph. No JSDoc unless the function is exported and non-obvious.
10. **No `setTimeout`-driven state** for UI — use `motion` exit animations or accept the visual jump.
11. **No fake loading animations** that run for > 800ms unless tied to real network round-trips. The sister will see the spinner for 200 ms during real loads; that's correct.
12. **No `useEffect` for derived state** — compute during render or use `useMemo`.
13. **No `dangerouslySetInnerHTML`** — if the sister needs to paste rich text, it's stored as plain text until a sanitiser is wired in.
14. **No silent error swallowing** — every `catch` returns either an error message to the user (via toast/banner) or re-throws.

---

## 11. Mobile responsiveness

Breakpoints (Tailwind v4 defaults):

| Breakpoint | min-width | Layout |
| --- | --- | --- |
| (default) | 0 | Single column. Sidebar becomes drawer (Sheet). Tables get horizontal scroll wrapper. |
| `sm` | 640px | Two-column stat tiles |
| `md` | 768px | Form pages get two columns; sidebar becomes sticky |
| `lg` | 1024px | Sidebar collapses to icons-or-label hybrid by default |
| `xl` | 1280px | Full sidebar 240px. App shell on the desktop look. |

**Non-negotiable**, all widths 320 / 375 / 414 / 768:

- `body { overflow-x: clip }` and `html { overflow-x: clip }` in `globals.css`. Not `hidden` — `clip` keeps the scroll gutter working.
- All `grid-template-columns` with image or icon tracks use `minmax(0, 1fr)`. Never bare `1fr`.
- Display headings use `overflow-wrap: anywhere; min-width: 0` so long words wrap.
- All buttons primary CTAs are 44px+ tall on mobile; nav links 44px+ tall.
- Two-line clickable text (button labels, nav links) is banned — single-line every time.
- `Sidebar` switches to `Sheet` overlay under 1024px, with a hamburger in the topbar.

---

## 12. Exports (single source of truth across formats)

This `design.md` is the prose record. The four formats below make it portable.

### 12.1 CSS custom properties — drop into `src/app/globals.css :root`

Already partially wired by the shadcn `base-nova` init. Modernise to match the table in §4.1; do not overwrite the working import block.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.18 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0 0);
  --primary: oklch(0.65 0.18 28);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.18 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.50 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.18 0 0);
  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.99 0 0);
  --success: oklch(0.62 0.16 145);
  --warning: oklch(0.78 0.15 75);
  --border: oklch(0.91 0 0);
  --input: oklch(0.91 0 0);
  --ring: oklch(0.65 0.18 28);
  --chart-1: oklch(0.65 0.18 28);
  --chart-2: oklch(0.62 0.16 145);
  --chart-3: oklch(0.78 0.15 75);
  --chart-4: oklch(0.55 0.22 25);
  --chart-5: oklch(0.55 0.10 250);
  --radius: 0.625rem;
  --sidebar: oklch(0.99 0 0);
  --sidebar-foreground: oklch(0.18 0 0);
  --sidebar-primary: oklch(0.65 0.18 28);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.96 0 0);
  --sidebar-accent-foreground: oklch(0.18 0 0);
  --sidebar-border: oklch(0.91 0 0);
  --sidebar-ring: oklch(0.65 0.18 28);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

.dark {
  --background: oklch(0.13 0 0);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.17 0 0);
  --card-foreground: oklch(0.95 0 0);
  --popover: oklch(0.17 0 0);
  --popover-foreground: oklch(0.95 0 0);
  --primary: oklch(0.70 0.17 28);
  --primary-foreground: oklch(0.13 0 0);
  --secondary: oklch(0.22 0 0);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.22 0 0);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.27 0 0);
  --input: oklch(0.27 0 0);
  --ring: oklch(0.70 0.17 28);
  --sidebar: oklch(0.17 0 0);
  --sidebar-foreground: oklch(0.95 0 0);
  --sidebar-accent: oklch(0.22 0 0);
  --sidebar-accent-foreground: oklch(0.95 0 0);
  --sidebar-border: oklch(0.27 0 0);
  --sidebar-ring: oklch(0.70 0.17 28);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@layer base {
  * { border-color: var(--border); }
  html, body { overflow-x: clip; }
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }
}
```

### 12.2 Tailwind v4 `@theme` (inline in `globals.css`)

Already exported via `@theme inline { ... }` in §12.1 — Tailwind v4 consumes those `--color-*` variables as utility classes (`bg-primary`, `text-muted-foreground`, etc.).

### 12.3 DTCG `tokens.json` — drop into `src/tokens/design-tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "background": { "$value": "oklch(99% 0 0)", "$type": "color" },
    "foreground": { "$value": "oklch(18% 0 0)", "$type": "color" },
    "card":       { "$value": "oklch(100% 0 0)", "$type": "color" },
    "card-foreground": { "$value": "oklch(18% 0 0)", "$type": "color" },
    "primary": { "$value": "oklch(65% 0.18 28)", "$type": "color" },
    "primary-foreground": { "$value": "oklch(99% 0 0)", "$type": "color" },
    "secondary": { "$value": "oklch(96% 0 0)", "$type": "color" },
    "secondary-foreground": { "$value": "oklch(18% 0 0)", "$type": "color" },
    "muted": { "$value": "oklch(96% 0 0)", "$type": "color" },
    "muted-foreground": { "$value": "oklch(50% 0 0)", "$type": "color" },
    "accent": { "$value": "oklch(96% 0 0)", "$type": "color" },
    "accent-foreground": { "$value": "oklch(18% 0 0)", "$type": "color" },
    "destructive": { "$value": "oklch(55% 0.22 25)", "$type": "color" },
    "destructive-foreground": { "$value": "oklch(99% 0 0)", "$type": "color" },
    "success": { "$value": "oklch(62% 0.16 145)", "$type": "color" },
    "warning": { "$value": "oklch(78% 0.15 75)", "$type": "color" },
    "border": { "$value": "oklch(91% 0 0)", "$type": "color" },
    "input": { "$value": "oklch(91% 0 0)", "$type": "color" },
    "ring": { "$value": "oklch(65% 0.18 28)", "$type": "color" },
    "chart-1": { "$value": "oklch(65% 0.18 28)", "$type": "color" },
    "chart-2": { "$value": "oklch(62% 0.16 145)", "$type": "color" },
    "chart-3": { "$value": "oklch(78% 0.15 75)", "$type": "color" },
    "chart-4": { "$value": "oklch(55% 0.22 25)", "$type": "color" },
    "chart-5": { "$value": "oklch(55% 0.10 250)", "$type": "color" }
  },
  "font": {
    "sans": { "$value": "Geist, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "mono": { "$value": "Geist Mono, ui-monospace, SFMono-Regular, monospace", "$type": "fontFamily" }
  },
  "radius": {
    "sm": { "$value": "0.375rem", "$type": "dimension" },
    "md": { "$value": "0.5rem", "$type": "dimension" },
    "lg": { "$value": "0.625rem", "$type": "dimension" },
    "xl": { "$value": "0.875rem", "$type": "dimension" }
  },
  "motion": {
    "duration-fast": { "$value": "120ms", "$type": "duration" },
    "duration-base": { "$value": "180ms", "$type": "duration" },
    "duration-slow": { "$value": "240ms", "$type": "duration" },
    "ease-out": { "$value": "cubic-bezier(0.16, 1, 0.3, 1)", "$type": "cubicBezier" },
    "ease-in": { "$value": "cubic-bezier(0.4, 0, 1, 1)", "$type": "cubicBezier" },
    "ease-in-out": { "$value": "cubic-bezier(0.4, 0, 0.2, 1)", "$type": "cubicBezier" }
  }
}
```

### 12.4 shadcn/ui CSS variables — `src/app/globals.css`

Already shipped from §12.1. shadcn reads `bg-background`, `text-foreground`, `border-border`, etc. The mapping is via `@theme inline { --color-X: var(--X) }` so Tailwind utilities resolve to the same OKLCH values.

---

## 13. What this design.md is **NOT**

- **NOT a marketing brand guide** — there is no logo treatment, no tagline, no social-media colour palette. Invensa_web has no public-facing brand surface; the sister and mom only ever see the running app.
- **NOT a UI library audit** — the components listed in §7 are *defaults*. Do not import a new UI library (Mantine, Radix raw, MUI) on top. Use the shadcn primitives.
- **NOT frozen** — when a real need appears to add a token or variant, edit this file alongside the change in the repo. Hallmark reads `design.md` first on every run.

---

## 14. Knobs (tunable on a per-page rebuild)

Same macrostructure + same theme, different knob values:

| Knob | Default | Possible values |
| --- | --- | --- |
| Stat-tile grid | 4 across on `md+` | 2 / 3 / 4 |
| Sidebar collapsed-by-default below `lg` | yes | no (icons always) |
| Date locale | `es-MX` | locked for now |
| Empty-state illustration style | none (icon only) | none until requested |
| Sound on sale confirmation | off | on (deferred to Pagos feature) |

Future Hallmark runs on this repo **rotate within this knob space**, not across themes or macrostructures — the system is locked.

---

`design.md · v1.0.0 · locked`
