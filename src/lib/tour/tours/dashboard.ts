import type { Tour } from "../types";

export const dashboard: Tour = {
  id: "dashboard",
  title: "Dashboard",
  description: "Tu resumen diario",
  route: "/dashboard",
  steps: [
    {
      element: "[data-tour='dashboard-cards']",
      popover: {
        title: "Indicadores del día",
        description:
          "Tres tarjetas arriba: ventas del día, alertas de stock bajo y estado del cierre de caja. El color refleja el estado, no un ranking.",
      },
    },
    {
      element: "[data-tour='dashboard-cash']",
      popover: {
        title: "Cierre de caja del día",
        description:
          "Verde significa que la caja ya está cerrada. Ámbar o rojo, que aún no la has cerrado o que la diferencia no cuadra. Click para ir al cierre.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='dashboard-lowstock']",
      popover: {
        title: "Productos por agotarse",
        description:
          "Lista los productos con stock por debajo de su umbral configurado. Click te lleva a Productos con el filtro activo.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='dashboard-top']",
      popover: {
        title: "Productos más vendidos",
        description:
          "Top del día por unidades vendidas. Útil para saber qué reponer primero mañana.",
        side: "top",
        align: "start",
      },
    },
  ],
};