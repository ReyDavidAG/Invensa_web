import type { Tour } from "../types";

export const resetPassword: Tour = {
  id: "reset-password",
  title: "Nueva contraseña",
  description: "Restablecer después del enlace",
  route: "/reset-password",
  steps: [
    {
      element: "input[name='password']",
      popover: {
        title: "Nueva contraseña",
        description:
          "Mínimo 8 caracteres. Evita contraseñas que hayas usado antes en otros servicios.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='confirmPassword']",
      popover: {
        title: "Confirma la contraseña",
        description:
          "Escribe la misma contraseña otra vez. Esto evita errores de dedo al escribir.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='reset-submit']",
      popover: {
        title: "Guardar y entrar",
        description:
          "Al guardar, se cierra cualquier sesión activa y entras con la contraseña nueva.",
        side: "top",
        align: "center",
      },
    },
  ],
};