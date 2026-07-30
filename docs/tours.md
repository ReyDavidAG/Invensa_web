# PLAN — Tours in-app con driver.js

> Feature nueva. Onboarding + ayuda contextual por página. Sin sobre-ingeniería.
>
> **Skills aplicadas:** /ponytail (lazy, sin abstraer de más) + /hallmark (copy
> en español, paleta Taller cobalt + cream, sin emojis, copy honesto).

---

## 1. Por qué driver.js

- **Vanilla**, sin React wrapper obligatorio (driver.js maneja su propio DOM).
- ~5KB gzip. Cero deps.
- API imperativa: `new Driver({ steps: [...] }).drive()`.
- Themable vía CSS (overrides por clase `.driver-*`).
- Soporta español nativamente en `nextBtnText`, `prevBtnText`, `doneBtnText`.

No usamos `react-joyride` ni `@reactour/tour` — más peso y más opinions sobre
el layout. driver.js es la opción más aburrida y eso es lo que queremos.

## 2. Estrategia: dos tipos de tour, no uno

**Por qué dos tipos:** tour global que se auto-inicia la primera vez + tour
por página opt-in. NO queremos un megatour de 40 pasos que abruma al usuario
ni auto-tours cada vez que entras a una página (ruido).

### A. Onboarding tour (auto, una sola vez)

- Se dispara **solo la primera vez** que el usuario entra al dashboard después
  de autenticarse.
- Tracking: `localStorage["invensa:onboarding-completed"] = "1"`.
- 5-7 pasos que cubren la geografía general de la app:
  1. Sidebar — "Tu menú principal. Inicio, Productos, Ventas, etc."
  2. Topbar — "Aquí ves tu cuenta, tema, ayuda y notificaciones."
  3. Campanita — "Te avisamos cuando un producto baje de stock o la caja quede abierta."
  4. Dashboard cards — "Resumen del día: ventas, productos top, alertas."
  5. Botón ayuda — "Este ícono `?`复活 tours cuando los necesites."
- Botón final: "Listo, empezar". Marca como completado.

### B. Tours por página (opt-in, desde HelpMenu)

- Cada página principal tiene su propio tour.
- Se accede desde el ícono `?` en el topbar → dropdown con la lista.
- Tours disponibles en V1:
  | Tour | Ruta | Pasos |
  |---|---|---|
  | Dashboard | `/dashboard` | 4 |
  | Productos | `/products` | 5 |
  | Producto (detalle) | `/products/[id]` | 3 |
  | Nueva venta | `/sales/new` | 6 |
  | Cierre de caja | `/cash-closing` | 4 |
  | Clientes | `/customers` | 3 |
  | Login | `/login` | 3 |
- Tracking por tour: `localStorage["invensa:tour:<id>"] = "1"`. En HelpMenu
  muestra "✓ Visto" en los completados.
- Auto-arranca **solo** el onboarding, **nunca** los tours por página.

## 3. Estructura de archivos

```
src/lib/tour/
├── driver.ts          # Singleton driver con tema Hallmark
├── storage.ts         # localStorage wrapper (get/set/clear)
├── types.ts           # TourStep, TourMeta, TourRegistry
├── index.ts           # startTour(id), getTours(), etc.
└── tours/
    ├── onboarding.ts
    ├── dashboard.ts
    ├── products.ts
    ├── product-detail.ts
    ├── sale-new.ts
    ├── cash-closing.ts
    ├── customers.ts
    └── login.ts
```

Cada tour es un objeto `{ id, title, description, steps: TourStep[] }`.

## 4. Tema Hallmark para el popover

Driver.js expone las clases `.driver-popover`, `.driver-popover-title`,
`.driver-popover-description`, `.driver-popover-footer`, `.driver-popover-
next-btn`, `.driver-popover-prev-btn`, `.driver-popover-close-btn`.

Overrides en `src/app/globals.css`:

```css
.driver-popover {
  background: var(--popover);
  color: var(--popover-foreground);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  font-family: var(--font-geist-sans);
}
.driver-popover-title {
  font-weight: 700;
  color: var(--foreground);
}
.driver-popover-description {
  color: var(--muted-foreground);
  line-height: 1.55;
}
.driver-popover-next-btn {
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
}
.driver-popover-prev-btn {
  background: transparent;
  color: var(--muted-foreground);
  border: none;
}
.driver-popover-close-btn {
  color: var(--muted-foreground);
}
```

Sin emojis en los textos. Copy en español, directo, sin condescendencia.

## 5. HelpMenu (componente topbar)

- Posición: en `top-bar.tsx`, entre `NotificationBell` y `AccountMenu`.
- Icono: `HelpCircle` de lucide-react.
- Dropdown (shadcn DropdownMenu): "Tour de inicio" + secciones por página.
- Cada item muestra:
  - Nombre ("Productos")
  - Descripción corta ("Conoce tu inventario")
  - Checkmark `✓` si ya se completó
- Footer del dropdown: "Ver todos los tours" (futuro; en V1 ya están todos listados).

## 6. Auto-start del onboarding

En `src/app/(app)/dashboard/page.tsx`:

```tsx
useEffect(() => {
  if (!hasCompletedOnboarding()) {
    const t = setTimeout(() => startTour("onboarding"), 800);
    return () => clearTimeout(t);
  }
}, []);
```

Delay 800ms para que la UI pinte antes de que aparezca el primer highlight.
`hasCompletedOnboarding()` lee `localStorage`.

## 7. Contenido de los tours (resumen)

### Onboarding (5 pasos)
1. **Bienvenida a Invensa** — overview de la app.
2. **Tu menú** — sidebar (Inicio, Productos, Ventas, Clientes, Cierre de caja, Reportes).
3. **Notificaciones** — campanita, alertas de stock bajo.
4. **Resumen del día** — cards de dashboard.
5. **Ayuda siempre disponible** — botón `?` para relanzar tours.

### Dashboard (4 pasos)
1. Cards de "Ventas hoy" / "Productos" / "Clientes".
2. Gráfica de ventas últimos 7 días.
3. Lista de "Productos más vendidos".
4. Acciones rápidas.

### Productos (5 pasos)
1. Botón "Nuevo producto".
2. Buscador.
3. Filtros (categoría, stock bajo).
4. Columnas: SKU, nombre, precio, stock.
5. Click en fila → detalle.

### Nueva venta (6 pasos)
1. Selección de productos (búsqueda + cards).
2. Carrito.
3. Cliente (opcional, búsqueda).
4. Tipo de pago.
5. Total + descuento.
6. Botón "Registrar venta".

### Cierre de caja (4 pasos)
1. Esperado en caja (auto).
2. Contado en caja (input).
3. Diferencia (status pill).
4. Botón "Cerrar caja del día".

### Clientes (3 pasos)
1. Buscador.
2. Botón "Nuevo cliente".
3. Tabla.

### Login (3 pasos)
1. Form de acceso.
2. "¿Olvidaste tu contraseña?".
3. Crear cuenta.

## 8. Orden de implementación

1. ✅ `pnpm add driver.js` — dependencia instalada.
2. `docs/tours.md` — este archivo.
3. `src/lib/tour/{driver,storage,types,index}.ts` — infraestructura.
4. CSS overrides en `globals.css`.
5. `src/lib/tour/tours/onboarding.ts` + `dashboard.ts` (los más importantes).
6. `HelpMenu` component + integrar en `top-bar.tsx`.
7. Auto-start en `dashboard/page.tsx`.
8. Resto de tours (`products`, `sale-new`, `cash-closing`, `customers`, `login`, `product-detail`).
9. Build + commit.

## 9. Out of scope V1

- Tracking de tours en Supabase (cross-device). V1 es localStorage.
- Tours condicionales por rol (admin vs empleado). V1 = todos ven lo mismo.
- Tours en móvil con scroll forzado. V1 = desktop first.
- Tours que esperan a que data cargue (driver.js no tiene waitForElement
  nativo en 1.8). Si hace falta, se agrega después.

## 10. Riesgos

- **driver.js 1.8 con Next 16 / React 19**: hay reportes de issues con
  hydration. Vamos a usar driver.js desde `useEffect` exclusivamente
  (no en SSR). Si rompe, fallback es `@formkit/driver.js` (fork mantenido).
- **Z-index del popover**: el topbar usa `z-30`; el sidebar usa `z-40`.
  Driver.js internamente usa `z-index: 10000` para el overlay, así que no
  debería haber conflicto. Verificar al implementar.