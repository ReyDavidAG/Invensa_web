import type { Tour } from "../types";

export const productDetail: Tour = {
  id: "product-detail",
  title: "Detalle de producto",
  description: "Información, stock y movimientos",
  route: "/products/[id]",
  steps: [
    {
      element: "[data-tour='product-detail']",
      popover: {
        title: "Detalles",
        description:
          "Categoría, unidad, precio de compra, precio de venta y stock actual. Esta info se llena al crear o editar el producto.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='product-movement']",
      popover: {
        title: "Registrar movimiento",
        description:
          "Suma stock por una compra, ajusta por una merma, o cuenta una salida. Cada movimiento deja un historial auditable.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='product-movements']",
      popover: {
        title: "Historial",
        description:
          "Últimos 20 movimientos del producto. Útil para entender por qué el stock cambió y detectar errores.",
        side: "top",
        align: "start",
      },
    },
  ],
};