import type { Tour } from "../types";

export const saleNew: Tour = {
  id: "sale-new",
  title: "Nueva venta",
  description: "Cobrar y registrar",
  route: "/sales/new",
  steps: [
    {
      element: "[data-tour='sale-client']",
      popover: {
        title: "Cliente",
        description:
          "Opcional. Si vendes a un cliente recurrente, búscalo aquí. También puedes crear uno nuevo desde el mismo buscador.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-search']",
      popover: {
        title: "Buscar productos",
        description:
          "Escribe el nombre o SKU del producto. Abajo aparecen los resultados — click para agregar al carrito.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-cart']",
      popover: {
        title: "Carrito",
        description:
          "Aquí se acumulan los productos. Cada fila tiene controles para subir o bajar la cantidad, y un botón para quitarla.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-payment']",
      popover: {
        title: "Pago",
        description:
          "Elige efectivo, transferencia o mixto. Si es efectivo, anota cuánto te dieron para calcular el cambio.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='sale-submit']",
      popover: {
        title: "Registrar venta",
        description:
          "Una vez registrado, el carrito se vacía y la venta aparece en el historial. No se puede deshacer desde aquí.",
        side: "top",
        align: "center",
      },
    },
  ],
};