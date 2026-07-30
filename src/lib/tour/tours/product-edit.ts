import type { Tour } from "../types";

export const productEdit: Tour = {
  id: "product-edit",
  title: "Editar producto",
  description: "Modificar datos del producto",
  route: "/products/[id]/edit",
  steps: [
    {
      element: "[data-tour='product-form-image']",
      popover: {
        title: "Foto",
        description:
          "Reemplaza la foto arrastrando otra o tomándola de nuevo. La foto anterior se borra al guardar.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='code']",
      popover: {
        title: "SKU",
        description:
          "El SKU no debería cambiar si ya vendiste este producto — está atado al historial de ventas.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='product-form-submit']",
      popover: {
        title: "Guardar cambios",
        description:
          "Aplica los cambios y vuelve al detalle. Los cambios de precio no afectan ventas ya registradas.",
        side: "top",
        align: "center",
      },
    },
  ],
};