import type { Tour } from "../types";

export const customerNew: Tour = {
  id: "customer-new",
  title: "Nuevo cliente",
  description: "Dar de alta un cliente",
  route: "/customers/new",
  steps: [
    {
      element: "input[name='name']",
      popover: {
        title: "Nombre",
        description:
          "Como identificas al cliente. Puede ser su nombre completo o el nombre de su tienda si es un negocio.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='phone']",
      popover: {
        title: "Teléfono",
        description:
          "Al menos un teléfono o correo es requerido. Lo que pongas aquí aparece en la columna de contacto del listado.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "textarea[name='notes']",
      popover: {
        title: "Notas",
        description:
          "Cualquier cosa relevante: preferencias, direcciones, condiciones de pago. Lo que te ayude a atenderlo mejor.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='customer-form-submit']",
      popover: {
        title: "Guardar",
        description:
          "Crea el cliente y te lleva a su detalle. Desde ahí puedes ver el historial de compras.",
        side: "top",
        align: "center",
      },
    },
  ],
};