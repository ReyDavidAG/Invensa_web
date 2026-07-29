"use client";

/* Hallmark · locked system applied · src/components/nav/page-title.tsx
 * Derives page title + breadcrumb from the current pathname using a static map.
 * Pages outside the map show no title (the page itself is expected to render one).
 */

import { usePathname } from "next/navigation";

type Crumb = { label: string; href?: string };

const PATH_MAP: Record<string, { title: string; crumbs: Crumb[] }> = {
  "/dashboard": { title: "Inicio", crumbs: [{ label: "Inicio" }] },
  "/products": {
    title: "Productos",
    crumbs: [{ label: "Inicio", href: "/dashboard" }, { label: "Productos" }],
  },
  "/products/new": {
    title: "Nuevo producto",
    crumbs: [
      { label: "Inicio", href: "/dashboard" },
      { label: "Productos", href: "/products" },
      { label: "Nuevo" },
    ],
  },
  "/sales": {
    title: "Ventas",
    crumbs: [{ label: "Inicio", href: "/dashboard" }, { label: "Ventas" }],
  },
  "/sales/new": {
    title: "Nueva venta",
    crumbs: [
      { label: "Inicio", href: "/dashboard" },
      { label: "Ventas", href: "/sales" },
      { label: "Nueva" },
    ],
  },
  "/customers": {
    title: "Clientes",
    crumbs: [{ label: "Inicio", href: "/dashboard" }, { label: "Clientes" }],
  },
  "/reports": {
    title: "Reportes",
    crumbs: [{ label: "Inicio", href: "/dashboard" }, { label: "Reportes" }],
  },
  "/account": {
    title: "Cuenta",
    crumbs: [{ label: "Inicio", href: "/dashboard" }, { label: "Cuenta" }],
  },
};

function resolve(pathname: string): { title: string; crumbs: Crumb[] } | null {
  if (PATH_MAP[pathname]) return PATH_MAP[pathname];
  // Detail pages: /products/[id], /customers/[id], /sales/[id]
  if (pathname.startsWith("/products/")) {
    return {
      title: "Producto",
      crumbs: [
        { label: "Inicio", href: "/dashboard" },
        { label: "Productos", href: "/products" },
        { label: "Detalle" },
      ],
    };
  }
  if (pathname.startsWith("/customers/")) {
    return {
      title: "Cliente",
      crumbs: [
        { label: "Inicio", href: "/dashboard" },
        { label: "Clientes", href: "/customers" },
        { label: "Detalle" },
      ],
    };
  }
  if (pathname.startsWith("/sales/")) {
    return {
      title: "Venta",
      crumbs: [
        { label: "Inicio", href: "/dashboard" },
        { label: "Ventas", href: "/sales" },
        { label: "Detalle" },
      ],
    };
  }
  return null;
}

export function PageTitle() {
  const pathname = usePathname();
  const meta = resolve(pathname ?? "");
  if (!meta) return null;

  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
        {meta.title}
      </h2>
    </div>
  );
}

export function Breadcrumb() {
  const pathname = usePathname();
  const meta = resolve(pathname ?? "");
  if (!meta) return null;

  return (
    <nav
      aria-label="Ruta"
      className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground md:flex"
    >
      {meta.crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {c.href ? (
            <a
              href={c.href}
              className="hover:text-foreground transition-colors"
            >
              {c.label}
            </a>
          ) : (
            <span
              className={
                i === meta.crumbs.length - 1 ? "text-foreground" : undefined
              }
            >
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
