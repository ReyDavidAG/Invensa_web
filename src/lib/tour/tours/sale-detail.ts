import type { Tour } from "../types";

export const saleDetail: Tour = {
  id: "sale-detail",
  title: "Detalle de venta",
  description: "Lo que se vendió",
  route: "/sales/[id]",
  steps: [
    {
      element: "[data-tour='sale-detail-header']",
      popover: {
        title: "Encabezado",
        description:
          "Fecha, folio, cliente (si lo había) y total. Este es el resumen de la venta.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-detail-items']",
      popover: {
        title: "Productos vendidos",
        description:
          "Cada línea es un producto: cantidad, precio unitario, subtotal. La suma aparece como total abajo.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-detail-totals']",
      popover: {
        title: "Totales",
        description:
          "Subtotal, descuento (si lo hubo) y total final. También ves el método de pago.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-detail-print']",
      popover: {
        title: "Imprimir ticket",
        description:
          "Genera un PDF / ticket imprimible. Útil cuando el cliente quiere comprobante.",
        side: "left",
        align: "end",
      },
    },
  ],
};