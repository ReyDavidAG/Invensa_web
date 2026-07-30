import type { Tour } from "../types";

export const customers: Tour = {
  id: "customers",
  title: "Clientes",
  description: "Tu cartera de compradores",
  route: "/customers",
  steps: [
    {
      element: "[data-tour='customer-search']",
      popover: {
        title: "Buscar",
        description:
          "Filtra por nombre, teléfono o correo. La lista se actualiza en vivo mientras escribes.",
      },
    },
    {
      element: "[data-tour='customer-create']",
      popover: {
        title: "Nuevo cliente",
        description:
          "Da de alta a un cliente con su nombre y al menos un teléfono. El resto de los datos es opcional.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='customer-table']",
      popover: {
        title: "Listado",
        description:
          "Nombre, contacto, estado y total acumulado. Click en una fila para abrir el detalle del cliente.",
        side: "top",
        align: "start",
      },
    },
  ],
};