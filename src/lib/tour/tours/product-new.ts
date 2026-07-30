import type { Tour } from "../types";

export const productNew: Tour = {
  id: "product-new",
  title: "Nuevo producto",
  description: "Dar de alta en inventario",
  route: "/products/new",
  steps: [
    {
      element: "[data-tour='product-form-image']",
      popover: {
        title: "Foto",
        description:
          "Sube una foto clara del producto. Si el dispositivo tiene cámara, también puedes tomarla directo desde aquí.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='code']",
      popover: {
        title: "SKU",
        description:
          "Código único corto para buscar el producto al cobrar. Ejemplo: PZA-001.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='priceSale']",
      popover: {
        title: "Precio de venta",
        description:
          "Lo que cobras al cliente. El de compra está al lado — la diferencia es tu margen.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "input[name='stockLowThreshold']",
      popover: {
        title: "Umbral de stock bajo",
        description:
          "Cuando el stock baje a este número (o menos), el sistema te avisa por la campanita.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='product-form-submit']",
      popover: {
        title: "Guardar",
        description:
          "Crea el producto y te lleva a su detalle. Desde ahí puedes ajustar stock o editar lo que quieras.",
        side: "top",
        align: "center",
      },
    },
  ],
};