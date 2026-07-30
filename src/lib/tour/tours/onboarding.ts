import type { Tour } from "../types";

// Auto-starts on first dashboard visit. Covers app geography, not page details.
// Localized in Spanish; honest, no patronising tone.
export const onboarding: Tour = {
  id: "onboarding",
  title: "Bienvenida a Invensa",
  description: "Recorrido rápido por la app",
  route: "/dashboard",
  steps: [
    {
      popover: {
        title: "Hola, esto es Invensa",
        description:
          "Tu sistema para registrar ventas, controlar inventario y cerrar la caja cada día. Te mostraremos lo principal en cinco pasos.",
      },
    },
    {
      element: "[data-slot='sidebar']",
      popover: {
        title: "Tu menú principal",
        description:
          "Aquí encuentras Inicio, Productos, Ventas, Clientes, Cierre de caja y Reportes. Lo que más uses, queda a un click.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='bell']",
      popover: {
        title: "Notificaciones",
        description:
          "Te avisamos cuando un producto baja de su stock mínimo o cuando la caja del día sigue abierta. La campanita se pone roja cuando hay algo nuevo.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='help']",
      popover: {
        title: "Ayuda cuando la necesites",
        description:
          "Este ícono de pregunta te trae de vuelta a cualquier tour, por página. No tienes que memorizar nada.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='dashboard-cards']",
      popover: {
        title: "Resumen del día",
        description:
          "Aquí ves ventas del día, alertas de stock bajo y el estado del cierre de caja. Si todo está en verde, tu día va bien.",
        side: "bottom",
        align: "start",
      },
    },
    {
      popover: {
        title: "Listo, empieza",
        description:
          "Si quieres repasar algo más, abre el ícono de ayuda en la esquina superior derecha. Cualquier tour se puede lanzar cuando quieras.",
      },
    },
  ],
};