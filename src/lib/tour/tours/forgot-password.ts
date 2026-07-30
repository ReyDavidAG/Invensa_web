import type { Tour } from "../types";

export const forgotPassword: Tour = {
  id: "forgot-password",
  title: "Recuperar acceso",
  description: "Restablecer contraseña por correo",
  route: "/forgot-password",
  steps: [
    {
      element: "input[name='email']",
      popover: {
        title: "Tu correo",
        description:
          "Escribe el correo con el que te registraste. Te enviaremos un enlace para crear una contraseña nueva.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[data-tour='forgot-submit']",
      popover: {
        title: "Enviar enlace",
        description:
          "Si el correo está registrado, recibirás un mensaje en pocos minutos. Revisa también la bandeja de no deseados.",
        side: "top",
        align: "center",
      },
    },
  ],
};