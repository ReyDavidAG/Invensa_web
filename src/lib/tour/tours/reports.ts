import type { Tour } from "../types";

export const reports: Tour = {
  id: "reports",
  title: "Reportes",
  description: "Métricas de tu tienda",
  route: "/reports",
  steps: [
    {
      element: "[data-tour='report-period']",
      popover: {
        title: "Período",
        description:
          "Cambia entre hoy, últimos 7 días o últimos 30 días. Todo el reporte se recalcula al instante.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='report-kpis']",
      popover: {
        title: "Indicadores",
        description:
          "Cuatro números: ventas totales, ticket promedio, número de ventas y clientes únicos del período.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='report-chart']",
      popover: {
        title: "Ventas por día",
        description:
          "Últimos 14 días en barras. Sirve para ver qué días vendiste más y planificar inventario o turnos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='report-top-products']",
      popover: {
        title: "Productos más vendidos",
        description:
          "Top 5 del período por ingresos. Útil para decidir qué reponer primero y qué promociones armar.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='report-stock']",
      popover: {
        title: "Stock bajo",
        description:
          "Productos con stock por debajo de su umbral. Esto te dice qué reponer antes de quedarte sin nada.",
        side: "left",
        align: "start",
      },
    },
  ],
};