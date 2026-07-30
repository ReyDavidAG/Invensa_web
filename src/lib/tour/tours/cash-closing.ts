import type { Tour } from "../types";

export const cashClosing: Tour = {
  id: "cash-closing",
  title: "Cierre de caja",
  description: "Cuadrar el efectivo del día",
  route: "/cash-closing",
  steps: [
    {
      element: "[data-tour='cash-expected']",
      popover: {
        title: "Esperado en caja",
        description:
          "Es la suma de todas las ventas en efectivo del día. Se recalcula en vivo mientras registras ventas, así que el número se mantiene al día.",
      },
    },
    {
      element: "[data-tour='cash-counted']",
      popover: {
        title: "Contado en caja",
        description:
          "Cuenta el dinero físico en el cajón y anota el total aquí. Si la diferencia es ±$5 entra como advertencia, más allá como descuadre.",
      },
    },
    {
      element: "[data-tour='cash-status']",
      popover: {
        title: "Diferencia",
        description:
          "Aparece al cerrar. Verde si cuadra, ámbar si hay una diferencia menor, rojo si no cuadra o si la caja quedó abierta de un día anterior.",
      },
    },
    {
      element: "[data-tour='cash-submit']",
      popover: {
        title: "Cerrar caja del día",
        description:
          "Una vez cerrada, no se puede volver a abrir el mismo día. Si te equivocaste, contacta al administrador.",
      },
    },
  ],
};