import type { Tour } from "../types";

export const customerEdit: Tour = {
  id: "customer-edit",
  title: "Editar cliente",
  description: "Modificar datos del cliente",
  route: "/customers/[id]/edit",
  steps: [
    {
      element: "input[name='name']",
      popover: {
        title: "Nombre",
        description:
          "Si el cliente te pide cambiar su nombre registrado, este es el lugar.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='phone']",
      popover: {
        title: "Contacto",
        description:
          "Actualiza el teléfono o correo cuando el cliente te avise. Esto no afecta ventas pasadas.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='customer-form-submit']",
      popover: {
        title: "Guardar cambios",
        description:
          "Aplica los cambios y vuelve al detalle del cliente.",
        side: "top",
        align: "center",
      },
    },
  ],
};