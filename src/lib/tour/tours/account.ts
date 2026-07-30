import type { Tour } from "../types";

export const account: Tour = {
  id: "account",
  title: "Cuenta",
  description: "Tu perfil y sesión",
  route: "/account",
  steps: [
    {
      element: "[data-tour='account-profile']",
      popover: {
        title: "Tu perfil",
        description:
          "Aquí ves tu nombre, correo y rol. El rol lo asigna el administrador; si crees que está mal, pídele que lo cambie.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='account-edit-name']",
      popover: {
        title: "Editar nombre",
        description:
          "Cambia cómo te ven los demás en el sistema. El correo no se puede cambiar desde aquí — pide al administrador.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='account-password']",
      popover: {
        title: "Cambiar contraseña",
        description:
          "Escribe tu contraseña actual y la nueva dos veces. Si la olvidaste, pide al administrador que la reinicie.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "[data-tour='account-signout']",
      popover: {
        title: "Cerrar sesión",
        description:
          "Te desconecta de este dispositivo. Si compartes la computadora, ciérrala al terminar tu turno.",
        side: "top",
        align: "center",
      },
    },
  ],
};