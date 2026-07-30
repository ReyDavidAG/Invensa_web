import type { Tour } from "../types";

// Login uses CSS attribute selectors (input[name="..."]) rather than
// data-tour attributes — the form is wrapped in shared InputFormField
// components we don't want to modify for tour purposes.
export const login: Tour = {
  id: "login",
  title: "Iniciar sesión",
  description: "Acceso al panel",
  route: "/login",
  steps: [
    {
      element: "input[name='email']",
      popover: {
        title: "Correo electrónico",
        description:
          "Usa el correo con el que te registró el administrador. Si no lo recuerdas, contacta al dueño de la tienda.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='password']",
      popover: {
        title: "Contraseña",
        description:
          "Si la olvidaste, usa el enlace de abajo para recuperarla. Si no tienes cuenta, pide al administrador que te cree una.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "[href='/forgot-password']",
      popover: {
        title: "¿Olvidaste tu contraseña?",
        description:
          "Te enviaremos un enlace de recuperación al correo registrado. Revisa también la bandeja de no deseados.",
        side: "top",
        align: "center",
      },
    },
  ],
};