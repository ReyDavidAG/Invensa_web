import type { Tour } from "../types";

export const register: Tour = {
  id: "register",
  title: "Crear cuenta",
  description: "Registro de usuario nuevo",
  route: "/register",
  steps: [
    {
      element: "input[name='fullName']",
      popover: {
        title: "Tu nombre",
        description:
          "Aparece en el saludo del dashboard y en tu avatar. Usa el nombre con el que tus compañeros te reconocen.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='password']",
      popover: {
        title: "Contraseña",
        description:
          "Mínimo 8 caracteres. Usa algo que recuerdes pero que otros no adivinen.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "input[name='confirmPassword']",
      popover: {
        title: "Confirma la contraseña",
        description:
          "Escribe la misma contraseña otra vez. Si no coincide, el formulario te avisa antes de enviar.",
        side: "right",
        align: "start",
      },
    },
  ],
};