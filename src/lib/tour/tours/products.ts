import type { Tour } from "../types";

export const products: Tour = {
  id: "products",
  title: "Productos",
  description: "Tu inventario",
  route: "/products",
  steps: [
    {
      element: "[data-tour='product-create']",
      popover: {
        title: "Nuevo producto",
        description:
          "Da de alta un producto con su SKU, precio, stock y una foto. La foto ayuda a identificarlo en el teléfono.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='product-search']",
      popover: {
        title: "Buscar",
        description:
          "Filtra por nombre, SKU o descripción. Escribe y la lista se reduce en vivo.",
      },
    },
    {
      element: "[data-tour='product-filters']",
      popover: {
        title: "Filtros",
        description:
          "Por categoría, por stock bajo, o solo inactivos. Combina con la búsqueda para acotar más.",
      },
    },
    {
      element: "[data-tour='product-table']",
      popover: {
        title: "Tu inventario",
        description:
          "SKU, nombre, precio, stock y estado. El stock en rojo está por debajo del mínimo configurado.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "[data-tour='product-row']",
      popover: {
        title: "Detalle y edición",
        description:
          "Click en una fila para ver el detalle, editar precio o ajustar stock. La foto se puede reemplazar desde ahí.",
        side: "left",
        align: "start",
      },
    },
  ],
};